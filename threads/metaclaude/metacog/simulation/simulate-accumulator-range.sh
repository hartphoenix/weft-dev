#!/usr/bin/env bash
# simulate-accumulator-range.sh — replay a slice of a transcript
# Usage: bash metacog/simulation/simulate-accumulator-range.sh <transcript.jsonl> <start_turn> <max_obs>
set -uo pipefail

TRANSCRIPT="${1:?Usage: simulate-accumulator-range.sh <transcript.jsonl> <start_turn> <max_obs>}"
START_TURN="${2:-0}"
MAX_OBS="${3:-30}"
PROMPT_FILE="/Users/rhhart/Documents/GitHub/weft/tools/metaclaude/prompt.md"
LOG_FILE="/Users/rhhart/Documents/GitHub/weft-dev/metacog/simulation/simulation-log-range.jsonl"
API_MODEL="qwen3-8b"

if [ ! -f "$TRANSCRIPT" ]; then echo "Transcript not found" >&2; exit 1; fi
if [ ! -f "$PROMPT_FILE" ]; then echo "Prompt not found" >&2; exit 1; fi
if ! curl -s --max-time 2 http://localhost:1234/v1/models > /dev/null 2>&1; then
    echo "LM Studio not responding" >&2; exit 1
fi

SYSTEM_PROMPT=$(cat "$PROMPT_FILE")

ALL_TURNS=$(jq -s '
    [.[] | select(.type == "user" or .type == "assistant") |
     {role: .type, content: (
         if .type == "user" then
             if (.message.content | type) == "string" then
                 .message.content | .[0:2000]
             else "" end
         else
             [(.message.content // [])[] |
              if .type == "text" then .text
              elif .type == "tool_use" then ("[" + .name + "]")
              else empty end
             ] | join("\n") | .[0:2000]
         end
     )} | select(.content | length > 0)]
' "$TRANSCRIPT" 2>/dev/null)

TOTAL=$(echo "$ALL_TURNS" | jq 'length')
echo "Transcript: $TOTAL content turns, starting from turn $START_TURN, max $MAX_OBS observations"
echo "Log: $LOG_FILE"
echo ""

> "$LOG_FILE"
ACCUMULATOR=""
OBS_NUM=0

for i in $(seq "$START_TURN" $((TOTAL - 1))); do
    ROLE=$(echo "$ALL_TURNS" | jq -r ".[$i].role")
    if [ "$ROLE" != "assistant" ]; then continue; fi

    OBS_NUM=$((OBS_NUM + 1))
    if [ "$OBS_NUM" -gt "$MAX_OBS" ]; then break; fi

    WINDOW_START=$((i - 9))
    if [ "$WINDOW_START" -lt 0 ]; then WINDOW_START=0; fi
    RECENT=$(echo "$ALL_TURNS" | jq ".[$WINDOW_START:$((i + 1))]
      | [ reduce .[] as \$item (
          [];
          if (\$item.content | test(\"^\\\\[.+\\\\]$\"))
          then
            if (length > 0 and (.[-1] | has(\"_tools\")))
            then .[-1]._tools += [\$item.content[1:-1]]
            else . + [{\"_tools\": [\$item.content[1:-1]]}]
            end
          else . + [\$item]
          end
        ) | .[] |
        if has(\"_tools\")
        then {\"role\":\"assistant\",\"content\":(._tools | group_by(.) | map(\"\(.[0]) x\(length)\") | join(\", \") | \"[tools: \(.)]\") }
        else .
        end
      ]")
    TURN_COUNT=$(echo "$RECENT" | jq '[.[] | select(.role == "user")] | length')

    USER_MESSAGE=$(jq -n \
        --argjson recent "$RECENT" \
        --argjson turn_count "$TURN_COUNT" \
        --arg accumulator "$ACCUMULATOR" \
        '{recent_turns: $recent, user_turn_count: $turn_count, accumulator: $accumulator}')

    LAST_USER=$(echo "$RECENT" | jq -r '[.[] | select(.role == "user")][-1].content // ""' | head -c 100)
    printf "[obs %02d / turn %d] user: %.80s\n" "$OBS_NUM" "$i" "$LAST_USER"

    START_S=$(date +%s)
    RAW_RESPONSE=$(curl -s --max-time 45 \
        http://localhost:1234/v1/chat/completions \
        -H "Content-Type: application/json" \
        -d "$(jq -n \
            --arg model "$API_MODEL" \
            --arg system "$SYSTEM_PROMPT" \
            --arg user "$USER_MESSAGE" \
            '{model: $model, messages: [{role: "system", content: $system}, {role: "user", content: $user}], temperature: 0.7, response_format: {type: "json_object"}}'
        )" 2>&1)
    END_S=$(date +%s)
    LATENCY=$(( (END_S - START_S) * 1000 ))

    FULL_RESPONSE=$(echo "$RAW_RESPONSE" | jq -r '.choices[0].message.content // empty' 2>/dev/null)
    if [ -z "$FULL_RESPONSE" ]; then
        echo "  [ERROR] No response"
        jq -n --argjson obs "$OBS_NUM" --argjson turn "$i" \
            --arg error "no response" --argjson latency "$LATENCY" \
            '{obs:$obs, turn:$turn, error:$error, latency_ms:$latency}' >> "$LOG_FILE"
        continue
    fi

    CLEAN_RESPONSE=$(printf '%s' "$FULL_RESPONSE" | perl -0777 -pe 's/<think>.*?<\/think>\s*//gs; s/<thinking>.*?<\/thinking>\s*//gs; s/<think>.*\z//gs; s/<thinking>.*\z//gs')

    INJECT_CONTENT=""
    CONTEXT_CONTENT=""
    PARSE_SUCCESS=false

    if echo "$CLEAN_RESPONSE" | jq empty 2>/dev/null; then
        INJECT_CONTENT=$(echo "$CLEAN_RESPONSE" | jq -r '.inject // empty')
        CONTEXT_CONTENT=$(echo "$CLEAN_RESPONSE" | jq -r '.context // empty')
        PARSE_SUCCESS=true
    else
        INJECT_CONTENT="$CLEAN_RESPONSE"
        CONTEXT_CONTENT=""
    fi

    INJECT_CONTENT=$(printf '%s' "$INJECT_CONTENT" | perl -0777 -pe 's/\A\s+//; s/\s+\z//')
    CONTEXT_CONTENT=$(printf '%s' "$CONTEXT_CONTENT" | perl -0777 -pe 's/\A\s+//; s/\s+\z//')

    DECISION="inject"
    if [ -z "$INJECT_CONTENT" ]; then
        DECISION="silent"
        INJECT_CONTENT=""
    fi

    if [ "$DECISION" = "inject" ]; then
        printf "  -> INJECT: %.140s\n" "$INJECT_CONTENT"
    else
        printf "  -> silent\n"
    fi
    if [ -n "$CONTEXT_CONTENT" ]; then
        printf "  -> ACCUM:  %.140s\n" "$CONTEXT_CONTENT"
    fi

    PREV_ACCUMULATOR="$ACCUMULATOR"
    if [ -n "$CONTEXT_CONTENT" ]; then
        ACCUMULATOR=$(printf '%s' "$CONTEXT_CONTENT" | head -c 500)
    fi

    jq -n \
        --argjson obs "$OBS_NUM" \
        --argjson turn "$i" \
        --argjson turn_count "$TURN_COUNT" \
        --arg decision "$DECISION" \
        --arg inject "$INJECT_CONTENT" \
        --arg accumulator_in "$PREV_ACCUMULATOR" \
        --arg accumulator_out "$CONTEXT_CONTENT" \
        --arg parse_success "$PARSE_SUCCESS" \
        --arg full_response "$FULL_RESPONSE" \
        --arg last_user "$LAST_USER" \
        --argjson latency "$LATENCY" \
        '{obs:$obs, turn:$turn, user_turns_in_window:$turn_count, last_user_msg:$last_user,
          decision:$decision, inject:$inject,
          accumulator_in:$accumulator_in, accumulator_out:$accumulator_out,
          parse_success:$parse_success, latency_ms:$latency,
          full_response:$full_response}' \
        >> "$LOG_FILE"
    echo ""
done

echo "=== Simulation complete ==="
echo "Observations: $OBS_NUM"

INJECT_COUNT=$(jq -s '[.[] | select(.decision == "inject")] | length' "$LOG_FILE" 2>/dev/null || echo 0)
SILENT_COUNT=$(jq -s '[.[] | select(.decision == "silent")] | length' "$LOG_FILE" 2>/dev/null || echo 0)
PARSE_OK=$(jq -s '[.[] | select(.parse_success == "true")] | length' "$LOG_FILE" 2>/dev/null || echo 0)
PARSE_FAIL=$(jq -s '[.[] | select(.parse_success == "false")] | length' "$LOG_FILE" 2>/dev/null || echo 0)
ERROR_COUNT=$(jq -s '[.[] | select(.error)] | length' "$LOG_FILE" 2>/dev/null || echo 0)
AVG_LATENCY=$(jq -s '[.[].latency_ms] | add / length | round' "$LOG_FILE" 2>/dev/null || echo "?")

echo "Injections: $INJECT_COUNT | Silent: $SILENT_COUNT | Errors: $ERROR_COUNT"
echo "Parse success: $PARSE_OK | Parse fallback: $PARSE_FAIL"
echo "Avg latency: ${AVG_LATENCY}ms"
