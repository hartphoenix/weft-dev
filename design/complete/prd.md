# A Fractal Learning Engine

**Builder:** Hart
**Status:** Open to collaboration (see group pitch below)

---

## Group Pitch (sent to Discord, 2026-02-23)

> Hey all! My week 4 project is a pair of Claude Code tools that learn
> as you use them. I'm looking for field testers for both tools:
>
> The first is a personal development harness — drop your materials in a
> background folder, run an intake interview, and get a CLAUDE.md, skill
> set, and learning tracker calibrated to you. It models your learning
> trajectory and self-calibrates over time. The second is a team
> coordination layer that connects individual harnesses into a shared
> workflow: task ranking, conflict detection, triage routing, dependency
> tracking, and a signal return path (so that what one person discovers
> reaches everyone who needs it). I built and field-tested the
> coordination layer with a 4-person team on Schelling Points last week,
> so it's already minimum-viable. My hope is to improve on it lots. Both
> tools are free to use, and the personal harness won't overwrite your
> existing setup.
>
> If you want a harness that adapts to you, you can opt into just the
> personal tool — no team commitment needed. If you're starting an
> ambitious group project and need to coordinate complex shared work, the
> coordination layer is where it gets interesting; your team would
> designate a systems integrator who I'd interface with at setup time.
> What I get in return is data about where the design holds up and where
> it breaks — but there's no requirement to take time out of production
> to give me feedback. Your active use of the system improves its
> function in real time and tells me what it needs. Written or verbal
> impressions are welcome but never obligatory. DM me if you're
> interested in either tool.

---

## Overview & Deliverables

A group of developers each working with their own AI agent should
produce something greater than the sum of their individual outputs. In
practice, that rarely happens — learnings stay siloed on individual
machines, coordination overhead grows with team size, and the collective
never gets smarter even as the individuals do.

This project confronts that problem directly. Three parts of the system
learn at once: each developer, their personal harness, and the layer
connecting them. Each feeds the others. The same compounding pattern
repeats at each scale, which is what makes the engine fractal. Also,
it's at Fractal.

It ships two interoperable Claude Code tools:

1. **Personal development harness** — A Claude Code configuration that
   adapts to its user and maximizes their learning. Drop your materials
   in the background folder, run an intake interview, and get a CLAUDE.md,
   skill set, and learning tracker calibrated to you. The harness updates its
   model of the developer as they work and self-calibrates over time. My
   instance ("Roger") has been running this loop for three weeks. This week,
   I'll extract the reusable infrastructure so anyone can set theirs up in
   minutes, without overwriting their own harness.

2. **Team coordination layer** — The part that makes the collective
   smarter than any individual. Connects individual harnesses into a
   shared workflow: task ranking, conflict detection, triage routing (can
   an agent handle this, or does a human need to decide?), dependency
   tracking, and the big-ticket item: a signal return path that feeds
   the intelligence loop. What one developer discovers propagates to
   everyone who needs it. I built and field-tested this with a 4-person
   team on Schelling Points last week — a full build cycle from
   architecture through deployment, with PRs, code review, and task
   coordination all running through the system. This week: extract it,
   generalize it, and stress-test it with a larger group on harder
   problems.

When both are present, the personal harness pulls from team state before
each work session, and individual findings route back through the signal
return path. When the coordination layer is absent, the personal harness
works standalone. When the coordination layer is present, the group
compounds its own intelligence.

---

## What's new for me

- **Extraction and generalization** — turning a system that works when
  welded to one project into something configurable and project-agnostic
- **Developer experience design** — onboarding smooth enough that someone
  installs and uses this without my help
- **Interoperability** — two tools with separate interfaces and a shared
  protocol between them

## How it stretches my ability

Two shareable tools in six days, designed to work alone and together.
I'm pitching the entire class on running the coordination layer across
multiple ambitious projects simultaneously — different teams, different
tech stacks, different harness configurations, all connected by one
protocol. If it works, we'll have demonstrated that a group of
AI-assisted developers can compound each other's learning in real time.
If it breaks, I'll gather the data and learn exactly where the
architecture fails at scale.

---

## MVP

### Personal development harness

- Fork/clone → drop your materials in background/ → run intake interview →
  personalized CLAUDE.md, skills, and learning tracker generated. Claude
  models your developmental trajectory and helps you achieve your goals
  through structured daily practice
- Background folder: a designated intake directory where the learner
  drops whatever they have — resumes, project repos, writing samples,
  course transcripts, old code, conversation exports. The intake interview
  reads this material and synthesizes it into the learner profile. Richer
  input produces a sharper starting model, but an empty folder still works
  (the interview asks questions to fill in gaps)
- Working skills out of the box: debugger (guides problem decomposition),
  session-review (end-of-session quiz that updates the learning model),
  quick-ref (direct answers that skip socratic reflection when teaching
  isn't what's needed)
- /startwork: pre-session digest of stale todos, unfinished threads, and
  today's priorities — "here's what deserves your attention." Preserves
  the human's context window as well as the agent's
- Learning state persists in a structured file (scores per concept, gap
  classifications, session history) that the harness reads at session
  start to calibrate its responses
- Privacy: learner profile, background, and learning state are .gitignored
  and stay local. Nothing reaches a shared layer without explicit opt-in.

### Coordination layer

- Team intake: configure members, roles, project, repo
- /startwork: checks for file-level conflicts with other active work,
  ranks available tasks, surfaces dependency blocks
- /handoff-test: audits artifacts for self-containedness before context clears
- /triage: routes each issue to the right handler — agent-resolvable
  items go straight to agents; decisions requiring judgment go to a human
- Dependency protocol: bidirectional links between tasks, with a
  blocked/unblocked task lifecycle that updates automatically
- Signal return path: findings generated during any developer's session
  (design patterns, workarounds, failure modes) get routed as GitHub issues
  tagged for the team's systems integrator to process
- Privacy: only task state, dependency updates, and generalized findings
  flow to the team level. No raw session data, personal profiles, or
  proprietary code. Boundaries are documented during onboarding.

---

## Stretch goals

- Installation package automates setup on new projects
- Customized compound engineer skill (weekly review: reads accumulated session
  output, identifies patterns worth embedding into the system, proposes
  changes, propagates findings into every corner of the individual workflow)
- Team compound engineering workflow – multi-agent review with
  configurable reviewers, mimics the architecture above at higher scale.
- Compounding indicators (detect whether sessions are building on each
  other or starting from scratch)

---

## Definition of Done

- A developer who isn't me can install the personal harness and have a
  working, personalized setup within a target of 15–20 minutes (deeper
  customization interview recommended for a sharper learning model)
- A team of 2+ can install the coordination layer and have working task
  selection, triage, and dependency tracking within a target of 30 minutes
- Both tools have a README with quickstart
- Demo shows both working and self-improving — with at least one other
  person's real usage as evidence, ideally multiple teams

---

## Milestones

See `design/schedule.md` for the living task tracker with current status.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Two tools is a lot of scope | MVP is tight. Stretch goals are clearly separated. The personal harness has three weeks of existing infrastructure; the coordination layer is the bigger lift. |
| Generalization harder than expected | Baked-in assumptions are already inventoried. Tackle the configuration layer (names, URLs, team data) first; convention layer (branch naming, labels, PR rules) second. |
| No collaborators for field testing | Personal harness has a family member ready to test within 1-2 days on real software projects. Coordination layer can be demoed with a simulated multi-user setup if no classmates sign on — but the pitch is designed to make that unlikely. |
| Intake interview produces a bad initial config | Keep the generated files editable. The intake is a starting point, not a lock-in. |
| Sensitive data leaks between tiers | Three-tier privacy model: personal (stays on machine, .gitignored), team (shared repo, no raw personal data), public (README/docs only). Boundaries are enforced by file structure and documented during onboarding. |

---

## Open Questions

- Repo structure: monorepo, two repos, or personal-harness-as-template
  with coordination-as-add-on?
- How tightly does the coordination layer depend on GitHub? Could it work
  with other project management surfaces?
- ~~ClaudeConnect~~ — Investigated 2026-02-23. Back-burnered. Full
  assessment in `coordination/architecture.md` §ClaudeConnect.
- Roger was built by a learner with a teaching background and strong
  pedagogical intuitions. How well does the tutor adapt to someone who
  doesn't share that? Can it hold the expert-teacher role on its own, or
  does it need a user who already knows how to be taught?
- **Platform layer:** Courses, schools, cohorts as GitHub-native
  entities. Early design captured in `design/platform-layer.md`
  (2026-02-25).
