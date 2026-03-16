# Prior Art: Memory Routing, Cross-References, and Single Source of Truth

**Research date:** 2026-03-15
**Context:** Design research for weft harness memory/project management.
Three problems investigated; each section covers systems studied,
patterns found, confidence assessment, and adaptation sketch.

---

## Problem 1: Routing new information that should create a new project/thread

The core question: when incoming information doesn't match existing
categories, how does the system distinguish "file this in misc" from
"this is the seed of a new category"?

### Systems studied

**Zettelkasten (Luhmann's method, digital adaptations)**
Uses "buffer notes" — temporary collection points for information that
hasn't found its structural home yet. No pre-established categories;
tags rather than folders. New threads emerge when a buffer note
accumulates enough linked material to warrant its own sequence
(Folgezettel). The signal for "new category" is density of connection,
not a classification rule.

*Confidence:* High. This is the most battle-tested personal knowledge
system (Luhmann used it for 30+ years, produced 70+ books). Digital
adaptations in Obsidian/Zettlr preserve the pattern. The weakness is
that it requires the human to notice when a buffer note has become
something — there's no automated detection.

**PARA method (Tiago Forte)**
Four buckets: Projects (active, with deadlines), Areas (ongoing
responsibilities), Resources (topics of interest), Archives (inactive).
Incoming information gets sorted into one of these. The method's answer
to "none of the above" is: it must be one of these four, because the
four categories are exhaustive by definition.

*Confidence:* Medium for the taxonomy, low for the routing problem.
PARA explicitly dodges the new-project-detection question. It assumes
the human already knows what their projects are. The gap shows up
precisely where weft needs a solution: when work generates a new thread
that the human hasn't named yet. PARA's implicit answer is "the human
notices and creates the project" — which is exactly the failure mode
we're designing against.

**Digital gardens (Appleton's seedling/budding/evergreen model)**
Three growth stages for content: seedlings (rough), budding (cleaned
up), evergreen (relatively complete). The transition between stages is
continuous tending, not discrete reclassification. The "new project
detection" analog is when a seedling grows enough connections to other
notes that it becomes a hub.

*Confidence:* Medium. The growth-stage metaphor is useful for
signaling maturity. But gardens are browsed by humans, not composed
into agent context windows. The pattern of "connections accumulate
until a hub emerges" is real but doesn't automate the detection.

**Claude Code auto memory**
MEMORY.md acts as an index. Claude creates topic files when a topic
accumulates enough observations. The routing decision ("is this a new
topic file or an addition to an existing one?") is made by the LLM at
write time. No formal categorization — Claude decides based on semantic
similarity to existing topic file names and descriptions.

*Confidence:* Medium. This is the system weft already lives inside.
It works for small-to-medium memory stores. The weakness: Claude's
routing decisions are opaque (no explicit threshold or rule), and
the MEMORY.md index can drift from the actual topic files. No
mechanism for detecting when a growing topic file should split, or
when scattered observations across files should coalesce.

**LangChain/LangGraph memory**
JSON documents in hierarchical namespaces. Routing is explicit:
the developer writes the code that decides which namespace gets
which memory. Two write strategies — "hot path" (agent decides
inline) and "background" (async process decides later). The "new
category" question is the developer's problem, not the framework's.

*Confidence:* High for the framework design, not applicable to
routing. LangGraph is infrastructure, not policy. It gives you
namespaces but doesn't tell you when to create one.

**Mem0**
Multi-level memory (user, session, agent). Uses LLM to extract
memorable information from conversations. Custom categories are
supported but the documentation doesn't explain the routing logic —
it's LLM-decided. The "new category" signal appears to be semantic
novelty: if the LLM judges something doesn't fit existing categories,
it can create a new one.

*Confidence:* Low. The documentation is thin on implementation
details. "LLM decides" is the entire routing mechanism, which means
the quality depends entirely on the prompt engineering, which isn't
documented. No published evidence of this working well at scale.

**Letta/MemGPT**
Tiered memory inspired by OS virtual memory: core memory (always in
context), archival memory (searchable, out of context), recall memory
(conversation history). The agent has explicit tools to move information
between tiers: `core_memory_append`, `core_memory_replace`,
`archival_memory_insert`, `archival_memory_search`. Routing is
agent-decided using these tools.

*Confidence:* Medium. The OS metaphor is well-chosen — the tiered
model maps to loading policy (always-on / session-composed /
on-demand), which weft already uses. The weakness for our problem:
MemGPT doesn't handle "new category detection" — it handles "which
tier should this live in." The tiers are fixed; only content moves
between them.

### Pattern synthesis for Problem 1

Every system studied either (a) relies on the human to notice when a
new category should exist, or (b) delegates the decision to an LLM
without explicit criteria. No system has a robust automated mechanism
for detecting "this is the seed of a new thread."

The closest thing to a working pattern is **density-of-connection**
from Zettelkasten: when observations in a buffer/inbox accumulate
enough links to each other and few links to existing threads, they've
formed a cluster that warrants its own thread. This is detectable:

1. Incoming observation doesn't match any existing thread (semantic
   similarity below threshold)
2. It does match other recent unmatched observations (forming a cluster)
3. The cluster reaches a size/density threshold
4. System proposes a new thread with a draft name and the clustered
   observations as seed content
5. Human confirms or rejects

This is essentially **anomaly detection + clustering on the inbox**.
The inbox is the buffer note / staging area. The signal is: multiple
unmatched items that match each other.

**Adaptation for weft (file-based, no database, no server):**

- **Inbox file:** A `memory/inbox.md` or equivalent that collects
  observations not yet routed to a topic file. Session-review and
  auto-memory already write observations — the change is that
  unroutable ones go to inbox rather than being forced into an
  existing topic.
- **Periodic clustering:** A skill or cron job reads the inbox,
  computes pairwise similarity (even just keyword overlap or LLM
  judgment), and proposes thread creation when a cluster forms.
  Could run at session-review time or as a standalone `/triage` skill.
- **Human gate:** Proposed new threads are presented to the user, not
  auto-created. This preserves P7 (human authority).
- **Graceful degradation:** If the inbox grows without clustering,
  it's still useful as a chronological log. No data loss from
  deferred routing.

---

## Problem 2: Location-agnostic cross-references between files

The core question: when file A references file B, and file B moves,
how does the reference survive?

### Systems studied

**Git's content-addressable storage**
Every object identified by SHA-1 hash of its content. References point
to hashes, not paths. Trees map filenames to blob hashes, but the
references between objects are hash-based. Moving a file changes the
tree but not the blob hash — the content is still findable by hash.

*Confidence:* Very high for what it solves. But content-addressable
storage solves identity ("is this the same content?"), not
navigation ("where do I find the thing I linked to?"). For knowledge
management, you still need something that maps a stable identifier
to a current path. Git does this with refs (branches, tags) — named
pointers that update when the underlying hash changes.

**Obsidian wikilinks**
`[[note-name]]` syntax. Links use note titles, not paths. Obsidian
resolves the title to a file at render time. If two files have the
same name, it uses the shortest unambiguous path segment. Renamed files
update all incoming links automatically (within the vault). Backlinks
panel shows all notes linking to the current note.

*Confidence:* High for human-browsed vaults. The title-based linking
means moves within the vault don't break links as long as the title
is preserved. But this depends on Obsidian's runtime resolution —
it's not a file-level property. A plain `grep` can't follow the link
without Obsidian's index.

**Foam (VS Code)**
Same wikilink pattern as Obsidian. Automatic link update on file
rename. Minimum-identifier disambiguation for files with the same name.
Can generate standard markdown link-reference definitions so wikilinks
work in plain markdown renderers (GitHub, static sites).

*Confidence:* High. The generated link-reference definitions are
the interesting pattern — they make wikilinks portable beyond the
tool that created them. But the definitions must be regenerated
when files move.

**Dendron**
Hierarchical note IDs (e.g., `cloud.aws.ec2`). Notes can be renamed
and moved without breaking links because links use the hierarchical
ID, not the filesystem path. Schemas define expected structure. The
hierarchy IS the reference system — `cloud.aws.ec2` resolves to a
specific file regardless of where in the filesystem it lives.

*Confidence:* Medium-high for the ID system. Dendron is no longer
actively maintained (archived 2023), which limits confidence in
long-term viability. But the pattern — stable hierarchical IDs
decoupled from filesystem paths — is sound and doesn't require
Dendron to implement.

**Roam Research (bidirectional links)**
Every block has an auto-generated UID. Links can point to blocks,
not just pages. Bidirectional: linking A to B automatically creates
a backlink from B to A. The UID is stable regardless of where the
block moves.

*Confidence:* High for the UID pattern, cautionary for the overall
system. Roam demonstrated that frictionless linking generates
"a garbage dump full of crufty links" when there's no organizational
discipline. The UID-stability pattern works; the "link everything
and let backlinks organize it" philosophy doesn't scale without
curation.

**Claude Code's `@path` imports**
CLAUDE.md files can reference other files with `@path/to/file`. Paths
are resolved relative to the file containing the import. Recursive
imports up to 5 hops. This is pure path-based referencing — if a file
moves, the import breaks.

*Confidence:* High for simplicity, but this is exactly the fragile
pattern the question is about.

**Git tags / refs as stable identifiers**
Git refs (branches, tags) are named pointers to content hashes. The
content can move (rebase, amend, move files) but the ref still points
to something. Lightweight tags point to a specific commit. This is
a two-layer reference: human-readable name → hash → content.

*Confidence:* Very high for the pattern. Git already manages this in
every repo. The limitation: refs point to commits, not to files
within commits. You can't tag a specific file path and have it survive
a rename without updating the ref.

### Pattern synthesis for Problem 2

Five viable patterns, in order of complexity:

**1. Title-based resolution (Obsidian/Foam pattern)**
Reference files by a stable name, not a path. A resolver maps names to
current paths. If `projects.md` references `arcs.md`, the reference is
"arcs" not `/Users/foo/learning/arcs.md`.

- *Pro:* Simple, human-readable, already how weft writes references
  in prose.
- *Con:* Requires a resolver (tool or convention). Breaks when two
  files share a name. Depends on a unique-name convention.
- *Adaptation:* Enforce unique filenames within the harness scope.
  Document the convention. A simple shell function can resolve
  `weft-resolve arcs` → `/path/to/learning/arcs.md`.

**2. Frontmatter ID (Dendron/Roam pattern)**
Each file gets a stable ID in its YAML frontmatter. References use the
ID, not the path. A resolver maps IDs to current paths.

```yaml
---
id: arcs
---
```

- *Pro:* Survives moves and renames. Machine-readable. Can be a
  slug, UUID, or human-readable string.
- *Con:* Requires a resolver. IDs must be maintained (assigned at
  creation, never changed). Adds a field to every file.
- *Adaptation:* Weft files already have YAML frontmatter (session
  logs, SKILL.md files). Adding an `id` field is low-friction. The
  resolver is a `grep -r "^id: arcs$" learning/` call.

**3. Symlinks**
Filesystem symlinks from a stable location to the current file path.
References always point to the symlink, which can be retargeted.

- *Pro:* Zero tooling — filesystem-native. Works with any tool
  that follows symlinks.
- *Con:* Symlinks are fragile across git operations. Git stores
  symlink targets as file content, so cloning preserves them, but
  relative symlinks break when the repo moves. macOS handles
  symlinks well; some CI environments don't.
- *Adaptation:* Weft already uses symlinks for skills. Could extend
  to a `refs/` directory with symlinks to key files. Relative
  symlinks within the repo would survive cloning.

**4. Tag-based references**
Files declare tags. References specify tags, not paths. A search
resolves tags to files.

- *Pro:* Many-to-many: multiple files can share a tag, and a
  reference to a tag finds all of them.
- *Con:* Non-unique resolution. Requires tag discipline. Slower
  than path lookup (search vs. read).
- *Adaptation:* Useful for cross-cutting concerns ("all files
  about projects") but not for "this specific file." Complementary
  to ID-based references, not a replacement.

**5. Content-hash references (Git pattern)**
Reference a file by its content hash. The hash is a fingerprint that
identifies exactly that version of the content.

- *Pro:* Tamper-evident. Deduplication. Immutable references.
- *Con:* The hash changes every time the content changes, which is
  the opposite of what you want for a reference to a living document.
  Only useful for pinning a specific version, not for "latest state
  of arcs.md."
- *Adaptation:* Not useful for weft's primary problem (references to
  living documents). Could be useful for provenance stamping ("this
  plan was based on arcs.md at hash abc123").

**Recommended approach for weft:**
Combine patterns 1 and 2. Use **human-readable IDs in frontmatter**
as the primary reference mechanism (e.g., `id: arcs`). In prose and
skill instructions, reference by ID name. Provide a **resolution
function** (shell script or skill) that maps ID → current path.
Fall back to title-based resolution (filename without extension) for
files that don't have frontmatter IDs, which covers most cases today.
Symlinks for the specific case of skills (already working).

The resolution function is a one-liner:
```bash
grep -rl "^id: $1$" learning/ .claude/ --include="*.md" | head -1
```

---

## Problem 3: Single source of truth for project/thread state

The core question: when an index, per-thread metadata, and actual file
contents can all describe the same state, how do you prevent drift
without making navigation expensive?

### Systems studied

**Claude Code auto memory**
MEMORY.md is the index; topic files hold detail. Claude reads and
writes both. The index is a markdown list of topic files with one-line
descriptions. The consistency model is: Claude is responsible for
keeping the index in sync when it creates or updates topic files.

*Confidence:* Medium. This works because the agent writes both the
index and the content in the same session. The failure mode:
multi-session drift. If Claude updates a topic file but doesn't
update MEMORY.md (or vice versa), they diverge. There's no validation
step.

**Git as single source of truth**
Git's working tree is derived from the object database. The object
database is the source of truth; the working tree is a view. Refs
(branches, tags) are the navigation layer. They can point to any
commit, but they're explicitly maintained — `git checkout` updates
HEAD, `git tag` creates a tag.

*Confidence:* Very high for the pattern. The key insight: the
source of truth is the content (objects), not the navigation
(refs). Navigation is a thin, maintainable layer that points into
the content. When refs and content disagree, you trust content.

**TIL repositories (jbranchaud/til and similar)**
A README serves as the manually-maintained index. Individual TIL files
are the content. The README lists files by category with links.

*Confidence:* High for the failure mode this demonstrates. The
README and the actual files drift unless the human remembers to
update the README every time they add a TIL. Many TIL repos have
scripts that auto-generate the README from the file listing — which
means the index is derived, not maintained.

*Key insight:* The drift problem disappears when the index is
generated rather than maintained.

**PARA method**
Each category is a folder. The folder listing IS the index — there's
no separate index file. Navigation is the filesystem itself.

*Confidence:* High for the no-separate-index pattern. The weakness
is that folder listings don't carry metadata (descriptions, status,
relationships). You get navigation but no overview without opening
each file.

**LangGraph memory**
Namespaces with keys. The namespace structure IS the organization —
there's no separate index. You navigate by knowing the namespace
hierarchy. Semantic search provides an alternative navigation path
when you don't know the namespace.

*Confidence:* High for the pattern. Namespace-as-organization avoids
the dual-maintenance problem. But namespaces don't self-describe —
you need external documentation to know what `(user_123, "prefs")`
means.

**Zettelkasten**
No master index. Every note links to related notes. Navigation is
through the link graph. "Structure notes" (hub notes that link to a
cluster of related notes) serve as local indexes — they're content,
not metadata.

*Confidence:* High for the philosophy, medium for scalability.
Structure notes are maintained by the human. They're
mini-indexes that can drift from their linked notes. The advantage:
they're content-level, so they participate in the same editing
workflow as everything else (no "index maintenance" as a separate
chore).

### Pattern synthesis for Problem 3

Three strategies, each with different tradeoffs:

**Strategy A: Generated index (derive navigation from content)**
The index is never manually maintained. It's generated from the files
themselves — their frontmatter, their existence, their modification
dates. Navigation is always fresh because it's computed, not stored.

- *Pro:* Zero drift by construction. The truth is in the files;
  the index is a view.
- *Con:* Requires a generation step. The index can't contain
  information that isn't in the files (e.g., hand-written
  descriptions, relationship annotations that live only in the
  index).
- *Weft adaptation:* A `weft-index` script that reads all memory/
  topic files, extracts frontmatter (name, description, type), and
  generates MEMORY.md. Run it as a git hook or session-review step.
  The generated MEMORY.md replaces the hand-maintained one.

**Strategy B: Canonical content + ephemeral navigation (Git model)**
Content files are the source of truth. All metadata lives in the
content files (as frontmatter). Navigation artifacts (indexes, lists,
cross-reference tables) are explicitly marked as derived/ephemeral.
When navigation disagrees with content, content wins.

- *Pro:* Clear authority hierarchy. Works without generation if
  you're willing to accept stale navigation.
- *Con:* The "content wins" rule must be enforced by convention
  (or tooling). If both content and navigation are editable, humans
  will edit whichever is convenient, and the authority hierarchy
  collapses.
- *Weft adaptation:* Put all project metadata in the project file
  itself (frontmatter). MEMORY.md index becomes advisory/ephemeral
  — it helps the agent find files faster but doesn't carry authority.
  When MEMORY.md says "project X is about Y" but the project file
  says otherwise, the project file wins.

**Strategy C: Structure notes as content (Zettelkasten model)**
No separate index layer. Hub notes that describe relationships between
other notes are themselves notes — they're content, not metadata. They
participate in the same editing, review, and linking workflow as
everything else.

- *Pro:* No split between "index" and "content." Everything is
  content, everything is editable, everything gets reviewed.
- *Con:* Navigation is only as good as the structure notes, which
  can go stale. This trades drift-by-construction (Strategy A) for
  drift-by-neglect.
- *Weft adaptation:* MEMORY.md becomes a "structure note" — it's not
  a generated index or metadata, it's a curated note that describes
  the memory landscape. It's maintained alongside other notes, not
  above them. Session-review includes a "does the structure note
  still match reality?" check.

**Recommended approach for weft:**
**Strategy B (canonical content) with Strategy A (generation) as a
validation tool.**

1. All authoritative metadata lives in file frontmatter. Each topic
   file carries its own name, description, type, and relationships.
2. MEMORY.md is generated from frontmatter, not hand-maintained.
   It's a navigation convenience, not a source of truth.
3. A validation script compares the generated index against the
   current MEMORY.md and flags drift. This can run in session-review,
   as a pre-commit hook, or on demand.
4. When Claude writes a new topic file, it writes the frontmatter
   first, then regenerates MEMORY.md. The order matters: content
   first, then navigation.

This eliminates the split-source problem. The index can never
contradict the files because it's derived from them.

---

## Cross-cutting observations

**1. The routing and SSOT problems are connected.** If the index is
generated from content, then routing new information only needs to
decide which content file to write to (or whether to create a new
one). The index updates itself. This collapses two problems into one.

**2. Every system studied either trusts the human or trusts the LLM
for routing.** No system has a rule-based mechanism that works. This
is probably correct — the routing decision is fundamentally semantic
("does this observation belong to the context-engineering thread?"),
and semantic judgments require either a human or a language model.

**3. The buffer/inbox pattern appears in every system that handles
routing well.** Zettelkasten has buffer notes. PARA has the inbox.
Claude Code has the session where observations are made. The pattern:
capture first, route later. This decouples the speed of capture from
the quality of routing.

**4. Bidirectional links are overrated for agent contexts.** Roam
proved that frictionless linking generates noise unless there's
editorial discipline. For an agent context window where every token
has a cost, the opposite of Roam's philosophy is needed: links should
be sparse, intentional, and maintained. Backlinks are useful for
debugging ("what references this file?") but shouldn't drive
navigation.

**5. The weft harness is in a stronger position than most of these
systems** because it has a natural editorial checkpoint: session-review.
Every session ends with a human-gated review step that can validate
routing, update cross-references, and check index consistency. This is
the intervention point for all three problems.

---

## Summary: what to build

| Problem | Pattern | Implementation |
|---------|---------|----------------|
| New thread detection | Buffer/inbox + clustering + human gate | `inbox.md` for unrouted observations; periodic clustering proposes new threads |
| Cross-references | Frontmatter ID + title-based fallback + resolver | `id:` field in frontmatter; `weft-resolve` shell function |
| Single source of truth | Content-canonical + generated index | All metadata in frontmatter; MEMORY.md generated, not maintained |

All three converge on the same architectural move: **make the content
files self-describing (via frontmatter) and derive everything else.**
The index is a view. Cross-references use stable IDs from frontmatter.
Routing checks frontmatter IDs for semantic matching. The frontmatter
is the single source of truth; everything else is computed.
