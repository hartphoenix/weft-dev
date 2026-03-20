# Coordination Layer

Team coordination module for Claude Code. Connects individual
developer harnesses into a shared workflow: task ranking, conflict
detection, triage routing, dependency tracking, and signal return path.

**Source:** Extracted from a group project field test (4-person team,
1-week build cycle, Feb 2026). Field-tested through a full development
lifecycle with PRs, code review, and task coordination all running
through the system. See `research/` for field-test reference material.

## Components

| Component | Location | Function |
|-----------|----------|----------|
| Startwork command | `commands/startwork.md` | Pre-work conflict detection, dependency checking, task ranking |
| Workflow pipeline | `commands/workflows/` | 6-stage: brainstorm → plan → work → review → triage → compound |
| Coordination skills | `skills/` | brainstorming, compound-docs, document-review, handoff-test |
| Subagents | `subagents/` | 9 specialized analysis agents for review/plan/compound phases |
| Gather script | `scripts/startwork-gather.ts` | Board state aggregation (GitHub Projects API) |
| Review config | `compound-engineering.md` | Multi-agent review orchestration |

## Generalization status

These files were extracted from a field-test project and generalized.

### Configuration points

- `compound-engineering.md` — Project description and review concerns.
  Replace placeholder content during team intake.
- `scripts/startwork-gather.ts` — `ORG_OWNER` and `PROJECT_NUMBER`
  constants at top of file. Set to your GitHub org/project.

### Subagents

All subagents are project-agnostic:

- `subagents/best-practices-researcher.md`
- `subagents/code-simplicity-reviewer.md`
- `subagents/decision-balance-audit.md` — Decision & trade-off analysis
- `subagents/feature-ui-completeness.md` — UI completeness audit
- `subagents/framework-docs-researcher.md`
- `subagents/learnings-researcher.md`
- `subagents/repo-research-analyst.md`
- `subagents/session-log-analyzer.md`
- `subagents/spec-flow-analyzer.md`

## Installation target

When installed into a project, these files map to:
```
project/
├── .claude/
│   ├── commands/
│   │   ├── startwork.md
│   │   └── workflows/*.md
│   ├── skills/
│   │   ├── brainstorming/
│   │   ├── compound-docs/
│   │   ├── document-review/
│   │   └── handoff-test/
│   ├── subagents/*.md
│   ├── scripts/startwork-gather.ts
│   └── compound-engineering.md
```

The project's CLAUDE.md gets team-specific sections added during
team intake: member roster, roles, WIP limits, conventions, dependency
protocol, and label taxonomy.
