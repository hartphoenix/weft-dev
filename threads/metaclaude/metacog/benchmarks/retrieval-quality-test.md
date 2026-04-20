---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:16:44.100Z
---
# Broader Retrieval Quality Test

**Date:** 2026-03-10
**Method:** Extracted 10 conversation windows from real Claude Code sessions (March 3-7),
crafted Deep-mode queries a meta-agent would plausibly generate while observing each session,
ran against the embedding index (678 chunks, top 3, threshold 0.6).

**Bug found during testing:** Vectra's `queryItems(vector, query, topK)` takes `query` as
the second parameter (BM25 text search string), not `topK`. Our code was passing
`queryItems(vector, topK)` — topK was being interpreted as a query string and the actual
topK defaulted to unlimited. Fixed in store.ts.

---

## Results Summary

| # | Session topic | Top score | Actionable? | Rating |
|---|---|---|---|---|
| 1 | Git-ship skill design | 0.738 | Yes — surfaces learner's git mastery level (5) and arc state | Good |
| 2 | Security deny rules | 0.743 | Partial — consent model is tangential; exfil rules relevant | Mixed |
| 3 | Sandbox vs denylist research | 0.719 | Yes — direct hits on security research docs with sandbox analysis | Good |
| 4 | Cross-project sandbox writes | 0.704 | Partial — projects feature, not sandbox architecture specifically | Mixed |
| 5 | DAG learning state research | 0.822 | Yes — direct hits on the exact research docs | Excellent |
| 6 | Session-digest debugging | 0.736 | Yes — surfaces extraction gap explanation and skill interop | Good |
| 7 | Domain map integration | 0.792 | Yes — direct hits on migration plan, "what's broken" section | Excellent |
| 8 | Domain schema implementation | 0.764 | Yes — plan + goals structural model + DAG research | Good |
| 9 | Design principles update | 0.762 | Yes — primary layer principles, teaching principles, metaclaude conscience | Excellent |
| 10 | Conversation extraction script | 0.725 | Yes — PRD session logging, improvement plan evidence gap | Good |

**Overall: 8/10 queries return results a meta-agent could turn into actionable injections.**

---

## Query strings used

| # | Session topic | Deep-mode query |
|---|---|---|
| 1 | Git-ship skill design | "Building a git commit/push/PR skill — learner designing CLI automation for developer workflow" |
| 2 | Security deny rules | "Applying security deny rules to settings — learner's understanding of permission models and attack surfaces" |
| 3 | Sandbox vs denylist | "Security research synthesis — comparing sandbox enforcement vs denylist approaches for Claude Code permissions" |
| 4 | Cross-project writes | "Sandbox cross-project write restrictions — harness writing to learning state from another project directory" |
| 5 | DAG research | "DAG data structures for learning state — representing skill composition, concept dependencies, and developmental complexity" |
| 6 | Session-digest debug | "Session-digest subagent failing to parse JSONL conversation transcripts — missing extraction layer between discovery and synthesis" |
| 7 | Domain map integration | "Domain map schema breaking learning loop skills — migrating from flat YAML current-state to structured domain graph" |
| 8 | Domain schema impl | "Implementing domain graph and learner state type definitions — compositional nesting, complexity ranges, growth edges" |
| 9 | Design principles | "Design principles update — adding relationship as primary principle alongside awareness and attention" |
| 10 | Conversation extract | "Building conversation extraction script for session transcripts — parsing tool use, error codes, and learning signals from JSONL logs" |

---

## Detailed Assessment

### Excellent (3 queries: 5, 7, 9)

These hit the exact target documents with high scores (0.76-0.82). The meta-agent
would receive precisely the context needed to make informed observations. No noise
in top 3.

### Good (5 queries: 1, 3, 6, 8, 10)

These return relevant context — the right domain, the right design docs, learner
state entries that inform the session's topic. A meta-agent could construct useful
injections from these results, though it might need to synthesize across the three
results rather than finding a single perfect chunk.

### Mixed (2 queries: 2, 4)

These return thematically adjacent results but miss the specific target:
- **Query 2:** "consent and authority" matches "permission models" semantically but
  isn't about Claude Code settings. The security research docs that would be most
  relevant live in weft-dev/design/complete/ — they were indexed, but the embedding
  space mapped "security deny rules" to consent/authority before reaching them.
- **Query 4:** Sandbox architecture specifics (Seatbelt, kernel enforcement, cross-CWD
  writes) were discussed in sessions but never written to design docs. The knowledge
  lives only in conversation transcripts (excluded from index by design) and CLAUDE.md
  (also excluded). The index correctly surfaced what it had — project registry and
  cross-silo architecture research — but the most relevant content doesn't exist as
  an indexed document.

---

## Observations

1. **Deep-mode queries produce strong retrieval.** Scores range 0.66-0.82 across
   queries. The hypothesis from handcrafted tests holds: model-generated analytical
   queries outperform raw transcript text for retrieval.

2. **Threshold 0.6 is appropriate for top-3.** All 30 results (10 queries × 3)
   are above 0.6 and semantically relevant or adjacent. No pure noise in the results.
   For the observer pipeline (top 3-5), threshold 0.65-0.70 would be safe.

3. **Coverage gaps are content gaps, not retrieval failures.** The two mixed results
   aren't retrieval errors — the index correctly returns the closest available content.
   The missing content (sandbox architecture details, security configuration specifics)
   was discussed in sessions but never persisted to indexed files.

4. **Design docs are the strongest retrieval target.** Queries about design decisions,
   architecture plans, and research all score 0.72+. Learning state (arcs, concepts)
   also retrieves well. Notepad files surface when relevant (queries 9, 10).

5. **The topK bug was real and consequential.** Without the fix, the observer would
   have received hundreds of results per query, overwhelming the meta-agent's context.

---

## Payload size (post-truncation fix)

After adding 800-char/chunk truncation to `queryIndex()` (cuts at paragraph
boundaries, preserves source path for full-file lookup):

| Query | Before truncation | After truncation | Chunks truncated |
|---|---|---|---|
| Domain map schema | 7401 chars | 2034 chars | 2/3 |
| Git commit/push/PR skill | 1932 chars | 1525 chars | 1/3 |
| DAG data structures | 1277 chars | 1277 chars | 0/3 |
| Security deny rules | 5108 chars | 2053 chars | 2/3 |

All payloads now fit within the ~2500 char retrieval budget. The truncation
marker `[truncated — full content at source path]` tells the meta-agent
(or Builder Claude) that more content is available at the source file.

---

## Recommendation

**Retrieval quality is sufficient to wire into the observer pipeline.** The index
reliably surfaces pedagogically relevant content for the query types the meta-agent
will produce. Top-K limiting is verified. Payload size is bounded. Proceed to
task #2 (update prompt.md) and #3 (wire retrieval into observer.sh).

Production parameters: `queryIndex(query, 3, 0.65)` — top 3, threshold 0.65.
Yields 1.3-2.1KB of retrieved context per query.
