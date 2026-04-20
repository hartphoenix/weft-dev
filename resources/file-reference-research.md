---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:18:31.654Z
---
# Stable File References: Research Notes

Research on location-agnostic, stable references between files in a
file-based knowledge management system for AI coding agents. No
database, no server — files, git, and shell scripts only.

Context: weft harness. Files live in a directory tree, may be
moved/renamed. References must survive path changes. Consumers: humans
reading markdown + AI agents parsing files with bash/grep/read.

---

## 1. UUID-Based IDs in Frontmatter

**How it works:** Each file gets a unique ID in YAML frontmatter
(e.g., `id: 7f3a2b`). References use the ID. A resolver finds the
file by grepping for the ID across all files.

**Precedents:**
- Obsidian plugins (obsidian-unique-identifiers, note-uid-generator)
  add UUIDs/ULIDs/NanoIDs to frontmatter automatically
- Dendron uses note IDs as stable references — publishing, CLI lookup,
  and backlink resolution all key off the ID, not the path
- Zettelkasten implementations use timestamp-based IDs (YYYYMMDDHHMM)
  as the canonical identifier; some embed the ID in the filename itself

**Evaluation:**
- Setup cost: LOW. Add an `id:` field to frontmatter. Write a one-line
  resolver: `grep -rl "^id: $TARGET_ID" dir/`. For the weft repo
  (105 .md files), this takes ~30ms.
- Maintenance cost: LOW. IDs never change. The only maintenance is
  ensuring new files get an ID (template/hook).
- Human readability: MEDIUM. Humans see `ref: 7f3a2b` — opaque without
  tooling, but a resolver script makes it one step. Can pair with a
  human-readable label: `ref: 7f3a2b (design principles)`.
- Agent parsability: HIGH. `grep -rl` is a primitive the agent already
  has. Resolution is a single tool call.
- Git compatibility: PERFECT. IDs are file content; git tracks them
  normally.
- Failure mode: LOUD. If the target file is deleted, grep returns
  nothing — the reference visibly fails to resolve. If two files
  somehow share an ID, grep returns both — detectable.

**Key insight:** The ID format matters less than the convention. UUID
is overkill for a personal knowledge base; a 6-8 char nanoid or
truncated hash is sufficient and more human-friendly. Zettelkasten
timestamps (YYYYMMDDHHMM) have the nice property of being sortable
and carrying creation-time information.

---

## 2. Symlinks

**How it works:** Create symlinks in the referencing directory pointing
to the canonical file. The reference is the symlink itself.

**Evaluation:**
- Setup cost: LOW. `ln -s target link`.
- Maintenance cost: HIGH. Symlinks break when the target moves. The
  system must detect and repair broken symlinks. This is the exact
  problem we're trying to solve — symlinks just move the breakage from
  the reference to the filesystem.
- Human readability: HIGH on macOS/Linux (ls shows the target). LOW
  on Windows (symlinks are text files containing the path).
- Agent parsability: HIGH. `readlink` resolves them. But the agent
  must also detect broken symlinks, which adds complexity.
- Git compatibility: PROBLEMATIC. Git stores symlinks as text files
  containing the target path. On Windows checkout, they become plain
  text files. Cross-platform repos break. Symlinks pointing outside
  the repo are not portable. Relative symlinks work but are fragile
  when either end moves.
- Failure mode: SILENT-ISH. A broken symlink exists but points
  nowhere. `cat` fails, but `ls` shows it. An agent following a
  symlink to a deleted target gets an error, but the error message
  doesn't tell you where the file went.

**Verdict:** Symlinks solve the wrong problem. They're a pointer that
breaks on the same condition (file moved) that breaks a path
reference. Only useful if you have a convention where one canonical
location never moves and other locations reference it — but then the
canonical path IS the stable reference and you don't need symlinks.

---

## 3. Git-Based References

**How it works:** Reference by git blob hash, or use `git log --follow`
to track a file through renames.

**Evaluation:**
- Setup cost: MEDIUM. Need scripts to resolve blob hashes or trace
  rename history.
- Maintenance cost: LOW for blob hashes (content-derived, never need
  updating). But blob hashes change when content changes — so they
  reference a specific version of a file, not the file itself.
- Human readability: NONE. `ref: a3f2b7c9` is completely opaque.
  Even with tooling, you need `git show` to see what it points to.
- Agent parsability: MEDIUM. `git log --follow` works but is slow on
  large histories. `git show <hash>` works but requires knowing the
  hash. The agent can run these commands but the resolution path is
  multi-step and git-specific.
- Git compatibility: NATIVE (obviously). But references only work
  inside a git repo with history available.
- Failure mode: SILENT. If a file is deleted, the blob still exists
  in git history — the reference resolves to historical content, not
  current state. This is either a feature or a bug depending on intent.

**Key insight:** Git doesn't track renames explicitly. It infers them
heuristically by comparing blob hashes across commits. `git log
--follow` uses this heuristic and works well in practice but is not
guaranteed. More importantly: blob hashes reference content versions,
not living files. This is useful for provenance (which version of a
file was referenced?) but not for navigation (where is this file
now?).

**Partial value:** `git log --follow -- <path>` could be a FALLBACK
resolver when a path reference breaks — "this path doesn't exist
anymore, let me check if git knows where it went." That's a repair
tool, not a reference system.

---

## 4. Tag/Label Systems

**How it works:** Files declare tags in frontmatter
(`tags: [design, principle, core]`). References query by tag
rather than path. A file needing to reference "the design principles
document" queries for `tags: [design, principles]`.

**Evaluation:**
- Setup cost: LOW for tagging. MEDIUM for the query layer (need a
  script that finds files matching tag combinations).
- Maintenance cost: MEDIUM. Tags must be maintained as file purposes
  evolve. Tag vocabularies drift without governance. No enforcement
  that a tag query resolves to exactly one file.
- Human readability: HIGH. `see: #design-principles` reads
  naturally. But the human can't follow it without tooling.
- Agent parsability: HIGH. Grep for frontmatter tags is
  straightforward. But multi-tag queries require parsing YAML, not
  just line-matching.
- Git compatibility: PERFECT. Tags are file content.
- Failure mode: AMBIGUOUS. A tag query might return 0 files (deleted
  or retagged), 1 file (correct), or N files (tag collision). The
  N-file case is the dangerous one — silent ambiguity. Unlike a UUID,
  tags are not guaranteed unique to one file.

**Key insight:** Tags solve a different problem than stable
references. Tags are for FINDING files by topic (set membership).
References need to point to ONE specific file (identity). Tags are
great for discovery ("find me everything about design principles")
but bad for identity ("this specific file, wherever it is now").

**Partial value:** Tags complement a reference system. Use IDs for
identity, tags for discovery. The two serve different query patterns.

---

## 5. Canonical Name Registry

**How it works:** A single file (e.g., `registry.yaml`) maps stable
names to current paths:

```yaml
design-principles: design/design-principles.md
harness-features: design/harness-features.md
current-state: learning/current-state.md
```

References use the stable name. When a file moves, only the registry
needs updating.

**Evaluation:**
- Setup cost: LOW. One file, simple format.
- Maintenance cost: MEDIUM. Every file move requires a registry
  update. This is a single-point-of-update (good) but also a
  single-point-of-failure and a manual step that can be forgotten.
  A git hook could detect renames and prompt for registry updates.
- Human readability: HIGH. `see: design-principles` is clear, and
  the registry is a human-readable lookup table.
- Agent parsability: HIGH. Parse the registry (one file read), then
  resolve the path. Two-step but trivial.
- Git compatibility: PERFECT. The registry is a file.
- Failure mode: LOUD. If the registry entry points to a moved file,
  the path doesn't resolve. If the registry itself is missing, all
  references fail at once (catastrophic but obvious). Merge conflicts
  in the registry are possible if two branches move different files.

**Key insight:** This is the approach closest to how the weft harness
already works — CLAUDE.md contains path mappings (`learning/*` →
specific paths). The question is whether to formalize this into a
dedicated registry or keep it distributed across CLAUDE.md files.

**Risk:** The registry becomes a bottleneck in multi-user/multi-branch
workflows. If two people move different files on different branches,
the registry gets a merge conflict. Solvable with tooling but adds
friction.

---

## 6. Content-Addressable Approaches

**How it works:** Reference files by a hash of their content. Like
git blobs but at the application layer.

**Evaluation:**
- Setup cost: MEDIUM. Need a hashing convention and resolver.
- Maintenance cost: HIGH. The hash changes every time the file
  content changes. You'd need to update all references on every edit,
  or maintain a mapping from stable name to current hash. At that
  point you've just built a registry (approach 5) with extra steps.
- Human readability: NONE. `ref: sha256:a3f2...` is gibberish.
- Agent parsability: MEDIUM. Hash computation and comparison are
  simple, but the "find the file with this hash" step requires
  hashing every file in the tree.
- Git compatibility: REDUNDANT. Git already does this internally.
  Building a parallel content-addressing system on top of git is
  duplicating infrastructure.
- Failure mode: SILENT. If content changes, the hash reference
  silently points to nothing (no file has that hash anymore). If
  you're referencing a specific version, that's correct behavior.
  If you're referencing "this file, wherever it is," it fails.

**Verdict:** Content-addressable references solve the problem of
"did this file change?" — useful for integrity verification and
caching, not for navigation. Git already provides this. Building
a second layer adds cost without benefit for the reference problem.

---

## 7. Obsidian-Style Wikilinks

**How it works:** References use `[[filename]]` without paths.
Resolution searches for a file matching that name anywhere in the
tree.

**Evaluation:**
- Setup cost: VERY LOW. Just use the convention. Resolution is
  `find . -name "filename.md"`.
- Maintenance cost: LOW — unless you have duplicate filenames. Then
  resolution becomes ambiguous and maintenance cost spikes.
- Human readability: HIGHEST. `[[design-principles]]` is immediately
  clear to any human. Works in Obsidian, renders in GitHub markdown
  (as a broken link, but the text is readable).
- Agent parsability: HIGH. File search by name is a primitive the
  agent has. Single tool call.
- Git compatibility: PERFECT. It's just text.
- Failure mode: AMBIGUOUS when duplicate filenames exist. Resolution
  order varies by tool (Obsidian: exact match → normalized match →
  path hint). Without tooling, the reader/agent must search and
  disambiguate. With unique filenames, failure is LOUD (no match =
  file deleted or renamed).

**Key insight:** Wikilinks work extremely well WHEN filenames are
unique across the tree. The weft harness can enforce this — it
controls the file creation conventions. The failure mode (duplicate
names) is preventable by convention rather than requiring
infrastructure.

**Enhancement:** Combine with frontmatter IDs as a fallback. Primary
resolution: search by filename. If ambiguous or not found: fall back
to ID-based grep. This gives you human readability (wikilinks) with
machine robustness (IDs).

---

## Comparative Matrix

| Approach | Setup | Maintenance | Human Read | Agent Parse | Git Compat | Failure Mode |
|---|---|---|---|---|---|---|
| UUID frontmatter | Low | Low | Medium | High | Perfect | Loud |
| Symlinks | Low | HIGH | High/Low* | High | Problematic | Silent-ish |
| Git-based | Medium | Low | None | Medium | Native | Silent |
| Tags | Low-Med | Medium | High | High | Perfect | Ambiguous |
| Name registry | Low | Medium | High | High | Perfect | Loud |
| Content-address | Medium | HIGH | None | Medium | Redundant | Silent |
| Wikilinks | Very Low | Low** | Highest | High | Perfect | Ambiguous** |

*Platform-dependent. **With unique filename convention.

---

## Recommendations

### Top pick: Wikilinks + UUID fallback (hybrid)

Primary reference: `[[design-principles]]` — human-readable, zero
infrastructure, works in Obsidian/editors, agent resolves with one
search.

Fallback identity: each file gets an `id:` in frontmatter. When a
wikilink doesn't resolve (file renamed), the agent can grep for the
ID. The ID also serves as a stable anchor for external references
(scripts, git hooks, session logs).

Why this wins:
- Lowest friction for the common case (humans reading/writing
  references in markdown)
- The failure mode is preventable (enforce unique filenames by
  convention, which the harness controls)
- The fallback catches the edge cases (file renamed, not just moved)
- Both layers are just text — no infrastructure, no scripts required
  for basic operation, scripts only improve resolution speed
- Already compatible with the frontmatter convention in place
  (`session:`, `stamped:` fields)

Implementation cost: Add `id:` to existing frontmatter template. Write
a resolver function (~10 lines of bash) that tries filename search
first, then falls back to ID grep. Add a linting check for duplicate
filenames.

### Runner-up: Canonical name registry

Best when: the file set is stable and well-known (e.g., the ~10 core
harness files that CLAUDE.md, skills, and hooks all need to reference).
The registry is overkill for the long tail of design docs and session
logs, but perfect for the small set of files that everything depends on.

Could coexist with the hybrid approach: registry for core files,
wikilinks for everything else.

### Avoid: Symlinks, pure content-addressing, pure git-based

Symlinks break on the same condition as path references. Content-
addressing duplicates git. Git-based references are opaque to humans
and reference versions, not living files.

### Tags: complementary, not primary

Tags solve discovery, not identity. Use alongside any reference system
for "find me files about X" queries, but don't use them as the
primary reference mechanism.
