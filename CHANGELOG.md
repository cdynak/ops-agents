# Changelog

All notable changes to the `ops-*` format.
Entries follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); version numbers are the `format_version` in the header of [AGENTS.md](AGENTS.md) (semantic versioning; before 1.0.0 a breaking change bumps MINOR).

Each version entry ends with its migration steps — what an existing operational repository has to do to move up from the previous version.
Versions 0.1.0–0.8.0 were developed in Polish inside the first operational repository and are summarised here in English; only changes to the format are listed, not that repository's own content.

## [Unreleased]

### Changed

- Upgrade guidance in `README.md` extended after the first two real migrations: content-neutral commits go into `.git-blame-ignore-revs`, with the one-time `git config` a clone needs; the re-breaking commit stays free of any content change.

### Fixed

- The 0.7.0 → 0.8.0 migration step now names `sources/README.md` and the channel `README.md` files explicitly — they are READMEs, not archives, and were re-broken in practice.

## [0.9.0] - 2026-09-08

First English edition, extracted into this repository as the canonical source of the format.

### Added

- Project-language declaration: every project states its primary language once, in the frontmatter of its `README.md` (`lang: pl`), and that language governs `topics/`, commit messages and the changelog.
  Per-file `lang` is now optional — used only where a file's language differs from the project's.
  Reason: `AGENTS.md` is kept in English in every repository, so the language of a project's own content needs an explicit, machine-readable home.
- A link from `AGENTS.md` to this repository as the canonical source, changelog and backlog of the format.
- MIT licence for the format.

### Changed

- `AGENTS.md` translated into English and declared English-only in operational repositories; copies are meant to be compared verbatim.
  Reason: a single maintained version instead of parallel translations, consistent with the ecosystem the format lives in.
- `lang` removed from the minimum frontmatter of content files (see Added).

Migration 0.8.0 → 0.9.0: replace the Polish `AGENTS.md` with the English copy; add a frontmatter with `lang: <code>` to the project's `README.md`; per-file `lang` may stay or be removed where it equals the project's language.

## [0.8.0] - 2026-09-08

### Added

- Convention "Line breaks — one sentence per line" (semantic line breaks, sembr.org), with guidance for Obsidian (*Strict line breaks*), text editors (no format-on-save for `*.md`) and AI agents.
  Reason: readable diffs and blame when editing prose, and line-by-line comparison of language versions; the immediate trigger was an editor formatter that damaged `AGENTS.md` (frontmatter, field table, checklist).
- A "Tools" subsection collecting all local editor settings in one place.

### Changed

- Editorial simplification: format history and pointers to project README sections removed from `AGENTS.md`; absolute wording softened ("as a rule immutable", "suggested reading order"); "single-person work" generalised to any team and any AI agent; `CLAUDE.md` described neutrally as a shim for tools that do not read `AGENTS.md`.
- The two linking rules "never link to a non-existent file" and "never link into the future" merged into one; the rule "nothing created in advance" kept in one place only.
- The "Migrations" section reduced to the step from the latest version; older steps moved next to their version entries in the changelog.

Migration 0.7.0 → 0.8.0: enable *Strict line breaks* in Obsidian and disable format-on-save for `*.md` in editors; re-break `README.md`, `AGENTS.md`, `CHANGELOG.md`, `topics/` files, `sources/README.md` and every channel `README.md` by sentence as a separate, content-neutral commit (its changelog line goes into the next commit; its hash into `.git-blame-ignore-revs`); do not re-break archived files in `sources/`.

## [0.7.0] - 2026-07-28

### Removed

- The `privacy` field (`public`/`internal`/`confidential`/`restricted`) from the minimum frontmatter.
  Reason: assigning a default per channel (e.g. `confidential` for all of `gmail/`) turned out to be arbitrary, with no classification methodology behind it; the question moved to the backlog.

### Added

- Channel conventions for e-mail threads (`sources/gmail/`: thread and message identifiers, chronological layout, attachments listed but not copied) and for binary documents kept outside the repository (`sources/gdrive/`: folder and file URLs, `status: draft` until the file physically exists in the store).

Migration 0.6.0 → 0.7.0: remove the `privacy:` line from the minimum frontmatter and from all existing source and topic files; in each channel `README.md` replace the field's description with a short pointer to the project's open questions; remove `privacy` from the verification checklist.

## [0.6.0] - 2026-07-27

### Removed

- The `templates/` directory.
  Reason: at this scale a separate directory for templates is a redundant layer; the template for a file type lives in the `README.md` of its directory.

Migration 0.5.0 → 0.6.0: delete `templates/`; move the essential content of each `templates/<type>.md` into a "Template for a new file" section of the matching directory `README.md` (e.g. `templates/source-web.md` → `sources/web/README.md`); update the directory tree in `AGENTS.md` and every link to the removed files.

## [0.5.0] - 2026-07-27

### Changed

- `AGENTS.md` reorganised to follow the [agents.md](https://agents.md/) convention: project overview → structure → reading order → writing conventions → hard rules → privacy → verification → commits → versioning.
  The standard prescribes neither section names nor fields; the change is layout and a recognisable flow, not content.
- "Source immutability" merged into "Hard rules"; the after-task list expanded into the "Verification before finishing" checklist (the standard's *testing instructions*).

### Added

- A "Commits" section (the standard's *PR instructions*): one logical change per commit, separate commits for transcription fixes, commit and push only on explicit human instruction.

Migration 0.4.0 → 0.5.0: replace `AGENTS.md` with the current copy — only the internal layout of the file changes, the repository structure does not.

## [0.4.0] - 2026-07-27

### Changed

- `LOG.md` renamed to `CHANGELOG.md` and reformatted after Keep a Changelog: entries grouped by category, newest version first, `[Unreleased]` on top, ISO 8601 dates.
- The history of format changes in `AGENTS.md` reduced to concise migration instructions; the full "what changed and why" lives only in the changelog, so that one change is not described in two places.

Migration 0.3.0 → 0.4.0: rename `LOG.md` to `CHANGELOG.md` (`git mv`, to keep history) and reformat entries after Keep a Changelog: `## [X.Y.Z] - YYYY-MM-DD` headings, Added/Changed/Removed/Fixed categories, `[Unreleased]` on top; update references in `README.md`.

## [0.3.0] - 2026-07-27

### Changed

- `AGENTS.md` made entirely universal — the split into a format part and a project part removed.
  Starting a new `ops-*` repository comes down to copying the file without any edits.
- Everything project-specific (text style, subject-matter constraints, state of the layers) moved to `README.md`.
- Obsidian settings described as recommended local configuration, not a versioned file; `.obsidian/` deliberately stays outside version control.

### Added

- The `url_original` field in the frontmatter table (previously documented only in a channel README).

Migration 0.2.0 → 0.3.0: move everything project-specific (text style, subject-matter constraints, state of the layers) from `AGENTS.md` to `README.md`; not a single sentence about the project may remain in `AGENTS.md`.

## [0.2.0] - 2026-07-27

Simplification after the first real use of a repository in Obsidian.

### Added

- The critical linking rule: no links to non-existent files or to directories; syntax examples in archives wrapped in backticks.
  Reason: Obsidian treats such links as "create a new note" and produced six empty files from accidental clicks.
- The `url_original` field for archived AI conversations — a link to the original on the owner's account, because a public snapshot carries neither attachments nor continuation.
- `tmp/` in `.gitignore` as the place for working material.

### Changed

- `FORMAT.md` merged into `AGENTS.md`, `INDEX.md` merged into `README.md`.
  The separate-index concept dropped — `README.md` is the single entry point, readable on GitHub as well.

### Removed

- `FORMAT.md` and `INDEX.md`; `drafts/` and `sources/inbox/` as premature.

Migration 0.1.0 → 0.2.0: (1) move the content of `FORMAT.md` into `AGENTS.md` and delete `FORMAT.md`; (2) move the repository map from `INDEX.md` into `README.md` and delete `INDEX.md`; (3) delete `drafts/` and `sources/inbox/`, add `tmp/` to `.gitignore`; (4) review all links against the critical rule and delete empty files created by Obsidian by accident.

## [0.1.0] - 2026-07-23

### Added

- First written version of the format: the split into `sources/` (immutable) and `topics/` (synthesis), frontmatter with `fidelity`/`privacy`/`verification`, an append-only log, a versioning mechanism for the format.
  Synthesised from four independently generated structure proposals (ChatGPT, Claude, Gemini, Perplexity) and Andrej Karpathy's "LLM Wiki" pattern.
- Repository skeleton: `README.md`, `AGENTS.md`, `CLAUDE.md`, `INDEX.md`, `FORMAT.md`, `LOG.md`, `.gitignore`, channel READMEs, `templates/source-web.md`.
