# Session Workflow Analysis

You are analyzing Claude Code session transcripts to understand how a user naturally works within a personal development harness. The goal is to identify "desire paths" — the natural workflow patterns — so we can design thread-aware skills that pave those paths rather than fight them.

## Your assigned sessions

Read each session extract carefully. For each of the 23 questions below, provide evidence from your assigned sessions. Quote specific turns, messages, or patterns. If a question doesn't apply to any of your sessions, say so explicitly.

## Analysis Framework (23 Questions)

### Thread awareness (Q1-4)
1. **When does a session's thread become apparent?** Is it clear from the first message, or does it emerge mid-session? How often does the user explicitly name what they're working on vs. the agent inferring it from context?
2. **How often do sessions span multiple threads?** When they do, is there a clear switch point, or does the work blur between them?
3. **Does git branch correlate reliably with thread?** For sessions on feature branches, does the branch name predict the thread? How often does work on branch X touch thread Y's files?
4. **What signals indicate a new thread should be created?** Look for sessions where work started that didn't belong to any existing category.

### Startwork / session opening (Q5-8)
5. **What does the user actually do in the first 5 messages?** Categorize: "continue where I left off" (Tier 1), "I need to do X" (Tier 2), "what should I work on" (full startwork), or "just starting X" (override).
6. **How often does the user invoke /startwork vs. just starting?** When they skip it, what do they do instead?
7. **When the user resumes prior work, how do they re-establish context?** Re-read files? Ask agent to summarize? Reference a handoff doc? Open files in IDE?
8. **How much session-opening overhead is tolerable?** Evidence of the user being impatient with setup, or evidence of thorough setup paying off.

### Persist / artifact routing (Q9-12)
9. **When artifacts are created, what determines their location?** Does the user specify a path? Does the agent choose? Negotiation?
10. **How often is /persist actually used vs. artifacts being written directly?**
11. **When the user creates a plan or design doc, do they reference the thread it belongs to?**
12. **What happens to artifacts after creation?** Referenced later? Updated? Superseded? Orphaned?

### Handoff / session ending (Q13-15)
13. **How do sessions end?** Look for ALL handoff signals: /handoff-prompt, /persist, /handoff-test, explicit "let's wrap up", user summarizing state, user asking for next steps, abrupt stops, gradual wind-downs, no ritual at all.
14. **When handoff artifacts are created, what happens to them?** Saved to file? Output to stdout and lost? Fed to next session?
15. **What information is lost between sessions?** For session pairs on the same thread, what does the second session have to rediscover?

### Progressive summarization / thread maintenance (Q16-18)
16. **When does _thread.md-like information get written today?** Moments where user or agent summarizes thread state, records decisions, notes next steps.
17. **What's the natural grain of "decisions made"?** Per-session? Per-feature? Per-conversation-turn?
18. **How quickly does thread state go stale?** Evidence of handoff docs becoming misleading.

### Productivity beyond artifacts (Q19-20)
19. **What does session productivity look like when no file is created?** Decision advancement, understanding gained, debugging progress.
20. **What gets lost between sessions when progress isn't file-level?** Decisions made verbally, options eliminated, understanding gained.

### Pain points and success patterns (Q21-23)
21. **Top 3 recurring pain points across your assigned sessions.**
22. **Sessions where everything worked well — what made them different?**
23. **Where does the user correct the agent's assumptions about what they're working on?**

## Output format

For each question, provide:
- **Finding:** 1-2 sentence summary
- **Evidence:** Specific quotes or turn references from your sessions
- **Sessions contributing:** Which session IDs showed this pattern

After all 23 questions, add:
- **Surprises:** Anything notable outside the question framework
- **Dominant pattern in this batch:** The single strongest workflow pattern you see across your assigned sessions
