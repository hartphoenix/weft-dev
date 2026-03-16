---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:53:58.249Z
---
# Plan: README Overhaul + License + Launch Readiness Fixes

## Context

Launch readiness audit surfaced 4 blockers and 7 warnings. One-shot
fixes already applied (consent.json rename, handoff-test mirror,
grep -oP platform fix). Remaining work is README documentation and a
license decision.

This plan covers all remaining items. The README edits are
interdependent (new sections reference each other), so they're planned
as a single coordinated pass.

---

## 1. License file (B1)

**Decision needed from Hart.** Present options in layman's terms:

- **MIT** — "Anyone can use, copy, modify, sell. They just have to
  include your copyright notice. Most popular open-source license.
  Used by React, Node, Rails." Pick this if you want maximum adoption.
- **Apache 2.0** — Like MIT but also includes a patent grant (protects
  users from patent claims) and requires stating changes. Pick this if
  you want corporate-friendly with slightly more protection.
- **GPL v3** — Anyone can use and modify, but if they distribute a
  modified version they must also open-source it under GPL. Pick this
  if you want to ensure derivatives stay open.
- **Proprietary / All Rights Reserved** — No one can use without your
  permission. Pick this if you want to control distribution.

**Recommendation:** MIT. The harness is a personal tool — adoption
matters more than control. MIT is one line plus a copyright notice.

**Action:** Create `LICENSE` at repo root with Hart's chosen license.

---

## 2. Learning loop section (B2)

**What:** Add a new `## The learning loop` section after "Quick start"
(before "Update"). This is the unified explanation of how the cycle
works.

**Content structure:**

```
## The learning loop

The harness improves your profile every time you use it. Here's the
cycle:

1. **Work** — use Claude Code normally in any project
2. **Review** — run `/session-review` when you finish a work session.
   It analyzes what you did, quizzes you on 4-6 concepts, and updates
   your scores and gap classifications.
3. **Plan** — next time you start working, `/startwork` reads your
   updated state and proposes what to focus on. It runs automatically
   at session start via the hook, or invoke it directly.
4. **Reflect** — after 3+ sessions, `/startwork` automatically
   dispatches `/progress-review` to detect cross-session patterns:
   stalls, regressions, goal drift, arc readiness. You can also run
   `/progress-review` directly anytime.

The more sessions you complete, the sharper the system gets. Concept
scores are quiz-verified, not self-reported — so the profile converges
on reality.
```

**Also:** Remove the inline learning loop description from the
"3. Start working" subsection (lines 81-85) to avoid duplication.
Replace with a forward-reference: "See **The learning loop** below."

---

## 3. Skills table (B3)

**What:** Replace the current `## Skills included` table with a
categorized table. All 8 skills. No "how to call" column since all
use `/skill-name`. Add a note about auto-dispatch.

**Structure:**

```
## Skills

All skills are invoked with `/skill-name` in Claude Code.

### Core loop

| Skill | What it does |
|-------|-------------|
| **intake** | Onboarding interview — bootstraps your profile from background materials and conversation |
| **session-review** | End-of-session analysis, quiz, and learning state update |
| **startwork** | Session planner — reads your state and proposes what to focus on |
| **progress-review** | Cross-session pattern analysis — detects stalls, regressions, and goal drift |

### Working tools

| Skill | What it does |
|-------|-------------|
| **quick-ref** | Fast, direct answers. Flags structural gaps in one sentence. |
| **debugger** | Visibility-first debugging — gets the full error before guessing |
| **lesson-scaffold** | Restructures learning materials around what you already know |
| **handoff-test** | Audits your work artifacts for self-containedness before context is lost |

### Automatic dispatch

Some skills run automatically without you invoking them:

- **startwork** dispatches **progress-review** when 3+ sessions have
  accumulated since the last review
- The **session-start hook** checks your learning state and suggests
  `/intake` if you haven't run it, or `/startwork` if your profile
  is stale
- **quick-ref** and **debugger** activate contextually based on what
  you're doing — no slash command needed
```

---

## 4. Undocumented features (B4)

**What:** Add brief documentation for 6 features that exist in code
but aren't in the README.

**Where:** New subsection `## Under the hood` after the skills section.

```
## Under the hood

These files are created and managed by skills during normal use.
You don't need to touch them, but knowing they exist helps if you're
debugging or customizing.

| File | Created by | Purpose |
|------|-----------|---------|
| `learning/session-logs/YYYY-MM-DD.md` | session-review | One file per reviewed session. YAML frontmatter + markdown body. |
| `learning/scaffolds/` | lesson-scaffold | Restructured learning materials with concept classifications |
| `learning/relationships.md` | intake (if opted in) | Teacher/mentor handles and signal repo config |
| `learning/.intake-notes.md` | intake | Resume checkpoint if intake is interrupted mid-interview |
| `learning/.progress-review-log.md` | progress-review | Tracks review windows and deferred findings |

### Session-start hook

When you open Claude Code, a hook runs automatically. It checks:

- Whether you've run `/intake` yet (suggests it if not)
- Whether a previous `/intake` was interrupted (offers to resume)
- Whether your learning profile is stale (suggests `/startwork`)
- Whether harness updates are available (if `"updates": "notify"`)
```

---

## 5. Data sharing section update (Option B + W3)

**What:** Rewrite the `## Data sharing (optional)` section to:
1. Explain that signal dispatch is currently one-way (option B)
2. Explain that `hartphoenix/maestro-signals` is the developer's repo
   for feedback that improves the harness code
3. Note that teacher response loop is designed and coming

**Replacement content:**

```
## Data sharing (optional)

During `/intake`, you'll be asked if you want to share learning data
to GitHub. One question, one consent. If you opt in:

**Developer signals** — at the end of each `/session-review`, a short
signal is posted to the developer's repo (`hartphoenix/maestro-signals`)
with your feedback on how the tool worked, plus learning metrics
(concept scores, gap types, progress patterns). This data helps improve
the harness — it's how bugs get found and skills get sharpened. You see
every signal before it sends and approve or skip each one.

**Progress repo** — a public GitHub repo is created on your account
(`your-username/learning-signals`). When you run `/progress-review`,
a summary posts there. Teachers, mentors, or peers can watch the repo
and comment with guidance.

**What's shared:** concept scores, gap types, progress patterns, goals,
and growth edges.
**What's never shared:** conversation content, code, file paths,
background materials, or raw quiz answers.

**Current status:** Signal dispatch (you → developer) works now.
The teacher response loop (teacher comments → surfaced in your next
`/startwork`) is designed and coming in a future update. For now,
teacher feedback works through normal GitHub issue comments — you'll
see it when you check your progress repo.

**To invite a teacher:** send them your progress repo link. They Watch
it on GitHub. Add their GitHub handle to `learning/relationships.md`
and `/progress-review` will assign issues to them automatically.

To opt out of all data sharing, delete `.claude/consent.json`.
```

---

## 6. Troubleshooting section (W5)

**What:** Brief troubleshooting section after "Everything is editable."

```
## Troubleshooting

**Intake interrupted mid-interview:** Run `/intake` again. It detects
the interrupted state and offers to resume where you left off.

**Skills not activating:** Run `bash ~/maestro/scripts/bootstrap.sh`
to re-register. Bootstrap is idempotent — safe to run multiple times.

**Session-review says no learning state:** Run `/intake` first. The
review needs the profile that intake creates.

**Update check not working:** Verify your maestro directory is a git
repo with a remote: `cd ~/maestro && git remote -v`. The hook fetches
in the background — it won't block your session.
```

---

## 7. Platform note

**What:** Add one line to Prerequisites noting platform support.

After the prerequisites list, add:

```
Tested on macOS. Linux should work — all scripts use portable bash
and POSIX utilities. Windows users: use WSL.
```

---

## File changes summary

| File | Change |
|------|--------|
| `LICENSE` | New file — chosen license text |
| `package/README.md` | Sections 2-7 above (learning loop, skills table, under the hood, data sharing rewrite, troubleshooting, platform note) |

---

## Verification

1. Read the final README top to bottom — confirm it flows linearly
   for a new user (install → intake → work → review → plan → reflect)
2. Verify all 8 skills appear in the skills table
3. Verify all 6 undocumented features appear in "Under the hood"
4. Grep for "feedback.json" — confirm zero results (already done)
5. Confirm data sharing section mentions `hartphoenix/maestro-signals`
   by name and explains it's for developer improvement
6. Confirm option B language is honest about one-way dispatch
