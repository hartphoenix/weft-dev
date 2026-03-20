---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/f9565279-93c0-4d31-9e73-6cd19af7025c.jsonl
stamped: 2026-02-27T00:16:16.484Z
---
# Handoff: Package Launch Prep

## What to do

Execute the plan at `design/package-prep.md`. It has full context,
exact content for each new/rewritten README section, the license
decision (GPL v3), and a verification checklist.

## Branch

You're on `hart/yaml-current-state`. It has one committed change
(YAML template switch) and uncommitted one-shot fixes (consent.json
rename across 15 files, handoff-test dev mirror copy, grep platform
fix in session-start.sh). The plan's edits go on top of these.

## What the plan covers

1. Create `LICENSE` at repo root (GPL v3, copyright Hart Phoenix 2026)
2. Add "The learning loop" section to `package/README.md`
3. Replace skills table with categorized version (8 skills, grouped)
4. Add "Under the hood" section (6 undocumented features)
5. Rewrite "Data sharing" section (option B: one-way signal dispatch,
   explain maestro-signals is developer feedback repo)
6. Add troubleshooting section
7. Add platform note to prerequisites

All content is written out in the plan — no drafting needed, just
apply the edits to `package/README.md` and create the LICENSE file.

## After edits

Run the verification checklist at the bottom of the plan. Then commit
everything on this branch (both the prior uncommitted one-shots and
the new README/LICENSE work). Do not push.
