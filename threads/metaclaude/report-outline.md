---
session: (no matching session found)
stamped: 2026-03-12T18:57:47.091Z
---
# Blog Post: MetaClaude Experiment Report

## Context

Week 6 Friday deliverable for Fractal bootcamp. Assignment: technical
blog post about something built/fine-tuned this week, including eval
results. Audience: non-technical. Tone: honest, playful, dispatches
from the frontier. Hart will write the post by hand; this session
produces the outline, resource gathering, and visual assets.

The project: a metacognitive agent that observes Claude Code sessions
and injects context to improve session quality. Result: injections
were neutral-to-disruptive across all configurations tested. The
feature would be a costly non-improvement.

---

## Article Outline

### Title (working)
Something in the backseat-driver territory. Hart to finalize.

### Hero Image
Conceptual. Backseat driver / comic-book style. Produce after writing.

### Part 1: The Idea
- What if your AI coding assistant had a second AI watching over its
  shoulder, holding the bigger picture?
- Layperson framing: like having a mentor in the room who can see when
  you're going down a rabbit hole — except the mentor is also an AI.
- What I actually built: a small local model that watches my Claude
  sessions, decides when to speak up, and injects brief context notes.
- Simple architecture diagram (layperson version of PRD diagram):
  Builder Claude ← injection hook ← Observer Agent ← [memory/context]

### Part 2: How I Tested It
- Three modes of observation: no memory lookup, simple similarity
  search, two-pass "think then search" — translating none/fast/deep
  into accessible terms
- Two models: small (2GB) and medium (4GB), both running on my laptop
- 40 real conversation snapshots scored blind by a frontier AI judge
- Brief mention of the scoring rubric in plain terms: "Was this
  helpful? Should it have stayed quiet? How good is its running
  summary?"

### Part 3: What Happened (the data)
- **Main graphic**: Qualitative scores visualization
  - Grouped bar chart: 3 groups (no retrieval / simple / deep)
  - Within each group: bars for each model
  - Score dimension shown: start with Helpfulness vs. Silence
    Appropriateness (the key contrast)
  - Additional dimensions available via horizontal scroller or
    expandable accordion
- **Key finding in plain language**: Both models were excellent at
  knowing when to shut up (4.5/5). Both were mediocre at saying
  anything useful (2.5/5). Adding memory/context made them talk MORE
  but not BETTER — the extra information lowered their threshold for
  speaking without improving what they said.
- The models were equivalently capable. The architecture was the
  problem, not the model choice.

### Part 4: Why It Didn't Work
- The irony: "I lost perspective building a tool to hold perspective."
- Bitter lesson angle: I over-engineered structure and gave the
  metacognition job to models too small for it. I sidechained
  high-level reasoning to models that can't do high-level reasoning.
- The Notepad discovery: when Claude itself is given exploratory
  framing and broader context, it already does metacognitive work well.
  The problem might dissolve with the right prompt to the right model.
- I adapted the project to the local-models assignment when the
  project needed a capable reasoning model. The local constraint was
  the wrong constraint.

### Epilogue: What Might Actually Work
- Give the metacognition job to a model that can actually do it (Opus)
- Give it history, goals, principles, telos — not just transcript
  snippets
- The Notepad pattern as evidence: Claude with exploratory directives
  and broad tools gets out of task-oriented tunnel vision
- The real architecture: not a sidecar observer, but a higher-altitude
  instance with richer context
- Open questions / future directions

---

## Visual Assets Plan

All visuals produced AFTER writing is drafted.

### 1. Architecture Diagram (simple)
- Mermaid → SVG via /diagram skill
- Layperson version: three boxes (You ↔ Builder Claude ← Observer),
  arrows showing information flow
- Label what each piece does in plain English

### 2. Results Graphic (main data viz)
- Grouped bar chart
- Data source: qualitative scores from experiment log
  ```
  Condition   Relevance  Helpful  SilCheck  SilApprop  Accum
  ml_none       3.54      2.62     3.15      4.57      3.47
  ml_fast       3.16      2.52     3.16      4.65      3.07
  ml_deep       3.20      2.50     2.85      4.40      3.26
  sl_none       3.47      2.59     3.00      4.55      3.21
  sl_fast       3.25      2.47     3.05      4.90      3.15
  sl_deep       3.14      2.55     3.18      4.56      3.20
  ```
- Primary view: Helpfulness + Silence Appropriateness (the contrast
  that tells the story)
- Additional views (scroller/accordion): Relevance, Silence Check,
  Accumulator Quality
- Tool: likely a bun script generating SVG, or hand-built in a
  charting library. Decide after writing.

### 3. Hero Image
- Conceptual, comic-book style
- Backseat driver concept or simplified architecture as visual metaphor
- Produce last. May use an image generation tool or hand-sketch.

---

## Session Workflow

1. **Outline review** ← we are here
2. **Resource gathering**: pull exact quotes/numbers from experiment
   log and PRD that Hart will reference while writing
3. **Data extraction**: prepare the scoring data in a clean,
   copy-pasteable format for chart generation
4. **Hart writes the draft** (by hand, outside this session or within)
5. **Visual production**: architecture diagram, results chart, hero
   image — after draft exists
6. **Review pass**: check against assignment requirements (non-technical
   audience, eval results shown, honest tone)

---

## Assignment Checklist

- [ ] Non-technical audience — accessible language throughout
- [ ] Honest/playful tone — "dispatch from the frontier"
- [ ] Content: what I built, what I used it for, performance results
- [ ] Eval results with numbers and comparisons shown
- [ ] What surprised me
- [ ] Interactive element (stretch): horizontal scroller for
      additional score dimensions
