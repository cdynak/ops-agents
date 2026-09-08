---
lang: en
---

# ops-agents

The canonical home of the `ops-*` format: a way of running an **operational repository** — a Markdown knowledge base for a project whose main asset is agreed facts, correspondence and the history of decisions rather than code — so that it works equally well in Obsidian, on GitHub and with AI agents.

The whole format is one file: [AGENTS.md](AGENTS.md).
Every `ops-*` repository keeps an unchanged copy of it; this repository is where that file is developed, versioned and explained.

## What is here

- [AGENTS.md](AGENTS.md) — the format itself, with `format_version` in its header; the only file that gets copied into operational repositories
- [CHANGELOG.md](CHANGELOG.md) — the history of the format, version by version, with migration steps
- [topics/tasks.md](topics/tasks.md) — backlog of open questions about the format
- `CLAUDE.md`, `.gitignore` — the same shim and ignore list an operational repository uses
- `LICENSE` — MIT

This repository is itself kept according to the format it describes (relative links, one sentence per line, Keep a Changelog, human-approved commits), but it is not an operational repository: it has no `sources/`, and its `topics/` holds only the backlog.

## Adopting the format

To start a new operational repository `ops-<project>`:

1. Copy `AGENTS.md`, `CLAUDE.md` and `.gitignore` from here, unchanged.
2. Write a `README.md` with a `lang:` frontmatter declaring the project's primary language, a description of the project and its own rules.
3. Create `CHANGELOG.md` with an `[Unreleased]` section and note which `format_version` you started from.
4. Add `sources/<channel>/` and `topics/` files only as material arrives — never in advance.

To upgrade an existing repository: replace `AGENTS.md` with the current copy, follow the migration steps listed under each version in the changelog since the version you are on, and record the upgrade in your `CHANGELOG.md`.
Both are tasks an AI agent can do on request.

## Rules of this repository

- **Public on purpose.** The format is meant to be shared, so — unlike operational repositories, which are private by default — this one is public.
- **Nothing operational ever lands here.** No content, quotes, examples or "anonymised" fragments from any operational repository; examples in this repository are synthetic.
- **English only.** The format is maintained in English, like the ecosystem it belongs to (agents.md, Keep a Changelog, the tools); operational repositories keep the English `AGENTS.md` and declare their own project language in `README.md`.
- **Versions belong to the format.** Semantic versioning applies to `AGENTS.md`, not to any single operational repository.

## Origin

The format grew out of the operational repository of the [space.wroclaw.pl](https://space.wroclaw.pl) initiative (Wrocław 2027 as a Year of Space Travel), where it went through versions 0.1.0–0.8.0 in Polish before being extracted here.
It synthesises four independently generated repository proposals (ChatGPT, Claude, Gemini, Perplexity) and Andrej Karpathy's "LLM Wiki" pattern.

## Status

`format_version 0.9.0` — the first English edition, adding the project-language declaration.
Open questions: [topics/tasks.md](topics/tasks.md).
