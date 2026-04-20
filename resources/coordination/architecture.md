---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:18:31.648Z
---
# Coordination Layer — Architecture

Single source of truth for the coordination layer's design reasoning:
signal flow, the compound engineer role, tool evaluations, and
generalization strategy.

**Companion docs:**
- Component inventory and installation: `coordination/README.md`
- Startwork specification (solo + team): `design/startwork.md`
- Design principles governing the harness: `design/design-principles.md`

---

## Signal Flow Architecture

The coordination layer exists to solve a fundamental asymmetry: in a
multi-agent team, **learning compounds only at the systems integrator's
node.** Findings flow outward (SI pushes updated configs via GitHub) but
don't flow inward (other devs' local learnings, failure modes, and
success patterns are invisible to the SI and to each other).

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
pattern: **any signal generated locally without an explicit return path
to someone who can act on it systemwide is lost.**

Instances:
1. Compound docs generated on Dev B's machine that the SI never sees
2. A workaround Dev A discovered that would benefit Dev C
3. A failure mode in the triage protocol that only surfaces on branches
   with certain characteristics
4. Implicit workflow knowledge that lives in Discord but never enters
   the system's documentation
5. Resource lifecycle deleting brainstorms/plans before their lessons
   are fully integrated

### Design principle: solve the class, not the instance

This principle governs the plan AND is built into the SI's toolkit.
The system needs mechanisms that detect and route signal loss *in
general*, not just specific known signal types.

---

## The Compound Engineer Role

A distinct function in the multi-user system. The compound engineer:

1. Reads compound documentation produced by the whole team
2. Identifies patterns at a level of abstraction above individual tasks
3. Applies those patterns back to the system's structure (workflows,
   conventions, configs)
4. Filters what's worth applying vs. what's noise

This requires under-the-hood knowledge of the workflow system,
systems-level discernment about what to change, and bandwidth to do
meta-work. Most team members won't have this context. The system makes
it easy for them to *generate* signal and route it to someone who can
act on it.

### SI toolkit requirements

The SI needs:
- **Signal detection** — "Where is this system currently losing
  information?" Periodic audit or automated check.
- **Pattern recognition** — "Is this a new instance of a known
  signal-loss class, or a new class?"
- **Propagation verification** — "Did the change I made actually reach
  and affect the team's workflow?"

---

## Signal Catch Basin

A mechanism that:
1. **Catches** signal at the point of generation (on any dev's machine)
2. **Routes** it to the SI / compound engineer with enough context
3. **Persists** it until processed (no premature deletion)
4. **Closes the loop** — resulting system changes are traceable back to
   the signal that prompted them

### Implementation: GitHub issues as return channel

The compound workflow auto-creates a GitHub issue assigned to the SI,
tagged `compound-finding`, linking the solution doc. The SI processes
these as a batch. This reuses existing infrastructure and gives the SI
a filterable, prioritizable queue.

---

## Resource Lifecycle

Archive, don't delete. Findings in ephemeral docs may not have been
fully integrated before deletion.

| Artifact | Policy |
|----------|--------|
| `docs/brainstorms/*.md` | Move to `docs/archive/brainstorms/` after PR merge |
| `docs/plans/*.md` | Move to `docs/archive/plans/` after PR merge |
| `docs/solutions/*.md` | Persistent (unchanged) |
| `.claude/todos/agent/*` | Delete after completion (pure task state) |

The archive serves as a persistent catch basin. Cost is disk space
(negligible) vs. cost of lost signal (potentially high).

---

## Loading Policy

The real design variable isn't the transport layer (ClaudeConnect vs.
git vs. shared folder). It's **when and how content enters the agent's
attention:**

1. **Always-on (ambient)** — injected into every session. Highest cost.
   Appropriate for CLAUDE.md core, user model.
2. **Session-start-composed** — `/startwork` pulls relevant state,
   human triage before load. Medium cost. Appropriate for task state,
   dependencies, team signals.
3. **On-demand (queryable)** — agent accesses when needed. Lowest
   ambient cost. Appropriate for corpus, references, archive.

The gated-propagation principle: capture is low-friction; propagation
into shared or ambient context is human-gated.

---

## Relationship to the Solo Harness

In single-user, the embedding loop is closed by default — the human
and the agent are the same node. In multi-user, the loop opens at every
team boundary. The coordination layer's core job is to **keep the
learning loop closed across those boundaries.**

This reframes the system. It's not primarily a coordination tool
(though it coordinates). It's a distributed learning system that
happens to coordinate work as a side effect of keeping the learning
loop intact.

---

## Generalization Strategy

### Scope boundary

**In scope:** Dev teams of 2–24, using GitHub, building software with
Claude Code as a primary development tool. Any tech stack.

**Out of scope (for now):** Non-GitHub workflows, teams > 24, projects
without Claude Code, non-software projects.

### Generalization layers

1. **Config layer** — project name, team members, tech stack, repo
   URLs, board URLs. Pure data, no logic changes needed.
2. **Convention layer** — branch naming, commit format, label taxonomy,
   PR rules. Reasonable defaults with override points.
3. **Workflow layer** — the 6-stage pipeline. Probably stable as-is;
   the question is which stages are mandatory vs. optional for smaller
   teams.
4. **Coordination layer** — startwork, triage, dependency protocol. The
   core IP; needs to be parameterized but not fundamentally redesigned.

---

## Tool Evaluations

### Lattice

**Repo:** https://github.com/Stage-11-Agentics/lattice
**Status:** v0.2.1-alpha, MIT, Python 3.12+

File-based, event-sourced task tracker built for agent-human hybrid
workflows. All state in `.lattice/`. Every mutation is an immutable
event with actor attribution.

**What it provides that GitHub Projects doesn't:**
- Agent-native CLI with `--json`
- Full event-sourced audit trail with actor attribution
- Typed relationships: `blocks`, `depends_on`, `subtask_of`
- Status transition enforcement via configurable graph
- `needs_human` as first-class status
- `lattice next` with `--claim`
- Resource locking, shell hooks, completion policies, session tracking

**Hard blocker:** No multi-machine sync. Lattice Remote is designed but
unbuilt. Single-machine only today.

**Recommended approach: hybrid integration.**
- GitHub Projects stays as the human-facing, cross-team source of truth
- Lattice runs locally as the agent-facing coordination layer
- Bridge via hooks: `hooks.on.status_changed` syncs to GitHub
- `lattice next` replaces ranking logic in startwork-gather
- Event log serves as catch basin

**Assessment:** Don't adopt today. Watch closely. If Remote ships and
schema stabilizes, Lattice becomes the strongest candidate for the full
task state layer.

### ClaudeConnect

**Repo:** github.com/bstadt/cc_daemon (MIT, Python)

Encrypted file sync between Claude Code instances.

**Assessment: back-burnered.** Three structural mismatches:

1. **Bypasses human triage.** Our architecture gates signal propagation
   through human authority. ClaudeConnect makes shared files ambient.
2. **Replicated database with worse guarantees.** No atomic writes, no
   conflict resolution, no query language.
3. **Gitignored shadow state.** Unversioned, unauditable layer of
   project knowledge.

**Additional risk:** Prompt injection propagation via ambient sharing.

**Design insight preserved:** The loading policy matters more than the
transport mechanism (see Loading Policy section above).
