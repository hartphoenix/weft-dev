---
session: (no matching session found)
stamped: 2026-02-25T01:28:14.363Z
---
# Feature-UI Completeness Audit

For every state field, config value, or feature introduced in the PR, audit:

1. **Visibility**: Is every piece of internal state that affects behavior surfaced to the user somewhere in the UI? Flag any "invisible mechanics" — systems that work in code but give the user zero feedback.
2. **Feedback loop**: When the user takes an action (submit, toggle, input), is there immediate visible confirmation that something changed?
3. **Consumables & counters**: Are quantities shown before use, after use, and on depletion? Can the user tell when they're running low?
4. **Dead-end UX**: Can the user reach a state where a feature exists but they have no way to discover or understand it from the UI alone?

Read the source files. For each finding, report: field name, where it's set, where it's used in logic, whether it's rendered anywhere, and your verdict. Return a structured list of findings with suggested severity (P1/P2/P3).
