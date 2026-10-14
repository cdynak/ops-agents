#!/usr/bin/env python3
"""Deterministic health check for ops-* repositories (stdlib only).

Usage: python scripts/health-check.py [repo_root]

Checks (see "Verification before finishing" in AGENTS.md):
  1. relative Markdown links lead to existing files, never to directories;
  2. no empty .md files;
  3. content files (under topics/ and sources/, except README.md) have
     frontmatter with type/status from the AGENTS.md vocabularies and
     `updated` as an ISO YYYY-MM-DD date;
  4. AGENTS.md carries format_version in its frontmatter header.

Exits 1 if any blocking issue is found, otherwise 0.
"""
import datetime
import os
import re
import sys
from urllib.parse import unquote

TYPES = {"topic", "source-web", "source-thread", "source-document", "person", "decision"}
STATUSES = {"active", "draft", "closed", "archived"}
SKIP_DIRS = {".git", "tmp", ".obsidian", ".claude", "node_modules"}
CONTENT_DIRS = ("topics", "sources")

LINK_RE = re.compile(r"!?\[(?:[^\]\\]|\\.)*\]\(\s*<?([^)\s>]+)>?(?:\s+\"[^\"]*\")?\s*\)")
FENCE_RE = re.compile(r"^\s*(```|~~~)")
INLINE_CODE_RE = re.compile(r"(`+)(.+?)\1")
SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+$")


def md_files(root):
    out = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for f in sorted(filenames):
            if f.lower().endswith(".md"):
                out.append(os.path.join(dirpath, f))
    return out


def parse_frontmatter(text):
    """Return dict of top-level scalar keys, or None if no frontmatter."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None
    fm = {}
    for line in lines[1:]:
        if line.strip() == "---":
            return fm
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*?)\s*$", line)
        if m:
            fm[m.group(1)] = m.group(2).strip("'\"")
    return None  # unterminated


def strip_code(text):
    """Blank out fenced blocks and inline code so their links are ignored."""
    out, in_fence = [], False
    for line in text.splitlines():
        if FENCE_RE.match(line):
            in_fence = not in_fence
            out.append("")
            continue
        out.append("" if in_fence else INLINE_CODE_RE.sub("", line))
    return out


def check_links(root, path, text, errors):
    base = os.path.dirname(path)
    for lineno, line in enumerate(strip_code(text), 1):
        for m in LINK_RE.finditer(line):
            target = m.group(1)
            if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", target) or target.startswith("#") or target.startswith("//"):
                continue
            target = unquote(target.split("#", 1)[0].split("?", 1)[0])
            if not target:
                continue
            resolved = os.path.normpath(os.path.join(root if target.startswith("/") else base, target.lstrip("/")))
            rel = os.path.relpath(path, root)
            if target.endswith("/") or os.path.isdir(resolved):
                errors.append(f"{rel}:{lineno}: link to a directory: {m.group(1)}")
            elif not os.path.isfile(resolved):
                errors.append(f"{rel}:{lineno}: link to a non-existent file: {m.group(1)}")


def check_frontmatter(rel, text, errors):
    fm = parse_frontmatter(text)
    if fm is None:
        errors.append(f"{rel}: missing or unterminated frontmatter")
        return
    t, s, u = fm.get("type"), fm.get("status"), fm.get("updated")
    if t not in TYPES:
        errors.append(f"{rel}: type {t!r} not in {sorted(TYPES)}")
    if s not in STATUSES:
        errors.append(f"{rel}: status {s!r} not in {sorted(STATUSES)}")
    ok = False
    if u and re.fullmatch(r"\d{4}-\d{2}-\d{2}", u):
        try:
            datetime.date.fromisoformat(u)
            ok = True
        except ValueError:
            pass
    if not ok:
        errors.append(f"{rel}: updated {u!r} is not an ISO YYYY-MM-DD date")


def is_content_file(rel):
    parts = rel.split(os.sep)
    return parts[0] in CONTENT_DIRS and parts[-1] != "README.md"


def main(argv):
    root = os.path.abspath(argv[1] if len(argv) > 1 else ".")
    if not os.path.isdir(root):
        print(f"error: {root} is not a directory")
        return 2
    errors = []
    for path in md_files(root):
        rel = os.path.relpath(path, root)
        with open(path, encoding="utf-8", errors="replace") as fh:
            text = fh.read()
        if not text.strip():
            errors.append(f"{rel}: empty Markdown file")
            continue
        check_links(root, path, text, errors)
        if is_content_file(rel):
            check_frontmatter(rel, text, errors)

    agents = os.path.join(root, "AGENTS.md")
    if not os.path.isfile(agents):
        errors.append("AGENTS.md: missing")
    else:
        with open(agents, encoding="utf-8", errors="replace") as fh:
            fm = parse_frontmatter(fh.read())
        v = (fm or {}).get("format_version")
        if not v:
            errors.append("AGENTS.md: format_version missing from the frontmatter header")
        elif not SEMVER_RE.match(v):
            errors.append(f"AGENTS.md: format_version {v!r} is not semver X.Y.Z")

    for e in errors:
        print(f"BLOCKING {e}")
    print(f"health-check: {len(errors)} blocking issue(s)" if errors else "health-check: OK")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
