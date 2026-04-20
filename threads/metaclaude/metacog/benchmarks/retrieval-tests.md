---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:16:44.100Z
---
# Retrieval Test Cases

Handcrafted queries with expected retrieval targets. Used to validate
the embedding index after build and after re-indexing.

Each test has two query variants:
- **Fast query:** Raw transcript excerpt (what gets embedded in Fast
  mode — actual conversation text, not a summary)
- **Deep query:** Summary/analytical query (what a model might generate
  in Deep/Probe mode — targeted, grounded in knowledge of the learner)

Expected results include source paths — validating the breadcrumb
trail from index metadata through to retrieval output.

---

## Validation rules

Tests must check three things, not just content relevance:

1. **Result count matches top-K.** If `--top 3` is passed, exactly 3
   (or fewer, if the index has fewer matches above threshold) results
   must be returned. A test that receives more results than requested
   indicates an API contract violation — the consuming agent's context
   budget depends on this limit being enforced.

2. **Payload stays within budget.** Total text across all returned
   chunks must not exceed ~2500 characters (the meta-agent's retrieval
   context budget). If average chunk size × top-K exceeds this, either
   top-K must be reduced or chunks must be truncated at retrieval time.
   The meta-agent prompt allocates a finite portion of its context to
   retrieved content — overflow crowds out the transcript window and
   accumulator, degrading observation quality.

3. **Content relevance.** At least 1 expected target appears in the
   returned results. This is what the original tests checked — it
   remains necessary but is not sufficient on its own.

**Why all three matter:** A retrieval layer that returns relevant
content but ignores count limits will silently degrade the downstream
agent. The meta-agent receives recent turns + accumulator + retrieved
chunks + system prompt. If retrieval returns 200 chunks instead of 3,
the model either truncates its own input (losing the transcript it
needs to observe) or produces worse output from an overwhelmed context.
The Vectra topK bug (fixed 2026-03-10) demonstrated this failure mode —
the API appeared to work, content was relevant, but result count was
unbounded.

### Running tests

```bash
# Single query (manual)
bun weft/tools/metaclaude/embedding/query.ts --top 3 --threshold 0.65 "query text"

# Verify: output line "N results for:" — N must equal top-K or fewer
# Verify: at least 1 expected source appears in results
# Verify: total output text fits in ~2000 chars
```

Broader test with real session transcripts:
`metacog/benchmarks/retrieval-quality-test.md`

---

## Test 1: Growth edge retrieval

**Trigger tested:** "A pattern in the user's thinking is visible from
your vantage that Builder Claude hasn't surfaced"
**Alignment criterion:** Well-aimed, edge-calibrated

**Fast query:** "User: I don't get where the Provider is supposed to
go. Like, does it wrap the whole app or just the component that needs
it? Assistant: Great question. The Provider component goes at the level
where all consumers below it can access the value..."

**Deep query:** "React Context provider/consumer pattern — learner's
current level and gap type"

**Expected top results (at least 1 in top 3):**
- `learning/current-state.md` — React Context concept entry (score: 2,
  conceptual gap). Source path: `learning/current-state.md`
- `learning/arcs.md` — react-fundamentals arc ("Context is the active
  growth edge — provider/consumer pattern not yet internalized").
  Source path: `learning/arcs.md`

**What this tests:** Can the index connect a live coding struggle to
the learner's tracked developmental state? Does the source path come
through?

---

## Test 2: Correct shape, wrong boundary

**Trigger tested:** "A pattern in the user's thinking is visible from
your vantage that Builder Claude hasn't surfaced"
**Alignment criterion:** Well-matched (gap type identification)

**Fast query:** "User: I put the bcrypt hash in the React component,
why is that wrong? Assistant: Hashing on the client exposes your
hashing logic and salt. The server should handle password hashing
because..."

**Deep query:** "User placing operations on wrong side of
client/server boundary — is this a known pattern?"

**Expected top results (at least 1 in top 3):**
- `learning/current-state.md` — browser-security-model (score: 2,
  conceptual gap — "identified SSRF vulnerability unprompted but could
  not name it"). Source path: `learning/current-state.md`
- `learning/arcs.md` — web-security arc or react-fundamentals arc
  (boundary between client and server responsibilities).
  Source path: `learning/arcs.md`

**What this tests:** Can the index surface relevant learning state
when the session exhibits a known learner pattern (boundary confusion)?
Note: the "correct shape, wrong boundary" pattern description itself
lives in CLAUDE.md (already in the meta-agent's system prompt, not
indexed). The index should surface the *evidence* — tracked scores
and arc state — not the pattern label.

---

## Test 3: Design principle — user agency

**Trigger tested:** "Builder Claude has lost track of something
established earlier" (the user's role as driver)
**Alignment criterion:** Human-driven

**Fast query:** "Assistant: I'll also add error handling for the edge
cases, refactor the utils into a shared module, and set up the test
scaffolding. [tools: Write x3, Edit x2, Bash x1] Assistant: Done! I've
restructured the project with proper error handling, a shared utils
module, and test setup."

**Deep query:** "Builder Claude acting autonomously without user
direction — which design principles govern user agency?"

**Expected top results (at least 1 in top 3):**
- `design/design-principles.md` — boundary condition ("the system
  supplements human learning in relationship — it does not replace it")
  or the primary layer principle about attention/agency.
  Source path: `design/design-principles.md`
- `notepad/009-metaclaude-conscience.md` — reflection on observer
  agent ethics and protecting user agency.
  Source path: `notepad/009-metaclaude-conscience.md`

**What this tests:** Can the index connect a behavioral observation
(loss of user agency) to the governing design principles and the
meta-agent's own design rationale?

---

## Test 4: Recall gap — circling on syntax

**Trigger tested:** "Builder Claude is circling (repeating approaches,
not making progress)"
**Alignment criterion:** Well-matched (recall gap needs reps, not
explanation)

**Fast query:** "User: let me try again... type Props = { items:
string[] }... no wait. User: okay what about interface Props { items:
Array<string> }... ugh. User: I know how this is supposed to work
I just can't remember the exact syntax for the generic."

**Deep query:** "User circling on TypeScript type syntax — gap type
and recommended intervention"

**Expected top results (at least 1 in top 3):**
- `learning/arcs.md` — typescript arc ("correct shape, can't reproduce
  the tokens. Syntax drills, not more conceptual work").
  Source path: `learning/arcs.md`
- `learning/current-state.md` — typescript-type-system (score: 3,
  recall gap) or related TS concepts.
  Source path: `learning/current-state.md`

**What this tests:** Can the index surface the gap type classification
(recall, not conceptual) so the meta-agent can recommend the right
intervention (reps, not explanation)?

---

## Test 5: Cross-domain retrieval

**Trigger tested:** "A tool, file, or approach is clearly relevant but
hasn't been considered"
**Alignment criterion:** Well-aimed (connecting to prior experience)

**Fast query:** "User: I need to handle what happens when a player
disconnects mid-game. Like do I keep their state on the server and
let them reconnect, or do I tell the other players they left?
Assistant: There are a few patterns for this. The simplest is..."

**Deep query:** "Player disconnection/reconnection in multiplayer
game — learner's prior experience with real-time state management"

**Expected top results (at least 1 in top 3):**
- `learning/arcs.md` — state-management arc ("Strong in real-time game
  state; untested in form-heavy or CRUD patterns").
  Source path: `learning/arcs.md`
- `learning/current-state.md` — client-server-state-sync (score: 4,
  from WebSocket game architecture).
  Source path: `learning/current-state.md`
- `learning/arcs.md` — game-design arc (scoring algorithms, state
  machines, cooperative dynamics).
  Source path: `learning/arcs.md`

**What this tests:** Can the index find relevant prior experience
across multiple learning state entries when a session touches a topic
the learner has worked on before?

---

## Test 6: Drift from stated goal

**Trigger tested:** "The conversation has drifted from the user's
stated or implied goal"
**Alignment criterion:** Well-aimed

**Fast query:** "User: I need to finish the API routes for the group
project, we have a deadline tomorrow. Assistant: Sure, let me help
with those routes. [tools: Read x2, Edit x1] Assistant: Actually,
while I was looking at the code I noticed the database schema could
be improved. Let me refactor... [tools: Edit x4, Write x1]"

**Deep query:** "Session drifting from user's stated priority —
what are the user's current goals and deadlines?"

**Expected top results (at least 1 in top 3):**
- `learning/goals.md` — relevant goal section (sustainable income /
  bootcamp priorities). Source path: `learning/goals.md`
- `learning/arcs.md` — express-fundamentals or http-and-apis arc
  (the domain the user asked to work in).
  Source path: `learning/arcs.md`

**What this tests:** Can the index surface the learner's stated goals
and priorities to help detect when a session drifts from what matters?

---

## Test 7: Altitude confusion

**Trigger tested:** "A pattern in the user's thinking is visible from
your vantage that Builder Claude hasn't surfaced"
**Alignment criterion:** Well-composed (right altitude)

**Fast query:** "User: I'm trying to figure out which database to use
for this project. Let me look at the PostgreSQL wire protocol docs...
[tools: WebFetch x2, Read x3] User: okay so the binary message format
uses a 32-bit length prefix followed by... Assistant: Let me help you
understand the wire protocol structure..."

**Deep query:** "User zoomed into implementation detail when the task
is architectural evaluation — relevant developmental patterns or
reference material"

**Expected top results (at least 1 in top 3):**
- `.claude/references/developmental-model.md` — MHC stages or section
  about matching complexity level to the task.
  Source path: `.claude/references/developmental-model.md`
- `.claude/references/context-patterns.md` — a pattern about
  progressive complexity or scope management.
  Source path: `.claude/references/context-patterns.md`
- `design/design-principles.md` — principle about attention being
  directed at the right altitude.
  Source path: `design/design-principles.md`

**What this tests:** Can the index surface reference material about
developmental complexity or attention management when the session
exhibits altitude confusion? This tests retrieval from the reference
docs — a source category not covered by other tests.
