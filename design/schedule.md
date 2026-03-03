# Schedule & Task Tracker

**Week 5 build:** 2026-03-02 → 2026-03-07 (demo Saturday)

Living tracker for milestones and tasks. Specs live in their respective
design docs; this file tracks execution status.

---

## Milestones

| Day | Target | Status |
|-----|--------|--------|
| Mon 3/2 | Front door complete: bridge prompt, install audit, first-run messaging, update mechanism checked. Speedrun presentation adapted. | In progress |
| Tue 3/3 | Onboarding lesson v0. Session-discovery wired into session-review + progress-review. | Planned |
| Wed 3/4 | Startwork decomposed. Intake context window hardened. Session-review/progress-review diagnosed. | Planned |
| Thu 3/5 | Principles reference extracted and wired. Onboarding lesson full version. | Planned |
| Fri 3/6 | Two-user verification (dad + engineer). Update mechanism documented. | Planned |
| Sat 3/7 | Stranger-perspective README pass. GitHub release + version tag. Demo. | Planned |

---

## Task Checklist

### Front door

| Task | Status |
|------|--------|
| Bridge prompt: write copy-paste prompt (browser Claude → Claude Code readiness) | Done |
| Bridge prompt: test in browser Claude, confirm it lands at working CLI state | Done |
| Install story: run bootstrap.sh as a stranger, document every assumption | Done |
| Install story: fix blockers (skip cosmetic issues) | Done |
| Install story: verify symlinks, additionalDirectories, CLAUDE.md marker injection | Done |
| First-run hook: rewrite Condition 3 (fresh install — no current-state.md) | Done |
| First-run hook: rewrite Condition 2 (interrupted intake) | Done |
| Update mechanism: confirm notify mode fires correctly | Done |
| Update mechanism: confirm auto mode is implemented (deferred to EOW) | Done |
| Update intake time estimate to ~30 min in README and session-start.sh | Done |

### Onboarding lesson v0

| Task | Status |
|------|--------|
| Draft lesson content: what Weft is, intake, session-review, startwork | Planned |
| Structure for lesson-scaffold ingestion | Planned |
| Verify it passes through lesson-scaffold without breaking | Planned |
| Quick sanity check: meaningfully different output for beginner vs. intermediate | Planned |

### Learning loop closure

| Task | Status |
|------|--------|
| Wire session-discovery into session-review (all sessions since last review) | Planned |
| Wire session-discovery into progress-review | Planned |
| Wire session-discovery into startwork | Planned |

### /startwork decomposition

| Task | Status |
|------|--------|
| Audit current skill for all conditional branches and decision points | Planned |
| Design subskill structure (what splits off, what stays in dispatcher) | Planned |
| Implement subskills with context-aware dispatch | Planned |
| Test: fresh user scenario | Planned |
| Test: returning user scenario | Planned |
| Test: progress-review due scenario | Planned |

### Intake context window hardening

| Task | Status |
|------|--------|
| Verify intake completes full four-phase flow in one context window | Planned |
| Audit conditional subagent use (synthesis agents dispatched correctly?) | Planned |
| Fix paths where intake might overflow or stall before writing files | Planned |

### Session-review and progress-review diagnosis

| Task | Status |
|------|--------|
| Run both skills against real session data, evaluate output quality | Planned |
| Identify major structural flaws before deciding whether to refactor | Planned |
| Refactor only if diagnosis reveals a real problem | Planned |

### Principles reference — install package

| Task | Status |
|------|--------|
| Audit design-principles.md and harness-features.md for delta vs. .claude/references/ | Planned |
| Distill delta into teaching-principles.md (internal framing, no user-facing jargon) | Planned |
| Update relevant skill SKILL.md files to read the reference and apply principles | Planned |
| Verify skills don't surface principle vocabulary in user-facing output | Planned |

### Onboarding lesson — full version

| Task | Status |
|------|--------|
| Expand v0 into complete coverage: Weft, intake, session-review, startwork, progress-review | Planned |
| Pass through lesson-scaffold with beginner (dad-level) intake profile | Planned |
| Pass through lesson-scaffold with engineer-level intake profile | Planned |
| Verify adaptation is meaningfully different — not just tone, but content and depth | Planned |
| Fix any lesson-scaffold behavior producing weak adaptation | Planned |

### Two-user verification

| Task | Status |
|------|--------|
| Dad: install Weft from scratch using bridge prompt | Planned |
| Dad: complete intake | Planned |
| Dad: run first session-review | Planned |
| Engineer: install and run intake | Planned |
| Engineer: verify profile and lesson adapt correctly to more experienced starting point | Planned |
| Document what broke or felt rough during each run | Planned |

### Update mechanism

| Task | Status |
|------|--------|
| Document all three modes (notify, auto, off) in README | Planned |
| Verify auto mode end-to-end with a real session that has current-state.md | Planned |

### Publishing

| Task | Status |
|------|--------|
| Stranger-perspective README pass — read as someone who has never heard of Claude Code | Planned |
| GitHub release + version tag — marks the shipped state | Planned |

### Speedrun presentation (Mon 3/2)

| Task | Status |
|------|--------|
| Decide: raw SVGs (available now) or GPT image restyling (needs OpenAI API key) | Planned |
| Fix slide 3 broken image (unraveling-fabric not yet generated) | Planned |
| Review and personalize all speaker notes — especially slide 3 | Planned |
| Time a full run-through (target: 3 minutes) | Planned |
| Pre-flight: Chrome, speaker notes window (S key), QR code scan | Planned |

---

## Definition of Done

From `design/week5-prd.md`:

- A non-Hart user can install the personal harness and complete intake
  in ~30 minutes
- Two users tested: one beginner (dad), one engineer-level
- Learning loop closes: session → session-review → startwork cycle runs
  end-to-end with cross-session analysis
- /startwork decomposition holds under three test scenarios without
  regression
- GitHub release tagged
