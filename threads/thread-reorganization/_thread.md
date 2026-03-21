# Thread Reorganization

**Status:** active
**Branch:** hart/plan-routing-convention
**Last touched:** 2026-03-20
**Next action:** Design decision-capture convention for _thread.md

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## Reading order
1. [[thread-reorganization-plan]] — Full plan: problem diagnosis,
   PARA structure, file move tables, phase definitions (current)
2. [[phase4-desire-path-analysis]] — Phase 4 plan: session analysis
   methodology, sampling strategy, execution approach (current)
3. [[desire-path-synthesis]] — Phase 4 findings: 43-session analysis,
   3 desire paths, 23 answered questions, design constraints (current)
4. `phase4-working/` — Raw analysis: 8 batch reports, 43 session
   extracts, extraction manifest (working data, not for reading)
5. [[claude-md-infrastructure-plan]] — CLAUDE.md infrastructure layer:
   what to add, design decisions, excluded candidates (applied 2026-03-17)
6. [[newthread-skill-plan]] — /newthread skill design: survey, scope,
   propose, initialize. Implemented at `weft/.claude/skills/newthread/` (current)
7. [[2026-03-20-plan-routing-convention]] — Plan routing: two-layer
   approach (CLAUDE.md convention + /route scanning `_plans/`), research
   findings on Claude Code plan-mode internals, catch basin (current)

## Phase status
- **Phase 1:** Done — _thread.md files written for 7 threads
- **Phase 1b:** Done — CLAUDE.md thread conventions added
- **Phase 2:** Done — files consolidated into thread directories
- **Phase 3:** Done — archive, resources, infrastructure consolidated
- **Phase 3b:** Done — roger cleanup
- **Phase 3c:** Done — weft-dev legacy cleanup
- **Phase 4:** In progress — desire path analysis complete, /newthread
  skill written, /route skill written, plan routing convention
  implemented. Remaining: decision-capture convention, startwork
  examination, loose thread anchoring.
- **Phase 5:** Not started — generalize for weft users
- **Phase 6:** Not started — context engineering curriculum

## Open questions
- How should startwork be modularized or redesigned? Its session-opening
  briefing is used in 2/43 sessions. Its value may be in producing
  thread-state documents, not in the ceremony. Needs deep examination.
- What's the right convention for agent-triggered decision capture
  in _thread.md? Should be automatic when the user verbalizes a design
  decision, not reliant on user remembering to maintain state.
- "Loose threads" — design conversations that produce no artifact
  (b0d99b4d, 7d349d48, f7be7ace). How do we retrieve and anchor these?
  The session logs exist but the design reasoning isn't surfaced.

## Decisions made
- 2026-03-16: Delete /persist skill — invoked in 1/43 sessions, the
  routing convention in CLAUDE.md already handles artifact placement.
- 2026-03-16: Delete /handoff-prompt skill — if something is worth
  handing off, it should be the plan or PRD itself, tested with
  /handoff-test. Handoff-to-stdout is fragile and rarely reused.
- 2026-03-16: Phase 4 desire path analysis reveals three dominant
  workflows: plan-as-session-spine (~30/43), investigation-then-plan
  (~8-10/43), design-conversation-with-no-artifact (~5-8/43). The
  third is the most vulnerable — entire architectures designed in
  conversation with no persistent trace.
- 2026-03-16: Plan-mode random-slug naming is a real pain point.
  Plan artifacts should land in thread directories with descriptive
  names, not at ~/.claude/plans/jiggly-wibbling-blanket.md.
- 2026-03-16: /handoff-test is the most valuable end-of-session
  intervention — finds real gaps every time it runs. Keep and invest.
- 2026-03-17: CLAUDE.md describes philosophy but not machinery.
  Infrastructure facts (config location, hooks, scripts, repo
  boundaries, thread conventions) belong in CLAUDE.md as pointers.
  Architecture docs, skill inventories, and feature registries don't —
  they're discoverable or already pointed to.
- 2026-03-17: /handoff-test updated with Phase 1 (context harvest) and
  Phase 2 (persist into artifacts). Catch basin population is now
  /handoff-test's job; /route processes the results. Chain:
  /handoff-test → catch basin → /route.
- 2026-03-20: _routing.md format implemented (weft-dev and roger both
  have `threads/_routing.md` with thread tables, type-based routing
  rules, naming conventions, and unsorted buckets).
- 2026-03-20: /newthread skill written (`weft/.claude/skills/newthread/`).
  Multi-project thread discovery: CWD `threads/` + `{learningRoot}/threads/`
  + explicit `threadRoots` config. Exclusive resources relocate into
  thread dir; shared resources get referenced. _routing.md updated if
  present, skipped if absent.
- 2026-03-20: Plan routing convention: CLAUDE.md convention makes each
  plan's first step write itself to the active thread's directory (or
  `threads/_plans/` if no thread matches). /route scans `_plans/` for
  orphaned plans. Two layers: convention → skill. `plansDirectory`
  setting dropped — project-level `settings.json` has override-vs-merge
  bug with global settings.

## Loose threads to anchor
Sessions containing substantial design work with no persistent artifact.
These need to be retrieved, summarized, and their decisions anchored
in the appropriate thread's _thread.md.

- `b0d99b4d` (2026-03-06) — Learning state redesign: JSON source of
  truth + bun scripts + derived views architecture. 90 minutes, no
  artifact. Belongs to: domain-graph or a new learning-state thread.
  Log: `/Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/b0d99b4d-8c9b-44cb-893f-b4c8dc370556.jsonl`
- `7d349d48` (2026-03-13) — HydraDB Cortex whitepaper review, agentic
  memory comparison. No artifact. Belongs to: memory-architecture.
  Log: `/Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/7d349d48-397a-4381-bac2-714820d576fd.jsonl`
- `f7be7ace` (2026-02-19) — Authentic Tech / agentic engineering
  analysis, "correct shape, wrong boundary" reframing, MHC integration.
  Belongs to: design principles or a new thread.
  Log: `/Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-roger/f7be7ace-79fb-4a61-80db-de6354ad10c0.jsonl`

## Connections
- **Electron dashboard:** (`threads/weft-dashboard/`) — provides a
  structural solution to `feature-request-hook-sandbox-bridge.md` via a
  two-process architecture: Electron broker (outside Claude's sandbox)
  performs supervised writes after GUI approval. The feature request
  remains valid for CLI-only users; the Electron thread is the
  alternative architectural answer.

## Next actions
1. Design decision-capture convention for _thread.md (agent-triggered)
2. Examine startwork skill for modularization / redesign
3. Retrieve and anchor loose threads listed above
4. Move to Phase 5: generalize thread management for weft users
