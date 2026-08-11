---
title: Multi-User Claude Code Coordination System — Retrospective & Build Plan
date: 2026-02-22
status: brainstorm
source_repos:
  - schelling-points (group project, the built system)
  - claude-game (solo project, predecessor)
  - roger (harness, metacognitive work)
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/d0bcb71d-ddb4-41de-a21d-feb13c13907b.jsonl
stamped: 2026-03-17T02:52:59.057Z
---

# Multi-User Claude Code Coordination System

Pre-plan brainstorm. Organizes findings, source inventory, and open
questions to feed a sequenced plan for retrospective study, generalization,
publication, and new build.

> **Working principle**: A learning system is one that embeds new knowledge
> into its own form in order to produce higher function.
>
> This applies at every scale: a single developer's harness that updates
> its own CLAUDE.md, a team coordination system that rewrites its own
> workflows, a codebase whose architecture absorbs lessons from its own
> bugs. The multi-user version of this problem — keeping that embedding
> loop closed across team boundaries — is the central design challenge
> of this project.
>
> *(Candidate for roger/ design principles — needs refinement.)*

---

## 1. What Exists

The Schelling Points project contains a working multi-agent coordination
system for a 4-person dev team. It was built iteratively over one week on
top of a solo-project template (claude-game).

### Core components

| Component | Location | Function |
|-----------|----------|----------|
| Team CLAUDE.md | `CLAUDE.md` | Team profiles, roles, WIP limits, conventions, security rules |
| Workflow pipeline | `.claude/commands/workflows/` | 6-stage: brainstorm → plan → work → review → triage → compound |
| Startwork command | `.claude/commands/startwork.md` | Pre-work conflict detection, dependency checking, task ranking |
| Startwork gather script | `.claude/scripts/startwork-gather.ts` | Board state digester: candidates, active work, flags, stale todos |
| Triage protocol | `.claude/commands/workflows/triage.md` | Agent-resolvable vs. human-decision routing with dedup |
| Dependency protocol | `CLAUDE.md` §Dependency Protocol | Bidirectional linking, blocked-label lifecycle |
| Handoff test | `.claude/skills/handoff-test/` | Quality gate between every pipeline stage |
| Review agents | `.claude/compound-engineering.md` | Multi-agent review with configurable agent list |
| Subagents (8) | `.claude/subagents/` | Specialized analysis: code simplicity, decision balance, feature-UI completeness, session logs, etc. |
| Resource lifecycle | `CLAUDE.md` §Resource Lifecycle | Ephemeral vs. persistent docs (see §4.3 for revision) |
| Per-member overrides | `CLAUDE.md` §Per-Member Overrides | Workspace-level CLAUDE.md for personal preferences |

### What the template gave vs. what was built

**Inherited from claude-game template:**
- Workflow commands: brainstorm, plan, review, work
- Skills: brainstorming, compound-docs, document-review
- Subagents: best-practices-researcher, code-simplicity-reviewer, framework-docs-researcher, learnings-researcher, repo-research-analyst, spec-flow-analyzer

**Built during group project week:**
- Team coordination layer (roles, WIP limits, role-task mapping)
- Startwork command + gather script (the novel coordination piece)
- Triage workflow (agent vs. human routing)
- Dependency protocol
- Resource lifecycle rules
- Handoff-test skill
- New subagents: decision-balance-audit, feature-ui-completeness, session-log-analyzer
- Branch conventions, PR review gates, label taxonomy
- Project board integration with GitHub Projects

### Current hard dependencies

- **Claude Code** — .claude/ directory structure, skills, commands, subagents, permissions
- **GitHub** — Issues, PRs, project board (kanban), gh CLI
- **Bun** — Runtime for startwork-gather.ts

---

## 2. What Needs to Be Surfaced (Implicit Knowledge)

Knowledge that exists in Hart's head or scattered across conversations and
chat logs but isn't yet captured in the system's documentation.

### High-confidence implicit knowledge (likely recoverable)

- **Sequencing decisions**: Which components were introduced in what order,
  and why. The git history of schelling-points tells part of this story.
  Hart's conversations with Claude tell the rest.
- **Failure modes observed**: What went wrong during the week that prompted
  each new component. E.g., what conflict or coordination failure led to
  the startwork command? What triage failure led to the agent-resolvable
  vs. human-decision split?
- **Discord coordination protocols**: Verbal/text instructions to teammates
  about workflow sequences, when to use which command, when to ask for
  review. Some of this may be recoverable from Discord export.
- **Solo project lessons** (claude-game): Design patterns and workflow
  insights from the Monday solo build that informed group project decisions.
- **Roger/harness work**: Metacognitive and context-engineering patterns
  developed in roger/ this week, some of which were implemented in the
  group project, many of which weren't.

### Lower-confidence implicit knowledge (may require exploratory dialog)

- **What still doesn't work well**: Pain points, friction, workarounds.
  Hart knows these but hasn't documented them.
- **Team-specific adaptations**: Things that were done for this specific
  team's skill mix and communication patterns that shouldn't be baked into
  the general system.
- **Scaling limits**: Where the system would break with more people, more
  repos, or different project shapes.

---

## 3. What Needs to Change (Generalization)

To make the system shareable, factor out team/project-specific assumptions
and make them configurable.

### Currently baked-in assumptions

| Assumption | Where it lives | Generalization path |
|-----------|---------------|-------------------|
| Team of 4, specific names/roles | CLAUDE.md team table | Intake interview → generated team section |
| Schelling Points tech stack | CLAUDE.md project description | Intake interview → project profile |
| `thrialectics` as GitHub org/owner | startwork-gather.ts, CLAUDE.md | Config variable |
| Specific project board URL | CLAUDE.md | Config variable |
| Bun as runtime | startwork-gather.ts | Keep as default, document alternative |
| Specific subagent set | .claude/subagents/ | Core set + optional/extensible |
| Specific label taxonomy | CLAUDE.md §Labels | Reasonable defaults + customizable |

### Proposed scope boundary

**In scope:** Dev teams of 2-24, using GitHub, building software with
Claude Code as a primary development tool. Any tech stack.

**Out of scope (for now):** Non-GitHub workflows, teams > 24, projects
without Claude Code, non-software projects.

### Generalization layers

1. **Config layer**: Project name, team members, tech stack, repo URLs,
   board URLs — pure data, no logic changes needed.
2. **Convention layer**: Branch naming, commit format, label taxonomy,
   PR rules — reasonable defaults with override points.
3. **Workflow layer**: The 6-stage pipeline — probably stable as-is;
   the question is which stages are mandatory vs. optional for smaller teams.
4. **Coordination layer**: Startwork, triage, dependency protocol — the
   core IP; needs to be parameterized but not fundamentally redesigned.

---

## 4. Signal Flow Architecture (Central Design Problem)

The current system has a fundamental asymmetry: **learning compounds only
at the systems integrator's node.** Findings flow outward (SI pushes
updated configs via GitHub) but don't flow inward (other devs' local
learnings, failure modes, and success patterns are invisible to the SI
and to each other).

### The asymmetry in detail

```
            ┌─────────┐
  ┌────────>│  GitHub  │<────────┐
  │ push    │ (shared) │  push   │
  │         └────┬────┘         │
  │              │ pull          │
  │              v              │
  │     ┌───────────────┐       │
  │     │  SI / Compound │       │
  │     │   Engineer     │       │
  │     └───────┬───────┘       │
  │             │ push           │
  │             v               │
  │        ┌─────────┐          │
  └────────┤  GitHub  ├─────────┘
           │ (shared) │
           └────┬────┘
        pull │     │ pull
             v     v
         Dev A   Dev B
         (local learnings    (local learnings
          stay local)         stay local)
```

What flows through the system today:
- **Code** — flows both ways via PRs (working well)
- **Task state** — flows both ways via project board (working well)
- **System-level learnings** — flow ONE way: SI → team via config updates
- **Compound docs** — generated locally, persist in docs/solutions/, but
  nobody systematically reads them except the SI
- **Failure modes** — stay on whatever machine they occurred on
- **Workflow friction** — stays unreported unless someone brings it up

### The class of problem

This is not just "compound learnings don't flow back." It's a general
pattern: **any signal that's generated locally and doesn't have an
explicit return path to someone who can act on it systemwide is lost.**

Instances of this class:
1. Compound docs generated on Dev B's machine that the SI never sees
2. A workaround Dev A discovered that would benefit Dev C
3. A failure mode in the triage protocol that only surfaces on branches
   with certain characteristics
4. Implicit workflow knowledge that lives in Discord but never enters
   the system's documentation
5. Resource lifecycle deleting brainstorms/plans before their lessons
   are fully integrated (see §4.3)

### Design principle: solve the class, not the instance

This principle should govern the plan AND be built into the SI's toolkit.
It's recursive: the system needs mechanisms that detect and route signal
loss *in general*, not just specific known signal types.

### The compound engineer role

The SI in this system also served as the **compound engineer** — the
person who:
1. Reads compound documentation produced by the whole team
2. Identifies patterns at a level of abstraction above individual tasks
3. Applies those patterns back to the system's structure (workflows,
   conventions, configs)
4. Filters what's worth applying vs. what's noise

This is a distinct function from project management or code review. It
requires:
- Under-the-hood knowledge of the workflow system
- Systems-level discernment about what to change
- Bandwidth and mandate to do meta-work

Most team members won't have the bandwidth or context to do this locally.
The system should make it easy for them to *generate* the signal and
route it to someone who can act on it, without requiring them to also
do the synthesis.

### Candidate solution: signal catch basin

A **catch basin** is a mechanism that:
1. **Catches** signal at the point of generation (on any dev's machine)
2. **Routes** it to the SI / compound engineer with enough context intact
3. **Persists** it until the SI has processed it (no premature deletion)
4. **Closes the loop** — the SI's resulting system changes are traceable
   back to the signal that prompted them

**Possible implementation via existing infrastructure:**
The compound workflow already generates docs/solutions/ files. The gap is
the return path. Options:

- **GitHub issue as return channel**: The compound step auto-creates a
  GitHub issue assigned to the SI, tagged `compound-finding`, linking
  the solution doc. The SI processes these as a batch.
- **Dedicated signal queue**: A `.claude/signal/` directory or project
  board column ("Findings") that accumulates unprocessed learnings.
- **Compound-step modification**: The compound workflow's final step
  could include "Is this finding system-relevant?" triage, routing
  system-level findings to the SI and local-only findings to the dev's
  own docs.

The GitHub issue path is probably the simplest — it reuses existing
infrastructure and gives the SI a filterable, prioritizable queue.

### 4.1 Scaling the principle

"Solve the class, not the instance" should apply to the SI's toolkit
itself. The SI needs:
- **Signal detection**: "Where is this system currently losing
  information?" — a periodic audit or automated check
- **Pattern recognition**: "Is this a new instance of a known signal-loss
  class, or a new class?"
- **Propagation verification**: "Did the change I made actually reach
  and affect the team's workflow?"

These could be skills, subagent prompts, or checklist items in the SI's
workflow — the form matters less than the function.

### 4.2 Relationship to the harness concept

In the single-user harness (roger), the compounding loop is closed by
default — the human and the agent are the same node. In multi-user,
the loop opens at every team boundary. The multi-user harness adapter's
core job is to *keep the learning loop closed across those boundaries.*

This reframes the whole system. It's not primarily a coordination tool
(though it coordinates). It's a **distributed learning system** that
happens to coordinate work as a side effect of keeping the learning loop
intact.

### 4.3 Resource lifecycle revision

The current lifecycle (delete brainstorms/plans after PR merge) optimizes
for clutter reduction but creates a signal loss risk: findings in
ephemeral docs may not have been fully integrated before deletion.

**Revised approach**: Archive, don't delete.

| Artifact | Current | Revised |
|----------|---------|---------|
| `docs/brainstorms/*.md` | Delete after PR merge | Move to `docs/archive/brainstorms/` after PR merge |
| `docs/plans/*.md` | Delete after PR merge | Move to `docs/archive/plans/` after PR merge |
| `docs/solutions/*.md` | Persistent | Persistent (unchanged) |
| `.claude/todos/agent/*` | Delete after completion | Delete after completion (unchanged — these are pure task state) |

The archive serves as a persistent catch basin: if new perspectives or
tools later make an old brainstorm worth mining, the data is there. The
cost is disk space (negligible) vs. the cost of lost signal (potentially
high). A `.gitignore` rule or separate branch could keep the archive
out of the active working tree if clutter is a concern.

---

## 5. Conceptual Framing

### What is this thing?

Working name: **multi-user harness adapter**

More precisely: a coordination layer that allows developers with different
local Claude Code configurations (personal CLAUDE.md, personal skills,
personal preferences) to collaborate on a shared codebase through
structured protocols.

The system mediates between:
- **Individual harnesses** (each dev's personal Claude Code setup)
- **Shared project state** (GitHub issues, PRs, project board)
- **Coordination protocols** (workflow pipeline, triage, dependency tracking)

This is different from:
- A project template (it's actively maintained and evolves with the project)
- A CI/CD pipeline (it's human-in-the-loop and attention-aware)
- A project management tool (it's embedded in the development environment)

### Relationship to roger/harness

Roger is a single-user harness. This system extends the harness concept to
multi-user. The key additions:

- **Team model** (roles, capabilities, WIP limits) — analogous to the
  learner model in roger, but for coordination rather than teaching
- **Conflict detection** — no analogue in single-user
- **Triage routing** — single-user harness doesn't need agent vs. human
  routing because the human is always present
- **Shared context** (project CLAUDE.md) vs. personal context (workspace
  CLAUDE.md) — a new boundary that doesn't exist solo

### 5.1 Naming candidates (tabled)

The name should describe the system's relationship to its own evolution,
not its social topology. It should evoke a system whose output feeds
back into its own capacity to produce better output.

| Candidate | What it evokes | Tension |
|-----------|---------------|---------|
| **Ensemble Engine** | Collective > sum of parts + self-reinforcing mechanism | "Engine" is mechanical; the system is organic |
| **Signal Ensemble** | Foregrounds the signal flow problem | May read as audio/DSP to engineers |
| **Compound Ensemble** | "Compound" as verb: the ensemble that compounds its learning | Two abstract words; may not land immediately |
| **Resonant Loop** | Physics: energy fed back amplifies rather than dissipates | Accurate but clinical |
| **Ensemble** (standalone) | Collective capability through shared sensitivity | Might be too soft; doesn't name the mechanism |
| **Accrual** | Recognizes value at point of generation, not collection | Precise but cold |

**Naming constraints identified:**
- Must name the emergent property of the network, not any single node
- Should describe what the system does to itself (autopoietic direction)
- Avoid: cult/prepper connotations (compound-as-noun), overindexed
  jargon (autopoietic, cybernetic), taken names (kubernetes/kybernetes),
  dissociative connotations (fugue)
- The "Lucid Drama" test: does it open productive questions without
  providing closure?

Decision tabled. Will revisit after retrospective surfaces more about
what the system *actually does* vs. what we *think* it does.

### 5.2 Lattice evaluation

**Repo:** https://github.com/Stage-11-Agentics/lattice
**Status:** v0.2.1-alpha, 6 days old, MIT, Python 3.12+

Lattice is a file-based, event-sourced task tracker built for
agent-human hybrid workflows. All state lives in `.lattice/` in the
project root. Every mutation is an immutable event with actor
attribution. Task snapshots are materialized views derived
deterministically from the event log.

**What it provides that GitHub Projects doesn't:**
- Agent-native CLI with `--json` (no `gh` parsing)
- Full event-sourced audit trail with actor attribution (agent vs. human)
- Typed relationships: `blocks`, `depends_on`, `subtask_of` (enforced)
- Status transition enforcement via configurable graph
- `needs_human` as first-class status (maps directly to triage routing)
- `lattice next` — priority-ranked task recommendation with `--claim`
- Resource locking (TTL leases, heartbeat, max-holder limits)
- Shell hooks on events (transition-specific, wildcard support)
- Completion policies (quality gates on status transitions)
- Session tracking with structured actor identity
- Offline reads — no network dependency, no API rate limits

**Hard blocker: no multi-machine sync.** Lattice Remote is designed
(23KB architecture doc at `docs/design-lattice-remote.md`) but zero
code exists. Single-machine only today. This means it cannot replace
GitHub Projects as the team-wide source of truth.

**Recommended approach: hybrid integration.**
- GitHub Projects stays as the human-facing, cross-team source of truth
- Lattice runs locally as the agent-facing coordination layer
- Bridge via hooks: `hooks.on.status_changed` fires a script that
  calls `gh project item-edit` to keep GitHub in sync
- `lattice next` replaces the ranking logic in startwork-gather
- The event log serves as a catch basin — every agent comment, status
  change, and decision is recorded with attribution

**Direct mappings to current system:**
| Current component | Lattice equivalent |
|------------------|-------------------|
| Startwork task ranking | `lattice next --claim` |
| Triage: agent-resolvable vs. human-decision | `needs_human` status |
| Dependency protocol (issue linking) | `blocks` / `depends_on` relationships |
| WIP limits (CLAUDE.md table) | `config.json` WIP limits per status |
| Compound finding catch basin | Event log + hooks on `* -> done` |

**Gaps that would need bridging:**
- No file-level conflict detection (startwork checks for overlapping
  file changes; Lattice doesn't track files per task)
- No GitHub issue/PR integration (git hook feature designed, not built)
- Python 3.12+ dependency in a Bun-based stack
- No notifications (Slack, email, push)
- Team model is thinner than CLAUDE.md (no per-member capabilities
  or role-task mapping)
- Custom statuses needed for triage and compound pipeline stages

**Assessment:** Don't adopt today. Watch closely. If Remote ships and
schema stabilizes, Lattice becomes the strongest candidate for the full
task state layer. In the meantime, a low-commitment local experiment
(Lattice on the SI's machine, bridged to GitHub) could test whether
the agent-native interface and event-sourced model improve compound
engineering workflows.

**Possible contribution:** The StorageBackend protocol refactor (Phase 1
of Remote) is a clean, well-scoped piece of work that doesn't require
the server — just a Protocol class and a `LocalStorage` wrapper.

**Background:** Hart attended Atin's talk earlier in the week and is in
a shared context engineering group chat with him. Some design decisions
in the Schelling Points system (notably `needs_human` routing and
treating the human attention bottleneck as a high-level engineering
priority) were influenced by that talk. The relationship is early-stage
but philosophically and pragmatically aligned; a collaboration would
likely be mutually beneficial.

**The learning layer is the uncovered territory.** Lattice solves
agent-human task coordination. What it doesn't yet address is the
multi-human, multi-agent *learning* loop — the compounding, signal
flow, and compound engineering dimensions that are the core of this
project. If Lattice becomes the coordination substrate, Hart's
contribution is the layer that makes the whole thing a learning system
(per the working principle: embedding knowledge into form to produce
higher function).

**Next step:** Deeper architectural study of Lattice. Hart has only
skimmed the codebase. Understanding the full architecture — especially
the event model, hook system, and Remote design — would clarify where
the learning layer plugs in and whether contributing to Lattice (vs.
building on top of it) is the better path.

**Bun dependency note:** The only Bun-specific artifact is
startwork-gather.ts. Rewriting it in Python to align with Lattice's
stack is trivial. Not a factor in adoption decisions.

### 5.3 ClaudeConnect assessment

**Repo:** [github.com/bstadt/cc_daemon](https://github.com/bstadt/cc_daemon)
(Calcifer Computing + Epistemic Garden / Xiq). MIT license, Python,
Homebrew install.

**What it does:** Encrypted file sync between Claude Code instances.
You designate a folder, ClaudeConnect encrypts (X25519 + AES-256-GCM)
and syncs it to a central server. Teammates' Claude instances read
each other's shared context. Path-based permissions via `authz` file.
Asynchronous — works when peers are offline.

**Assessment: back-burnered for the coordination layer.** Three
structural mismatches:

1. **Bypasses human triage.** Our architecture gates signal propagation
   through human authority (P7). ClaudeConnect makes shared files
   ambient — Agent A reads Agent B's output without anyone deciding
   if it's signal or noise. The triage gate is the feature, not the
   bottleneck.

2. **Replicated database with worse guarantees.** Distributed file sync
   with a shared schema is a database with extra steps — no atomic
   writes, no conflict resolution, no query language, no single source
   of truth. The one advantage (agents use local file tools without an
   API layer) trades architectural integrity for tool convenience.

3. **Gitignored shadow state.** ClaudeConnect-mediated files should be
   gitignored (they're continuously mutating working state). This
   creates an unversioned, unauditable layer of project knowledge
   invisible to anyone not running ClaudeConnect. If a teammate stops
   running it, their node's knowledge goes stale silently.

**Additional risk: prompt injection propagation.** Agents with broad
internet access can be subject to prompt injection. ClaudeConnect's
ambient sharing means a compromised agent's outputs propagate instantly
into the shared pool and from there into every connected agent's
context.

**Where it might fit (not now):** Pre-triage context priming — if
`/startwork` could query a shared working-knowledge pool for items
relevant to today's tasks, the benefit of low-friction capture could
be had without ambient loading. But this is a hypothetical integration,
not a current need. The existing stack (local capture → human triage →
GitHub as durable layer) covers the same ground with stronger
guarantees.

**Design insight preserved:** The real variable isn't the transport
layer (ClaudeConnect vs. git vs. shared folder). It's the **loading
policy** — when and how content enters the agent's attention:
always-on (ambient), on-demand (agent queries), or session-start-composed
(`/startwork` pulls relevant state). Our architecture uses the third
pattern. ClaudeConnect defaults to the first. The loading policy
determines whether shared context helps or hurts, independent of how
it gets there.

---

## 6. Source Inventory

All the places where knowledge about this system currently lives.

| Source | Location | Content type | Access method |
|--------|----------|-------------|---------------|
| Group project repo | `~/Documents/GitHub/schelling-points/` | Code, configs, docs, git history | Direct file access |
| Solo project repo | `~/Documents/GitHub/claude-game/` | Code, configs, docs, git history | Direct file access |
| Roger harness | `~/Documents/GitHub/roger/` | Design docs, skills, principles | Direct file access |
| Bootcamp template | https://github.com/fractal-nyc/claude-game.git | Starting point for comparison | Git diff against initial commit |
| Hart's Claude conversations | schelling-points project folder | Design decisions, debugging, iteration | Claude conversation export/review |
| Hart's Claude conversations | roger project folder | Metacognitive work, harness design | Claude conversation export/review |
| Discord group chat | Team Discord server | Coordination protocols, verbal agreements | Manual export or recall |
| Hart's memory | — | Failure modes, sequencing rationale, pain points | Exploratory dialog |

---

## 7. Publication Strategy

### Levels of analysis

1. **Practitioner guide**: "How to set up Claude Code for a small dev
   team" — concrete, step-by-step, immediately useful.
2. **Design rationale**: "Why these protocols, in this order" — the
   decision-making process behind the system's shape.
3. **Pattern language**: The reusable coordination patterns extracted from
   this specific instance — agent/human triage, conflict detection,
   dependency lifecycle, etc.
4. **Conceptual contribution**: "Multi-user harness adapters" as a new
   category in AI-assisted development.

### Publication vehicles (TBD)

- Blog post(s) — likely primary vehicle
- GitHub README / docs on the shareable system itself
- Bootcamp presentation or demo
- Possible conference talk or workshop proposal (longer horizon)

### Early publication targets

The fire-hose problem means the first publications should be small,
concrete, and capitalize on fresh memory:

- **Quick win 1**: Short post on the startwork command — what it does, why
  it matters, how to set it up. Standalone, immediately useful.
- **Quick win 2**: The triage protocol — agent-resolvable vs.
  human-decision as a pattern. Also standalone.
- **Quick win 3**: The signal flow asymmetry — "Your AI team's learnings
  only compound at one node" as a provocation. Short, conceptual,
  shareable. Could go before or after the practitioner pieces.
- **Medium piece**: Full retrospective — what the system is, how it
  evolved, what worked, what didn't. This is the main publication target
  but requires more retrospective work first.

---

## 8. Harness Integration

Cross-references between this project and `design/harness-features.md`.
Each item below advances both the solo harness AND de-risks the
multi-user build.

### Direct feature mappings

| Brainstorm concept | Harness feature (in harness-features.md) | Principle |
|-------------------|------------------------------------------|-----------|
| Signal catch basin (§4) | Intervention effectiveness tracking, friction logging, automated memory proposals | P6 |
| Propagation verification (§4.1) | Compounding indicators | P6 |
| Compound engineer role (§4) | Solo compound engineer (weekly review) | P6 |
| Resource lifecycle revision (§4.3) | Archive-not-delete lifecycle | P6 |
| Startwork command (§1) | Solo startwork (pre-work check) | P2 |
| Team intake/setup (§3) | Parameterized user model | P3 / Composability |
| Multi-node coordination (§5) | Multi-Claude orchestration, Multi-user learning layer | Unsorted |
| Bandwidth-aware sequencing (§9) | Attentional load estimation | P1 / P2 |
| Retrospective capture phase (§6) | Corpus miner (already built) | P6 / P2 |
| Handoff test (§1) | Handoff test skill (check if group project version has evolved) | Unsorted |

### Principle upgrade

P6 in harness-features.md has been upgraded from "The system improves
through use" to "The system embeds knowledge into its own form" — the
stronger claim from this brainstorm's working principle. The old
framing described accumulation; the new framing describes structural
self-modification.

### Recommended build order (serves both projects)

1. **Voice-to-text** (P1+P2) — immediately serves capture phase;
   highest ROI at current bandwidth
2. **Solo startwork** (P2) — prototypes multi-user coordination;
   attention-composition tool
3. **Solo compound engineer / weekly review** (P6) — tests compound
   engineering workflow before scaling
4. **Compounding indicators** (P6) — signal-loss detection; prototypes
   propagation verification
5. **Parameterized user model** (P3) — serves both solo onboarding
   and multi-user team intake

### Remaining integration todos

- [ ] Triage patterns — the agent-resolvable vs. human-decision
  distinction applies to solo work too
- [ ] Session-log-analyzer subagent — potential value for retrospective
  learning in roger
- [ ] "Solve the class, not the instance" as an explicit SI skill or
  checklist — build the meta-level into the toolkit

---

## 9. Sequencing Considerations

Hart's bandwidth is constrained (70+ hour week, "day off," fire-hose
cognitive load). The plan needs to:

1. **Front-load knowledge capture** before memories fade
2. **Produce early, small deliverables** to maintain momentum and access
   fresh recall
3. **Defer generalization and building** until the retrospective is solid
4. **Sequence publication milestones** as forcing functions for synthesis

### Rough phase sketch (to be refined into actual plan)

**Phase A — Capture (days 1-3)**
- Diff template vs. final system
- Exploratory dialog to surface implicit knowledge
- Document failure modes and sequencing rationale
- Quick-win publication #1

**Phase B — Analyze (days 3-5)**
- Map coordination patterns
- Identify what's team-specific vs. general
- Cross-reference roger/ work for integration opportunities
- Quick-win publication #2

**Phase C — Design (days 5-8)**
- Spec the generalizable system (intake, config, conventions)
- Identify ClaudeConnect integration points
- Design the intake/setup flow
- Harness integration tasks

**Phase D — Build & Publish (days 8+)**
- Implement the generalizable system
- Write the full retrospective
- Ship the shareable version

---

## 10. Open Questions

- ~~**ClaudeConnect**~~ — Assessed 2026-02-23. Back-burnered. See §5.3.
- **Bootcamp template**: https://github.com/fractal-nyc/claude-game.git
  (available for diff)
- **Discord export**: Is it practical to export the group chat for mining,
  or is recall-based reconstruction more efficient?
- **Team feedback**: Would teammates contribute observations about what
  worked/didn't? Their perspective on the system's effectiveness would
  strengthen the retrospective.
- **Naming**: See §5.1 for candidates. Decision tabled.
- **Scope of "shareable"**: Is the goal a GitHub template repo? A blog
  post with instructions? A tool with an installer? The answer affects
  the build phase significantly.
