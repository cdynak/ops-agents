---
format_version: 0.9.0
---

# AGENTS.md — the `ops-*` operational repository format

Instructions for AI agents and people working in an operational repository: a project knowledge base whose main asset is the set of agreed facts as well as the history of their changes and communication, not code.

**This file is entirely universal and portable.**
Every `ops-*` repository keeps its own unchanged copy — no submodules, no remote dependencies.
The canonical source, changelog and backlog of the format live in [cdynak/ops-agents](https://github.com/cdynak/ops-agents).
Everything specific to a given project (description, map, primary language, rules that follow from its subject) lives in that project's [README.md](README.md).

Section layout follows the [agents.md](https://agents.md/) standard.
Conceptual inspiration: Andrej Karpathy's "LLM Wiki" pattern (immutable sources + a growing wiki + an append-only log), simplified and aimed at working in Obsidian, on GitHub and with various AI agents.

## Project overview

An `ops-*` repository has two layers of knowledge:

1. `sources/` — what was actually received or found; answers "what exactly arrived / what exactly did it say?".
2. `topics/` — what follows from it; a living synthesis, updated as sources arrive; answers "what do we know today and what do we do about it?".

The overriding principle: **a source is never silently replaced by a summary**, and **a synthesis is never presented as the original**.

Working material (draft letters, rough notes, helper files) goes, when needed, into `tmp/`, which Git ignores.
When a draft becomes something permanent, it is processed into `topics/`; when it gets sent, its source version goes into `sources/`.

## Repository structure

```text
ops-<project>/
├── README.md            # what the project is, repository map, its primary language and own rules
├── AGENTS.md            # this file: the format (identical in every ops-*)
├── CLAUDE.md            # shim for tools that do not read AGENTS.md; content: @AGENTS.md
├── CHANGELOG.md         # log of changes to the repository (Keep a Changelog)
├── .gitignore
├── topics/              # curated knowledge (facts, people, tasks, decisions, timeline…)
└── sources/             # raw material, one subdirectory per channel (web, gmail, gdrive…)
```

The template for a new file of a given type lives in the `README.md` of the corresponding directory (e.g. `sources/web/README.md`).

## Suggested reading order

1. `README.md` — what the project is, where things are, what its own rules are
2. `topics/facts.md` — canonical facts and the wording in force
3. `topics/tasks.md` — what is to be done now
4. `topics/people.md` — who the person concerned by the task is
5. the relevant file in `sources/` — the full text of the source

## Writing conventions

### Linking — the critical rule

Use plain, relative Markdown links: `[Changelog](CHANGELOG.md)`, `[Format](../../AGENTS.md)`.
They are clickable both in Obsidian and on GitHub.
Wikilinks `[[...]]` are not used — GitHub renders them as raw text.

Rules whose violation breaks the repository in Obsidian (clicking such a link **creates an empty file**, often in the wrong place):

1. **Never link to a file that does not exist** — including a planned one.
   Write it as code in backticks (`topics/facts.md`) and, if it is meant to be created, add an item to `topics/tasks.md`.
2. **Never link to a directory** (`[sources/](sources/)`).
   Link to the `README.md` inside the directory, or write the directory name as code.

This also covers bare links inside archived content: syntax examples in an archive are wrapped in backticks — a purely formatting change that fits within `fidelity: normalized`.

### Line breaks — one sentence per line

Prose is written with semantic line breaks ([sembr.org](https://sembr.org/)): every sentence starts on a new line, paragraphs are separated by a blank line.
Markdown joins such lines into one paragraph, so a reader sees no difference — `git diff` does: a change to one sentence is a change to one line, not to a whole re-wrapped paragraph.
It also helps `git blame`, reviewing an agent's edits and comparing language versions line by line.

- A very long sentence may additionally be broken after a comma, semicolon or dash — always at a logical boundary.
- Text is not wrapped at a fixed column; the editor soft-wraps.
- List items: the first sentence on the marker line, further sentences on following lines indented to the content level.
- Headings, tables, code blocks and frontmatter are left alone: there the line break is syntax.
- Content already archived in `sources/` is not re-broken — that would only be noise in the history; new archives are written in this convention from the start.
- Editing an existing sentence touches only its line; lines whose content does not change are neither re-broken nor joined.

### Language

Each project declares its primary language once, in the frontmatter of its `README.md` (`lang: pl`, `lang: en`, …).
That language governs `topics/`, commit messages, the changelog and everything the project writes itself.
`AGENTS.md` stays in English in every repository — it is the shared format, and its copies are compared verbatim.
A file carries its own `lang` only when its language differs from the project's — typically an archived source.

### File names

ASCII, `kebab-case`, lower case.
Diacritics and other non-ASCII characters stay in titles and content, not in file names.

- dated sources: `YYYY-MM-DD_<domain-or-channel>_<slug>.md`
- everything else: `<slug>.md`

### Frontmatter

The project's `README.md`:

```yaml
---
lang: pl
---
```

Minimum for content files (directory `README.md` files and `CHANGELOG.md` have none):

```yaml
---
type: topic | source-web | source-thread | source-document | person | decision
status: active | draft | closed | archived
updated: YYYY-MM-DD
---
```

Additional fields **only where they actually decide something** (nothing added just in case):

| field | where | purpose |
| --- | --- | --- |
| `lang` | any file | language of this file, only when it differs from the project's primary language |
| `fidelity` | `sources/` | `verbatim` \| `normalized` \| `summary` \| `metadata-only` — how literal the record is |
| `verification` | disputed claims | `verified` \| `partially-verified` \| `unverified` |
| `url`, `retrieved` | `source-web` | where and when it was fetched |
| `url_original` | `source-web` | the original, available only after logging in, when different from `url` |
| `participants` | `source-thread` | who took part |

### Changelog

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/):

- categories **Added / Changed / Deprecated / Removed / Fixed / Security** — only those that actually occurred in a given version;
- version heading `## [X.Y.Z] - YYYY-MM-DD`, numbered after the `format_version` of this file;
- newest version on top, an `## [Unreleased]` section above it;
- entries written for people: what changed and **why**, not a list of commits.

It records both changes to the repository's structure and imports of material into `sources/`.
Events of the project itself (meetings, letters sent, agreements) belong rather in `topics/timeline.md`.

### Tools

Local settings — per vault and per editor, outside version control:

- **Obsidian**, Files and links: Markdown links instead of Wikilinks, relative path, automatic link updates on file rename, attachment folder `tmp` (so that an accidentally pasted binary does not land in the repository).
- **Obsidian**, Editor: *Strict line breaks* enabled (`"strictLineBreaks": true` in `.obsidian/app.json`) — without it every sentence renders on its own line.
- **Text editors** (VS Code, Cursor and the like): format-on-save disabled for `*.md`.
  Markdown formatters wrap paragraphs at a fixed column, turn YAML frontmatter into a heading, truncate table cells containing `\|` and turn indented list continuations into code blocks.
  If a formatter has to stay, make it preserve line breaks (Prettier: `proseWrap: "preserve"`; markdownlint: rule `MD013` disabled).

## Hard rules

- Never send messages on your own: the agent prepares the text, only a human sends it.
- `sources/` is append-only: the meaning of a recorded statement is never changed.
  Allowed are typo fixes in transcriptions, explicit redactions and anonymisation, and purely formatting changes (backticks around bare links).
  When a web page changes substantially — a new file with a new `retrieved` date, not an overwrite of the old one.
- Facts and disputed wording only as in `topics/facts.md`; when a new source contradicts it — ask, do not choose on your own.
- Directories and files are created only when needed; an empty directory "for later" is not order, it is a dead link.

## Privacy and sensitive data

- The repository is private by default (not public).
- No passwords, tokens or API keys.

## Verification before finishing

After every task, before handing over for a commit, check:

- [ ] relative links: all new and changed ones lead to existing files, none to a directory;
- [ ] no empty `.md` files (artefacts of accidental clicks in Obsidian);
- [ ] content files have frontmatter, and `type`/`status`/`fidelity`/`verification` come from the vocabularies above;
- [ ] ISO dates (`YYYY-MM-DD`), `updated` bumped wherever content changed;
- [ ] new and changed paragraphs broken by sentence;
- [ ] an entry in [CHANGELOG.md](CHANGELOG.md) in the right category;
- [ ] the map in [README.md](README.md) updated if a significant file was added;
- [ ] where they exist: the task ticked off in `topics/tasks.md`, the event added to `topics/timeline.md`, non-obvious decisions to `topics/decisions.md`.

## Commits

- The message says **what and why**, consistent with the `CHANGELOG.md` entry, in the project's language.
- One logical change per commit; transcription fixes in `sources/` always separately, describing the correction.
- Do not commit `tmp/`, local editor state or binary files.
- A human approves: the agent does not commit or push without an explicit instruction.

## Format versioning

The header of this file carries `format_version` (semver):

- **PATCH** — wording clarified, no structural change;
- **MINOR** — a new field, directory or convention; before 1.0.0 also a change that requires migration;
- **MAJOR** — a change that requires manual migration of existing files.

Upgrading a project to a newer version: replace `AGENTS.md` with the current copy, carry out the migration steps (below for the latest change; older ones next to each version's entry in the format's changelog) and describe the upgrade in the project's `CHANGELOG.md`.
This is a task well suited to an agent.

### Migrations

**0.8.0 → 0.9.0.** Replace the Polish `AGENTS.md` with this English canonical copy — it stays in English in every repository from now on.
Add a frontmatter with `lang: <code>` to the project's `README.md`.
Per-file `lang` may be left in place, or removed where it equals the project's language.
