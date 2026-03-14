---
session: (no matching session found)
stamped: 2026-02-26T00:20:55.677Z
---
# Platform Layer — Courses, Schools, Cohorts

**Status:** Early design (brainstorm capture, 2026-02-25)
**Extends:** P10 (teacher relationships), coordination layer
**Source:** Conversation with Andrew, 2026-02-25

---

## Framing

Two ways to think about what this becomes:

1. **A social media platform with learners as first-class users.** The
   entities, discovery, and networking serve learners first; teachers,
   courses, and schools are infrastructure that serves them.

2. **A protocol, not a single software instance.** GitHub is the
   substrate. The harness is the client. Courses, schools, and cohorts
   are conventions on top of Git primitives (repos, forks, branches,
   orgs, issues). Anyone can extend the protocol — teachers, students,
   harness designers — without needing permission from a central system.

Both framings are true. Which one leads depends on the question being
asked.

---

## Entities

### Course

A course is a **GitHub repo** owned by a teacher.

**What lives in it (all optional, sky's the limit):**
- Lesson content (markdown, reference code, other reference materials)
- Assignments
- Skill definitions for the domain
- A specialized CLAUDE.md — a teaching personality for this course
- Custom Claude skills
- Install packages
- Cohort membership records (see §Cohort)

A coding bootcamp's monorepo is one example. A writing course with only
markdown lessons and writing prompts is another. The repo is the
container; what goes in it is the teacher's design decision.

**Versioning:** Branches can represent curriculum versions. A teacher
updates the course by committing to a new branch (or to main). Students
pull updates from origin.

### Student enrollment

A student **forks** the course repo. This gives them their own copy of
all course materials. They **watch** the origin repo for updates and
pull from origin when updates arrive.

The enrollment flow — fork, watch, configure harness — is a **Claude
skill** that handles the GitHub operations under the hood. The student
doesn't need to be technical. They don't need to be an engineer. They
just need Claude Code running with the enrollment skill.

Multiple courses = multiple forks. A student taking two courses in the
same school has two repos on their machine. Each fork is independent.

### Teacher

A teacher has a persistent GitHub account and owns one or more course
repos. A teacher may be independent (no school affiliation) or may join
a school org.

The teacher role extends the existing P10 teacher-student relationship
design (see `teacher-relationship.md`). What's new here is that the
teacher now also has a **course** as a structured artifact, not just a
subscription relationship with a student's signal repo.

**Harness designer** — a specialized role in the ecosystem. A harness
designer creates or customizes the teaching personality, skills, and
CLAUDE.md that ship with a course. This could be the teacher themselves,
or someone who specializes in configuring harnesses for non-technical
domains. The harness designer role is how the system extends to domains
where the teacher isn't a programmer.

### School

A school is **optional**. It's an organizational layer above courses.

A teacher can operate independently — no school required. But when
multiple teachers want to coordinate (shared schedule, shared student
body, cross-course discovery), a school provides that structure.

**GitHub mapping:** Likely a GitHub org. Teachers are members. Course
repos may live under the org. But the exact mapping needs research into
how GitHub orgs work (permissions, repo ownership, visibility).

**The DIY university pattern:** A network where teachers self-schedule
courses on a rolling semester calendar, charge what they want (or use
sliding scale), and coordinate loosely with other teachers. Nobody is a
single manager. Teachers take templates from what's worked for others
and evolve them for their domain and teaching style. This is the kind
of flexibility the protocol should support.

### Cohort

A cohort is a **group of students** who share a course experience over
a defined period. Cohorts are flexible — they can take different forms
depending on the course.

**Varieties:**
- **Concurrent cohort:** These 15 people start and end together, follow
  the same schedule, get the same updates. (Example: Hart's singing
  course, which has run five times with different cohorts.)
- **Self-paced / no cohort:** A course that's always available. Students
  fork and go at their own pace. No cohort coordination needed.
- **Per-course vs. multi-course:** A cohort could be scoped to one
  course or span multiple courses in a school. No rigid entity scope
  required.

**Implementation (deferred):** Two candidate approaches, both viable:
1. Cohort members subscribe to a specific **branch** of the course repo.
   Different cohorts = different branches. Allows version-specific
   materials and schedules.
2. Teacher creates a **new repo per cohort** (possibly forked from a
   template repo). Clean separation, simpler mental model.

Nothing in the GitHub ecosystem blocks either approach. Decision deferred
to when cohorts get built.

**Membership tracking:** Could be a JSON or markdown file in the course
repo listing cohort members. Could be a roster in a school database.
Form factor deferred.

---

## Data flow — what replaces grading

**Grading is a nonentity in this model.** The platform is built in part
to jailbreak society out of that kind of thinking.

What a teacher needs to know about a student:
- Their developmental state (where they are)
- Their blockers and wins
- What changed since the last encounter
- Where they need help

The harness already produces this data. The existing P10 protocol
(progress reviews published as GitHub Issues, teacher comments read back
at `/startwork`) handles the transport. What the platform layer adds is
**course context** — the teacher knows what materials the student has
access to, what assignments exist, and where the student is in the
curriculum.

**Assessment is harness-native.** If the course content can be assessed
by the harness (through the data types it can process), then
before/after state is enough. The harness knows "this was the learning
state before, this is the state after." That's the assessment.

**Higher-touch exchange** happens through other channels, referenced
through GitHub data types. A student might send a link to a video the
teacher reviews. The platform doesn't need to prescribe the data format
for every course — it provides a multimedia-capable reference layer
(links, markdown, structured data) and harnesses on both ends that can
interpret multiple kinds of data.

**Issues and PRs** are available as exchange formats. The specific
mapping (PRs = submissions? Issues = questions?) doesn't need to be
locked down now. Different courses may use them differently. The
protocol provides the primitives; the teacher designs the workflow.

---

## Non-technical students

Claude Code is the interface for all students, including non-technical
ones. But the experience is shaped by the **course personality** — the
specialized CLAUDE.md and skills that ship with the course.

**Text-based courses are the starting constraint.** Writing, coding,
accounting, design — anything where the work product and learning
materials flow naturally through text is the easiest to build for.

**Non-text domains** (singing, filmmaking, roller skating) require
sensory input through tool use. This is a harder problem — how do you
get Claude Code to sit in the sidecar for a learning path that isn't
text-based? Customizing a harness for each course type is a later
challenge to solve. Technology is growing fast enough that this won't
be the limit for long.

**Personality development:** The course personality could be built by:
- The teacher themselves
- A harness designer (specialized role)
- Potentially, an intake-style interview that discovers the student's
  interaction preferences and generates a personalized UI/personality

---

## Discovery and networking (sketch)

Skills that could ship with the platform:
- "Find me projects I might be interested in joining"
- "Find me projects that connect with my learning goals"
- "Find me a teacher for this skill"
- A public forum for posting group project proposals
- A place to post things to celebrate or share

All of these build on the structured learner state the harness already
produces (goals, growth edges, concept scores) as the matching signal.
See `teacher-relationship.md` §Relationship types and discovery for the
four match types.

**Teacher-teacher relationships** are another relationship type not yet
mapped. Teachers coordinating curriculum, sharing teaching strategies,
co-teaching, or mentoring newer teachers.

**Persistent source of truth and messaging platform** needed for
networking. Could be Discord, could be a GitHub-native solution (e.g.,
Discussions on a community repo). Form factor deferred.

---

## Resolved decisions

- **Course = GitHub repo.** Owned by teacher. Contains materials,
  assignments, skills, personality, whatever the teacher designs.
- **Enrollment = fork + watch.** Student forks the course repo, watches
  origin for updates, pulls when updates arrive.
- **Enrollment is a skill.** GitHub operations happen under the hood.
  Non-technical students don't need to understand Git.
- **Multiple courses = multiple forks.** Each course is an independent
  repo on the student's machine.
- **Grading is not an entity.** Developmental state tracking replaces
  grading. Assessment is harness-native (before/after learning state).
- **Text-based courses first.** The starting constraint for course
  types. Non-text domains are a later challenge.
- **Teachers and students can extend the design.** The protocol provides
  primitives; participants design their own workflows on top.
- **School is optional.** Teachers can operate independently.
- **Cohorts are flexible.** No rigid entity scope — concurrent,
  self-paced, per-course, multi-course all valid.

## Open questions

- **GitHub orgs for schools:** How do GitHub org permissions,
  repo ownership, and visibility work? Research needed before designing
  the school entity concretely.
- **Cohort implementation:** Branch-per-cohort vs. repo-per-cohort.
  Deferred.
- **Cohort membership tracking:** JSON file in course repo? Markdown
  roster? School database? Deferred.
- **School database vs. structured files:** Does a school need an actual
  database (Postgres, etc.) or can everything live as structured files
  in a school-level GitHub repo? The zero-infrastructure principle from
  the existing design favors GitHub-native, but a multi-course school
  with many students may outgrow that.
- **Issues and PRs in the course metaphor:** What do they map to?
  Different courses may use them differently. Not locked down.
- **Non-text course harnesses:** How to create sensory input through
  tool use for domains like music, film, physical skills.
- **Harness designer role:** Who builds course personalities for
  non-technical teachers? How is this role formalized? Could be a
  skill in its own right — a course-authoring wizard that helps a
  teacher configure personality, skills, CLAUDE.md, and materials
  structure for their domain.
- **Teacher-teacher relationships:** Not yet mapped. Curriculum
  coordination, teaching strategy exchange, co-teaching, mentoring.
- **Discovery platform:** What's the concrete form of the discovery
  board / public forum? GitHub Discussions? Discord? Web app?
- **Messaging platform for networking:** Discord? Something else?
  Needs to be persistent and accessible to non-technical users.
- **How does a course repo relate to the student's harness repo?** The
  student already has a personal harness (from Maestro install). A
  course fork adds course-specific skills, personality, and materials.
  How do these coexist? Does the course CLAUDE.md extend the personal
  one? Override it? Live alongside it?

---

## Relationship to existing design

This document extends the architecture in `teacher-relationship.md` and
the coordination layer design. The key additions:

| Existing concept | Platform extension |
|------------------|--------------------|
| Teacher-student relationship (P10) | Teacher now has a course as a structured artifact |
| Signal repo (per-user GitHub Issues) | Course repo as a second exchange surface |
| Discovery board (planned) | Now also discovers courses, not just people |
| Coordination layer (team workflow) | School as an organizational layer above teams |
| Harness installation (fork maestro) | Course enrollment as a second fork pattern |
| Learner profile card (planned) | Also serves as enrollment identity |

The platform layer doesn't replace any existing design — it adds a
higher organizational layer (course, school, cohort) on top of the
individual harness and peer-to-peer relationship protocol.
