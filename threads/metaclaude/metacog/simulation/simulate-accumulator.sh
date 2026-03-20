#!/usr/bin/env bash
# simulate-accumulator.sh — replay a transcript through the accumulator pipeline
# Uses the real observer's transcript extraction + prompt + LM Studio inference,
# but against a saved transcript instead of a live session.
#
# Usage: bash metacog/simulation/simulate-accumulator.sh <transcript.jsonl> [max_turns]
set -uo pipefail

TRANSCRIPT="${1:?Usage: simulate-accumulator.sh <transcript.jsonl> [max_turns]}"
MAX_TURNS="${2:-999}"
PROMPT_FILE="/Users/rhhart/Documents/GitHub/weft/tools/metaclaude/prompt.md"
LOG_FILE="/Users/rhhart/Documents/GitHub/weft-dev/metacog/simulation/simulation-log.jsonl"
API_MODEL="qwen3-8b"  # medium-local

if [ ! -f "$TRANSCRIPT" ]; then
    echo "Transcript not found: $TRANSCRIPT" >&2
    exit 1
fi
if [ ! -f "$PROMPT_FILE" ]; then
    echo "Prompt not found: $PROMPT_FILE" >&2
    exit 1
fi

# Check LM Studio is running
if ! curl -s --max-time 2 http://localhost:1234/v1/models > /dev/null 2>&1; then
    echo "LM Studio not responding on localhost:1234" >&2
    exit 1
fi

SYSTEM_PROMPT=$(cat "$PROMPT_FILE")

# Extract all conversation turns (same logic as observer.sh)
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
echo "Transcript has $TOTAL content turns"
echo "Simulating with max $MAX_TURNS observation points"
echo "Logging to: $LOG_FILE"
echo ""

# Clear log
> "$LOG_FILE"

ACCUMULATOR=""
OBS_NUM=0

# Step through the transcript, making an observation after each user turn
# (matching when the real observer fires — after each assistant response)
for i in $(seq 0 $((TOTAL - 1))); do
    ROLE=$(echo "$ALL_TURNS" | jq -r ".[$i].role")

    # Only observe after assistant turns (that's when the Stop hook fires)
    if [ "$ROLE" != "assistant" ]; then
        continue
    fi

    OBS_NUM=$((OBS_NUM + 1))
    if [ "$OBS_NUM" -gt "$MAX_TURNS" ]; then
        break
    fi

    # Build the sliding window: last 10 turns up to and including this one
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

    # Compose payload (matches observer.sh)
    USER_MESSAGE=$(jq -n \
        --argjson recent "$RECENT" \
        --argjson turn_count "$TURN_COUNT" \
        --arg accumulator "$ACCUMULATOR" \
        '{recent_turns: $recent, user_turn_count: $turn_count, accumulator: $accumulator}')

    # Show progress
    LAST_USER=$(echo "$RECENT" | jq -r '[.[] | select(.role == "user")][-1].content // ""' | head -c 100)
    printf "[obs %02d / turn %d] user: %.80s\n" "$OBS_NUM" "$i" "$LAST_USER"

    # Call LM Studio
    START_S=$(date +%s)
    RAW_RESPONSE=$(curl -s --max-time 30 \
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
        echo "  [ERROR] No response from model"
        jq -n --argjson obs "$OBS_NUM" --argjson turn "$i" \
            --arg error "no response" --argjson latency "$LATENCY" \
            '{obs:$obs, turn:$turn, error:$error, latency_ms:$latency}' >> "$LOG_FILE"
        continue
    fi

    # Strip thinking tags
    CLEAN_RESPONSE=$(printf '%s' "$FULL_RESPONSE" | perl -0777 -pe 's/<think>.*?<\/think>\s*//gs; s/<thinking>.*?<\/thinking>\s*//gs; s/<think>.*\z//gs; s/<thinking>.*\z//gs')

    # Parse JSON response (matches updated observer.sh)
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
    fi

    # Display
    if [ "$DECISION" = "inject" ]; then
        printf "  -> INJECT: %.120s\n" "$INJECT_CONTENT"
    else
        printf "  -> silent\n"
    fi
    if [ -n "$CONTEXT_CONTENT" ]; then
        printf "  -> ACCUM:  %.120s\n" "$CONTEXT_CONTENT"
    fi

    # Update accumulator
    PREV_ACCUMULATOR="$ACCUMULATOR"
    if [ -n "$CONTEXT_CONTENT" ]; then
        # Apply the 500-byte cap
        ACCUMULATOR=$(printf '%s' "$CONTEXT_CONTENT" | head -c 500)
    fi

    # Log
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
echo "Log: $LOG_FILE"

# Summary stats
INJECT_COUNT=$(jq -s '[.[] | select(.decision == "inject")] | length' "$LOG_FILE")
SILENT_COUNT=$(jq -s '[.[] | select(.decision == "silent")] | length' "$LOG_FILE")
PARSE_OK=$(jq -s '[.[] | select(.parse_success == "true")] | length' "$LOG_FILE")
PARSE_FAIL=$(jq -s '[.[] | select(.parse_success == "false")] | length' "$LOG_FILE")
AVG_LATENCY=$(jq -s '[.[].latency_ms] | add / length | round' "$LOG_FILE")

echo ""
echo "Injections: $INJECT_COUNT | Silent: $SILENT_COUNT"
echo "Parse success: $PARSE_OK | Parse fallback: $PARSE_FAIL"
echo "Avg latency: ${AVG_LATENCY}ms"
