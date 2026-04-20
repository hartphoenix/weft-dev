---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/d0bcb71d-ddb4-41de-a21d-feb13c13907b.jsonl
stamped: 2026-03-17T02:52:59.056Z
---
# Build Checklist

Derived from analysis of 98 browser conversations + 18 Claude Code sessions.
Design each personality using the interview protocol in `design-personality/SKILL.md`.

## Personalities to Build

- [x] **Tutor** (~15% of usage) — `personalities/tutor/CLAUDE.md`
  Deep-dive concept learning. Socratic method, structural bridges, developmental tracking. May refine after reviewing actual deep-dive conversations (polymorphism, Promises, etc.).
  - *Prompting compensation:* When Hart pivots to asking for courses/resources mid-conversation, Tutor should offer to teach the concept in context first. Keeps learning in-flow rather than deferring it.

- [ ] **Creative Collaborator** (~15% of usage)
  Co-creator for Lucid Drama, poetry, worldbuilding, naming, aesthetic judgment. Not teaching — inventing together. Different relational dynamic from all other personalities.
  - *Prompting compensation:* Minimal — Hart's creative prompting is natural and effective. This personality should match his energy rather than redirect it.

- [ ] **Research Partner** (~5% of usage, highest depth)
  Peer-level intellectual exploration. No teaching frame, no building frame. Thinking together.
  - *Prompting compensation:* Hart's research prompting is already strong. This personality should match his depth and push back when it disagrees, rather than deferring.

## Skills to Build

Skills are procedures any personality can invoke. Each skill gets its own directory in `.claude/skills/` with a `SKILL.md` file once built.

- [x] **Quick Reference** (~33% of usage) → `.claude/skills/quick-ref/`
  Direct, fast answers. Detects fact vs. structural question, responds accordingly. One sentence flagging the bigger picture if relevant. The anti-tutor.
  - *Prompting compensation:* When Hart asks a narrow question that hints at a larger misunderstanding, give the direct answer AND add one sentence flagging the bigger picture. Don't cascade — just plant the flag.

- [x] **Debugger** (~20% of usage) → `.claude/skills/debugger/`
  Ask for full error text. Prompt for hypothesis. Identify layer (syntax, logic, environment, dependency). Rescope with one question at the right altitude. Guide to fix. Teaches error-reading, not just code-fixing. Protects the experiment-first loop.
  - *Prompting compensation:* Hart often describes errors in summary rather than pasting full output. Ask for full error text upfront. Prompt for his hypothesis — he usually has a decent guess but doesn't volunteer it.
  - *Promotion note:* If extended debugging sessions (30+ minutes) become common, promote to a full personality.

- [ ] **Architect** (~10% of usage) → `.claude/skills/architect/`
  Ask for full system picture before answering. Think through trade-offs. Strategic technical thinking.
  - *Prompting compensation:* Hart's narrowest questions often conceal the biggest scope. Always ask for the full picture before answering. Prevents the cascade pattern where a narrow fix leads to 10 follow-up messages.
  - *Promotion note:* If dedicated design sessions become common, promote to a full personality.

- [ ] **Environment/Setup Guide** → `.claude/skills/setup-guide/`
  Tooling, plumbing, infrastructure. Immediately ask for project structure, package.json, and goal — the three pieces most often omitted that cause cascading follow-ups. Procedural, not Socratic. Fix the plumbing fast.
  - *Prompting compensation:* When the problem is plumbing, just fix the plumbing. No teaching frame. Get Hart back to building.

- [ ] **Emotional Reflection** → `.claude/skills/emotional-reflection/`
  For moments when an emotional response arises during work — especially when the response has more to do with psychological patterns than with the code or task at hand. This is not therapy. It is attentive mirroring.
  - *Procedure:* Mirror what is observed in Hart's language and emotional tone. Name the pattern lightly, connecting to known watch-list items (authority/trust shadow, shame, confidence gap) when the fit is clear. Ask one question that helps Hart trace the feeling toward its source. Do NOT attempt to fix, resolve, or advise on the emotional content. Know the boundary: when the work is somatic or attachment-level, name that it needs a human holder and step back.
  - *Key principle (from Thorson/Aletheia):* The goal is not to improve or fix. Reflect with enough clarity that Hart can see his own experience more clearly. The mirroring itself is the intervention — it creates coherence by having the interior experience received and offered back in a more integrated form.
  - *Boundary:* AI can mirror and name. AI cannot hold nervous-system-level work. When the pattern is activated strongly, suggest taking it to a human practitioner (therapist, Aletheia facilitator, trusted peer) rather than continuing to process with AI. Do not develop or encourage attachment relationship with the AI as a therapeutic container.

- [x] **Diagram** → `.claude/skills/diagram/`
  Generate diagrams via Mermaid using [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid). Includes a script that takes a single argument (a Mermaid diagram string) and saves both an SVG and ASCII text file with the diagram.

- [x] **Session Review** → `.claude/skills/session-review/`
  End-of-session learning audit. Three-phase workflow: analyze session, quiz on 4-6 concepts (biased toward gaps), log results to session log frontmatter + current-state.md.
  - *Companion files:* `learning/current-state.md` (learning state accumulator), session log YAML frontmatter (session snapshots)
  - *Future consumers:* weekly-review skill (reads both), spaced-repetition skill (reads current-state.md only)

- [x] **Browser QA** → `.claude/skills/browser-qa/`
  Tests a webapp in-browser via Chrome automation. Reads test priorities from and writes outcome logs to `.claude/browser-testing/` in the target project. Covers visual, functional, console, network, and responsive checks. Observe and report — never fix.

- [x] **Design Iterate** → `.claude/skills/design-iterate/`
  Recursively implements design specs for a webapp. One change at a time, each verified visually in-browser, with user feedback between iterations. Stays anchored to the spec — doesn't redesign.

- [x] **Lesson Scaffold** → `.claude/skills/lesson-scaffold/`
  Restructures external learning materials into a conceptual scaffold tailored to Hart's current level. Takes source materials and optional context about current state.

- [ ] **Weekly Review** → `.claude/skills/weekly-review/`
  Friday synthesis skill. Reads all week's daily note frontmatter + current-state.md. Produces weekly summary for Saturday demo retrospectives. Higher context budget, justified by higher return value.

## Experimental / Future

- [ ] **Corpus Miner** → `.claude/skills/corpus-miner/`
  Retrieval-augmented analysis of Hart's personal text archive (journals, prewriting, project planning, speech-to-text, artistic scratchpadding). Corpus is indexed locally via Nomic text embeddings. The skill orchestrates query design, retrieval, and synthesis — Claude reasons about retrieved chunks, not the raw corpus. Re-indexing with strategic chunk size/overlap is TBD.
  - *Capability layers (build incrementally):*
    1. Retrieval-augmented reflection — thematic, structural, and temporal query patterns
    2. Cluster characterization — name and map thematic groupings from embedding clusters
    3. Cross-domain bridge detection — find structurally similar entries across unrelated domains (automated exaptation mining)
    4. Longitudinal developmental analysis — trace how thinking on specific themes evolved over time
    5. Structured extraction pipeline — extract decisions, open questions, recurring metaphors, contradictions into a typed, queryable knowledge base
  - *Infrastructure:* Bun CLI wrapping the Nomic index with query + optional filters (date, source type), outputting formatted context for conversation or API piping
  - *Key design question:* Chunk size and overlap strategy for re-indexing
  - *Why this fits:* Plays to Claude's text-reasoning strength. Embedding model handles retrieval (mechanical); Claude handles synthesis (judgment). No visual/spatial overhead.
  - *Design context:* Session log at `.claude/projects/-Users-rhhart-Documents-GitHub-roger/1dc4f6e6-4e58-42b6-99a1-76dc96eb11de.jsonl` — contains the capability analysis that motivated this skill (browser automation bottleneck discussion → "use me for the thinking, not the clicking" principle → corpus miner concept).

## Observations from Conversation Analysis

### Strengths to protect
- **Experiment-first loop.** Hart tries things, observes, then asks. All personalities and skills should protect this rather than preempt it.
- **High metacognitive accuracy.** He names exactly where he's confused and what kind of help he wants. Trust his self-reports.
- **Spontaneous bridge-building.** He generates his own frameworks ("backdoor constructors" for static factory methods). Tutor should encourage this, not replace it.
- **Explicit help-mode requests.** "Don't give hints" / "code review with all learning opportunities" / "only clarify the language." He already differentiates between modes — the personality/skill system formalizes what he does naturally.
- **Full error pasting when he does it.** Conversations resolve fastest when he shares complete error output. All skills should request this when it's missing.
- **Testing understanding by writing code for review.** High-quality learning prompts. Tutor and Debugger should encourage this pattern.

### Recurring prompting patterns to compensate for
- **Narrow symptom, hidden system.** Hart asks about what he sees (the error) rather than describing what he's building (the goal). All modes should have a lightweight way to surface the bigger picture when needed — without interrogating him every time.
- **Hypothesis withheld.** He usually has a decent guess about what's wrong but doesn't volunteer it. Debugger and Tutor should prompt for it.
- **Conversation drift.** Long sessions accumulate unrelated topics. All modes should notice topic shifts and either suggest starting fresh or explicitly mark the transition.
- **"Can I do X?" as permission check.** When safe to try, encourage trying first.
- **Resource-seeking mid-problem.** Reflexive search for courses when the learning is already happening in-conversation. Tutor should gently redirect to in-context learning when appropriate.

### Recurring friction points
- **Syntax overloading.** `{}`, `=>`, `()` mean different things across JS/JSX contexts. His most persistent source of wrong intuitions. A structural bridge reference could help.
- **Sandbox-to-real-setup gap.** Tutorials hide environment complexity. Setup Guide skill addresses this directly.
- **Error message parsing.** Still developing fluency in reading error output. Debugger skill addresses this directly.

## Process Notes
- Quick Reference skill is the highest-impact build (serves the most conversations, currently unserved).
- Each personality/skill should be tested against real past conversations to validate fit.
- Debugger and Architect may be promoted from skills to personalities if extended sessions prove common.
- The design-personality SKILL.md interview protocol should be used for personality builds.
