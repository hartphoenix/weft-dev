# Weft — Week 5: Front Door & Learning Loop

**Builder:** Hart
**Status:** In progress

---

## Overview & Deliverables

Week 4 built the harness. Week 5 makes it usable by strangers and closes
the feedback loop.

The personal harness is live and installable. The core loop — intake →
work → review → plan — is functional for the author. What's missing is
the front door: the path that takes someone from zero to working Claude
Code session without Hart standing next to them. And the back end of the
loop: session data flowing into cross-session analysis, so the profile
actually sharpens over time rather than just accumulating logs.

This week delivers both:

1. **Front door** — A bridge prompt that guides a browser Claude user to
   Claude Code readiness. A verified install story (no hidden assumptions,
   no silent failures). First-run messaging that explains itself to a
   beginner without assuming prior knowledge.

2. **Learning loop closure** — Session-discovery wired into session-review,
   progress-review, and startwork, so analysis spans all sessions since
   the last review rather than just the current context. The loop closes.

3. **Startwork decomposition** — The monolithic /startwork skill broken
   into subskills with context-aware dispatch. Cleaner, testable, and
   ready for the conditional logic the full loop requires.

4. **Two-user verification** — A beginner (dad) and an engineer-level user
   each install and run intake. Adaptation is verified to be meaningfully
   different. What breaks is documented.

5. **Publishing** — Stranger-perspective README pass. GitHub release with
   version tag.

---

## What's new for me

- **DX design for strangers** — Building something usable by someone who
  doesn't share your assumptions is a different problem than building
  something that works for you. Discovering and removing hidden knowledge
  requirements is the core skill this week.
- **Two-user testing across a skill gap** — Verifying that adaptation
  actually works requires real users with different backgrounds. Not just
  checking that the code runs, but that the output is meaningfully
  different.
- **Structural decomposition of a working skill** — Breaking /startwork
  into subskills without breaking its behavior. Refactoring with a
  behavioral contract.
- **Principles extraction and packaging** — Pulling principles from design
  docs into a reference file that ships with the harness and wires into
  skill behavior invisibly.

---

## How it stretches my ability

Week 4 was building a system that works when you understand all its
parts. Week 5 is making a system that works when you don't. That's a
different kind of engineering: it requires modeling a user who knows
nothing, finding every place the system assumes they do, and replacing
those assumptions with explicit guidance. It also requires testing with
real people — which is slower and less controllable than testing with
yourself, and produces more useful signal.

---

## MVP

### Front door

- Bridge prompt: a copy-paste prompt that takes a browser Claude user
  through prerequisites, Claude Code install, and authentication, landing
  them at a working terminal session ready to run the Part 2 install prompt
- Install story: bootstrap.sh verified against a clean profile — no
  silent failures, no assumed prior knowledge
- First-run hook messaging: session-start.sh rewrites for the
  "intake not run yet" and "intake interrupted" paths — plain language,
  no jargon, correct framing
- Onboarding lesson v0: structured lesson content that lesson-scaffold
  can ingest and adapt to a given intake profile

### Learning loop closure

- session-discovery.ts wired into session-review — analyses all sessions
  since last review, not just current context
- session-discovery.ts wired into progress-review
- session-discovery.ts wired into startwork

### Startwork decomposition

- Current skill audited for all conditional branches and decision points
- Subskill structure designed (what splits off, what stays in dispatcher)
- Subskills implemented with context-aware dispatch
- Tested across three scenarios: fresh user, returning user,
  progress-review due

### Intake context window hardening

- Full four-phase flow verified to complete in one context window
- Conditional subagent use audited
- Overflow and stall paths fixed

---

## Stretch goals

- **Principles reference in install package** — Audit design-principles.md
  and harness-features.md for principles not yet in .claude/references/.
  Distill delta to teaching-principles.md. Wire into relevant skills.
  Verify no principle vocabulary surfaces in user-facing output.
- **Full onboarding lesson** — Expand v0 into complete coverage. Verified
  to produce meaningfully different output for beginner vs. engineer profile.
- **Update mechanism documented** — All three modes (notify, auto, off)
  documented in README. Auto mode verified end-to-end.
- **GitHub release** — Stranger-perspective README pass. Version tag.
  Marks the shipped state.

---

## Definition of Done

- A non-Hart user can install the personal harness and complete intake
  in ~30 minutes
- Two users tested: one beginner (dad), one engineer-level
- Learning loop closes: session → session-review → startwork cycle runs
  end-to-end with cross-session analysis
- /startwork decomposition holds under three test scenarios without
  regression
- GitHub release tagged

---

## Milestones

See `design/schedule.md` for the living task tracker with current status.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Two-user testing blocked by availability | Test with weft-dev intake-test artifacts as fallback for engineer profile; dad test can run async |
| Session-discovery wiring breaks context budgets | Wire one skill at a time, test context window after each integration |
| Startwork decomposition introduces regressions | Test three scenarios before and after — fresh user, returning user, progress-review due |
| Principles extraction scope creep | Audit and distill delta only; skip full redesign of existing reference files |

---

## Open Questions

- Should the week 5 GitHub release establish a version tag scheme
  (v0.1.0, calendar-based, etc.), or just tag the commit?
- **Platform layer:** Courses, schools, cohorts as GitHub-native
  entities. Early design in `design/platform-layer.md` (2026-02-25).
  Unchanged from week 4.
- Roger was built by a learner with a teaching background and strong
  pedagogical intuitions. How well does the tutor adapt to someone who
  doesn't share that? Can it hold the expert-teacher role on its own, or
  does it need a user who already knows how to be taught? Week 5
  two-user verification will produce first real data on this.
