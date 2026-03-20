---
session: (no matching session found)
stamped: 2026-03-05T23:05:31.834Z
---
# Build Registry

Registry of personalities, skills, and their build status. Derived from
analysis of 98 browser conversations + 18 Claude Code sessions. Design
each personality using the interview protocol in
`personalities/design-personality/SKILL.md`.

---

## Personalities

| Personality | Usage | Status | Notes |
|-------------|-------|--------|-------|
| **Tutor** | ~15% | Built | Persona defined in `.claude/references/tutor-posture.md` (standalone repo), carried by all shipping skills. Field-tested as `roger/personalities/tutor/CLAUDE.md`. *Compensation:* When the learner pivots to resource-seeking mid-conversation, offer to teach in context first. |
| **Creative Collaborator** | ~15% | Planned | Co-creator for Lucid Drama, poetry, worldbuilding, naming. Not teaching — inventing together. *Compensation:* Minimal — match his energy. |
| **Research Partner** | ~5% | Planned | Peer-level intellectual exploration. No teaching frame. *Compensation:* Match depth, push back when disagreeing. |

---

## Skills

Ships = included in install package (9 skills ship). Standalone repo: `hartphoenix/weft`.
Dev-only = used during harness development, not shipped to end users.

| Skill | Usage | Status | Ships | Location |
|-------|-------|--------|-------|----------|
| Intake | — | Built | Yes | `.claude/skills/intake/`. Four-phase onboarding: background scan → adaptive interview → synthesize drafts → human-gated write. Generates CLAUDE.md, goals.md, arcs.md, current-state.md. Sub-agent delegation for context management. |
| Quick Reference | ~33% | Built | Yes | `.claude/skills/quick-ref/` |
| Debugger | ~20% | Built | Yes | `.claude/skills/debugger/` |
| Session Review | — | Built (splitting) | Yes | `.claude/skills/session-review/`. Being split into session-digest (passive state update) and session-quiz (active recall) per recalibration item 8. Currently still monolithic. Observability hooks planned: `skills-invoked`, `gap-types-addressed`, `interventions` logged in session log frontmatter. See `design/validation-plan.md` §7b. |
| Session Digest | — | Built | Yes | `.claude/skills/session-digest/`. Lightweight learning-state update from session evidence without quizzing. Reads recent sessions via session-discovery, extracts concept engagement and fluency signals, proposes diff to current-state.md. Split from session-review (recalibration item 7). |
| Session Quiz | — | Planned | Yes | `.claude/skills/session-quiz/` (not yet built). Active-recall quiz on 4–6 concepts biased toward gaps. Split from session-review (recalibration item 8). Best scheduled for mornings when capacity is fresh. |
| Session Discovery | — | Built | Yes | `.claude/skills/session-discovery/`. Discovers Claude Code sessions within a date range. Infrastructure skill for session-review, session-digest, progress-review, startwork. Not user-facing. |
| Lesson Scaffold | — | Built | Yes | `.claude/skills/lesson-scaffold/` |
| Startwork | — | Built | Yes | `.claude/skills/startwork/` |
| Progress Review | — | Built | Yes | `.claude/skills/progress-review/`. Cross-session pattern analysis: stalls, regressions, goal drift, arc readiness. Primary path: conditional background dispatch from startwork (fires when unreviewed sessions > 2). Also available standalone. **Note:** session-digest now handles between-review state updates — review whether the dispatch threshold (unreviewed sessions > 2) still makes sense, or whether "undigested" is the better trigger. |
| Diagram | — | Built | Dev-only | `.claude/skills/diagram/` |
| Browser QA | — | Built | Dev-only | `.claude/skills/browser-qa/` |
| Design Iterate | — | Built | Dev-only | `.claude/skills/design-iterate/` |
| Design Skill | — | Built | Dev-only | `.claude/skills/design-skill/` |
| Handoff Test | — | Built | Yes | `.claude/skills/handoff-test/` (standalone repo). Audits artifacts for self-containedness before context loss. Wired to `PreCompact` hook (context injection). |
| Handoff Prompt | — | Built | Yes | `.claude/skills/handoff-prompt/` (standalone repo). Generates a complete handoff prompt for the next agent from session memory. Conserves context before compaction or `/clear`. |
| Git Ship | — | Built | Yes | `.claude/skills/git-ship/`. Full git workflow: stage, commit, push, PR. Accepts --merge for squash-merge, --dry-run for preview. Invoked only via /git-ship slash command. |
| Context Map | — | Built | Yes | `.claude/skills/context-map/`. Shows what's loaded in the current context window: CLAUDE.md hierarchy, memory, skills, IDE context with line counts and file paths. |
| Exapt | — | Built | Yes | `.claude/skills/exapt/`. Cross-domain pattern transfer. Surfaces patterns from other domains sharing the problem's topology. Use when stuck or when lateral thinking would help. |
| Project Brainstorm | — | Planned | — | Solo version: takes learner goals + growth edge, explores project ideas, produces project brief with schedule, definitions of done, and requirements. Adapt from `coordination/commands/workflows/brainstorm.md`. |
| Agent Feedback | — | Deferred | — | Produces meaningful feedback reports for the harness developer. Replaces session-review Phase 4's strict structural schema with a richer signal. Fires on surprise: when the agent encounters something worth telling the developer about, it estimates signal type and composes a report. Readable, contentful — not just structural metrics. Privacy-aware but not so strict it strips all useful data. Triggerable from session-review or independently when surprising harness behavior occurs. **Calibration loop:** checks for discrepancies between lesson-scaffold predictions (concept classifications, predicted difficulty) and session-review outcomes (actual quiz scores, observed struggles). Scaffold said "solid" but learner struggled → classification model needs tuning. Scaffold said "prerequisite gap" but learner handled it → model underestimated. These discrepancies are a first-class signal type. |
| SessionStart Hook | — | Built | Yes | `.claude/hooks/session-start.sh` (standalone repo). Conditional onboarding: checks learning state, suggests /intake, /startwork, or /lesson-scaffold. Schedule deadline nudge stubbed (blocked on project-brainstorm). See `design/hooks-research.md` §5.1. |
| PreCompact Hook | — | Designed | Yes | Injects "run /handoff-test" context before compaction. Depends on handoff-test skill shipping. See `design/hooks-research.md` §5.1. |
| Schedule Deadline Nudge | — | Stubbed | — | SessionStart hook condition 5. Reads schedule/deadline files, injects proximity reminder. Blocked on project-brainstorm (produces schedule + definitions of done). Wire into session-start.sh when unblocked. |
| Architect | ~10% | Planned | — | *Compensation:* Always ask for full system picture before answering. Promotion candidate if extended design sessions become common. |
| Setup Guide | — | Planned | — | Procedural, not Socratic. Ask for project structure, package.json, and goal upfront. |
| Emotional Reflection | — | Deferred | — | Behavior embedded in Tutor personality; standalone skill not built. Attentive mirroring, not therapy. Knows its boundary: when somatic/attachment-level, name that it needs a human holder. Key principle (Thorson/Aletheia): mirroring itself is the intervention. |
| Corpus Miner | — | Experimental | — | Retrieval-augmented analysis of personal text archive via Nomic embeddings. Build incrementally: reflection → cluster characterization → cross-domain bridges → longitudinal analysis → structured extraction. |
| Celebrate Wins | — | Planned | — | Prompts student to mark milestones with a public post after great sessions or progress reviews. GitHub, social media, etc. Encourages celebrating growth and creates a rearview mirror of progress. Post-MVP. |
| Relationship Setup | — | Planned | Yes | One-time handshake for teacher-student relationships: create private repo, add collaborator, store config in both harnesses. See `design/teacher-role/brainstorm-2026-02-27.md` §8. |

---

## Scripts / Dev Tools

| Script | Status | Notes |
|--------|--------|-------|
| `scripts/session-discovery.ts` | Built | Dev-only. Original script version. Skill version (`.claude/skills/session-discovery/`) is the shipping artifact. Currently consumed by: session-review (done), session-digest (done), startwork digest-staleness check (done). Not yet wired into: progress-review, startwork general session gathering. |
| `scripts/bootstrap.sh` | Built | Install pipeline (standalone repo). Writes weft section to global CLAUDE.md, registers skills/hooks in settings.json, records manifest. Hardened with marker validation and path reconciliation. |
| `scripts/uninstall.sh` | Built | Clean removal (standalone repo). Strips weft section from CLAUDE.md, removes settings.json entries. |
| `scripts/rename-to-weft.sh` | Built | One-time migration script (maestro → weft). Dev-only, in weft-dev. |
| `scripts/test-install.ts` | Planned | Install verification. Clones standalone repo, checks file structure against expected manifest, reports pass/fail. |

---

## Prompting Patterns to Compensate For

These patterns are observed across all interactions and should inform
every skill and personality design.

- **Narrow symptom, hidden system.** Hart asks about the error, not
  the goal. Surface the bigger picture without interrogating.
- **Hypothesis withheld.** He usually has a decent guess but doesn't
  volunteer it. Prompt for it.
- **Conversation drift.** Long sessions accumulate topics. Notice
  shifts; suggest starting fresh or mark the transition.
- **"Can I do X?" as permission check.** Encourage trying first.
- **Resource-seeking mid-problem.** Redirect to in-context learning.

## Strengths to Protect

- **Experiment-first loop.** Tries, observes, then asks. Never preempt.
- **High metacognitive accuracy.** Trust his self-reports.
- **Spontaneous bridge-building.** Encourage his own frameworks.
- **Explicit help-mode requests.** He differentiates modes naturally.
- **Full error pasting.** Conversations resolve fastest with complete output.
- **Testing understanding by writing code for review.** Encourage.

## Recurring Friction Points

- **Syntax overloading** (`{}`, `=>`, `()` across JS/JSX contexts)
- **Sandbox-to-real-setup gap** (tutorials hide environment complexity)
- **Error message parsing** (developing fluency)
