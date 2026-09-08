---
type: topic
status: active
updated: 2026-09-08
---

# Tasks

Open questions about the `ops-*` format.
Done → a note in [CHANGELOG.md](../CHANGELOG.md) and removal from this list.

## Propagation to operational repositories

- [ ] Upgrade the existing operational repositories to 0.9.0: replace `AGENTS.md` with the English copy, add `lang:` to their `README.md`, and re-break their prose by sentence (the 0.8.0 step) as a separate content-neutral commit.
- [ ] Decide how future versions reach operational repositories.
  Working assumption: each repository keeps its own copy of `AGENTS.md` and records the upgrade locally — no submodules, no remote dependency at run time; an agent does the upgrade on request.
- [ ] Decide whether a repository may pin an older `format_version` indefinitely, and how a copy that drifted from the canonical file is detected (verbatim comparison is the intended check).

## De-versioning operational repositories

- [ ] Remove semantic versions from operational repositories now that versions belong to the format; dates (with times or other identifiers where needed) should suffice for operational changes.
- [ ] Settle the target shape of `CHANGELOG.md` headings in operational repositories, the meaning of `[Unreleased]` there, how several changes from one day are recorded, and whether Git tags are used at all.
- [ ] Prepare the migration of existing histories so that format versions stay distinguishable from project-specific changes and imports.

## Health check ("lint")

- [ ] Design a recurring consistency check covering: dead and disallowed links (directories, non-existent files); empty Markdown files created by Obsidian by accident; frontmatter validity, ISO dates and vocabulary values; `format_version` present in the header of `AGENTS.md` and the field table intact (the failure mode an editor formatter caused once); divergence between `sources/` and the synthesis in `topics/`; stale or contradictory canonical claims.
- [ ] Split the check into a deterministic script and a periodic agent review that needs interpretation; decide where the script lives and how it runs.
- [ ] Decide which findings block a commit and which only produce a report.

## Confidentiality classification

- [ ] Decide whether an intermediate level is needed between "the whole repository is private" and "this content is never written down".
  The former `privacy` field (`public`/`internal`/`confidential`/`restricted`) was removed in 0.7.0 for lack of a non-arbitrary methodology.
- [ ] If classification returns, settle its granularity: file, directory/channel, or a single field or fragment containing sensitive data.
- [ ] Decide whether the level follows from content (e.g. a third party's contact details), origin (`gmail` vs `web`) or the intended way of sharing.

## Local tool configuration

- [ ] Decide whether `.obsidian/` and `.claude/` stay entirely local, or whether a safe, portable subset of shared settings is worth versioning (`strictLineBreaks`, link format, attachment folder).
- [ ] If a subset is to be shared, choose explicit files outside the ignored directories or precise exceptions in `.gitignore`.
- [ ] Adopt criteria for admitting configuration into the repository: no secrets, no local paths, no personal preferences.
- [ ] Decide whether the format should ship editor configuration that enforces the line-break convention (`.editorconfig`, Prettier `proseWrap: "preserve"`, markdownlint without `MD013`).
- [ ] Decide whether the format should ship a `.gitattributes` with `* text=auto eol=lf`: on Windows with `core.autocrlf=true` every commit prints "LF will be replaced by CRLF" warnings and touched files show up as end-of-line-only changes.

## This repository

- [ ] Decide whether the format needs a short synthetic example repository (`examples/`) or whether the README's adoption guide is enough.
