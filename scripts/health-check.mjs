#!/usr/bin/env node
/**
 * Deterministic health check for ops-* repositories (Node.js built-ins only).
 * Usage: node scripts/health-check.mjs [repo_root]
 * Exits 1 on a blocking issue, 2 if repo_root is not a directory.
 */
import fs from "node:fs";
import path from "node:path";
const TYPES = new Set(["topic", "source-web", "source-thread", "source-document", "person", "decision"]);
const STATUSES = new Set(["active", "draft", "closed", "archived"]);
const SKIP_DIRS = new Set([".git", "tmp", ".obsidian", ".claude", "node_modules"]);
const CONTENT_DIRS = new Set(["topics", "sources"]);
const TYPE_LIST = [...TYPES].sort().join(", ");
const STATUS_LIST = [...STATUSES].sort().join(", ");
const LINK_RE = /!?\[(?:[^\]\\]|\\.)*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const FENCE_RE = /^\s*(```|~~~)/;
const INLINE_CODE_RE = /(`+)(.+?)\1/g;
const KEY_RE = /^([A-Za-z_][\p{L}\p{N}_-]*):\s*(.*?)\s*$/u;
const SEMVER_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const ISO_DATE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const LINE_BREAK = /\r\n|[\n\v\f\r\x1c-\x1e\x85\u2028\u2029]/;
const readText = (file) => new TextDecoder("utf-8", { fatal: false }).decode(fs.readFileSync(file));

function statIs(file, method) {
  try {
    return fs.statSync(file)[method]();
  } catch {
    return false;
  }
}

function mdFiles(root) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    const isMd = (entry) => {
      if (!entry.name.toLowerCase().endsWith(".md")) return false;
      if (entry.isFile()) return true;
      if (!entry.isSymbolicLink()) return false;
      try { return fs.statSync(path.join(dir, entry.name)).isFile(); } catch { return false; }
    };
    const pick = (pred) => entries.filter(pred).map((entry) => entry.name).sort();
    for (const name of pick(isMd)) out.push(path.join(dir, name));
    for (const name of pick((entry) => entry.isDirectory() && !SKIP_DIRS.has(entry.name))) walk(path.join(dir, name));
  };
  walk(root);
  return out;
}

function parseFrontmatter(text) {
  const lines = text.split(LINE_BREAK);
  if (lines[0]?.trim() !== "---") return null;
  const fm = {};
  for (const line of lines.slice(1)) {
    if (line.trim() === "---") return fm;
    const match = KEY_RE.exec(line);
    if (match) fm[match[1]] = match[2].replace(/^['"]+|['"]+$/g, "");
  }
  return null;
}

function visibleLines(text) {
  let inFence = false;
  return text.split(LINE_BREAK).map((line) => {
    if (!FENCE_RE.test(line)) return inFence ? "" : line.replace(INLINE_CODE_RE, "");
    inFence = !inFence;
    return "";
  });
}

function checkLinks(root, file, text, errors) {
  const base = path.dirname(file);
  const rel = path.relative(root, file);
  visibleLines(text).forEach((line, index) => {
    for (const match of line.matchAll(LINK_RE)) {
      const raw = match[1];
      if (SCHEME_RE.test(raw) || raw.startsWith("#") || raw.startsWith("//")) continue;
      const lineno = index + 1;
      let target;
      try { target = decodeURIComponent(raw.split("#")[0].split("?")[0]); }
      catch { errors.push(`${rel}:${lineno}: link with invalid percent-encoding: ${raw}`); continue; }
      if (!target) continue;
      const resolved = path.normalize(path.join(target.startsWith("/") ? root : base, target.replace(/^\/+/, "")));
      const kind = target.endsWith("/") || statIs(resolved, "isDirectory")
        ? "directory"
        : statIs(resolved, "isFile") ? "" : "non-existent file";
      if (kind) errors.push(`${rel}:${lineno}: link to a ${kind}: ${raw}`);
    }
  });
}

function isIsoDate(value) {
  if (!ISO_DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  // Date.UTC maps years 0-99 onto 1900-1999. setUTCFullYear keeps 0050 as year 50.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return year >= 1 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function checkFrontmatter(rel, text, errors) {
  const fm = parseFrontmatter(text);
  if (!fm) {
    errors.push(`${rel}: missing or unterminated frontmatter`);
    return;
  }
  const type = fm.type ?? null;
  const status = fm.status ?? null;
  const updated = fm.updated ?? null;
  if (!TYPES.has(type)) errors.push(`${rel}: type ${type} not in ${TYPE_LIST}`);
  if (!STATUSES.has(status)) errors.push(`${rel}: status ${status} not in ${STATUS_LIST}`);
  if (!updated || !isIsoDate(updated)) errors.push(`${rel}: updated ${updated} is not an ISO YYYY-MM-DD date`);
}

function main(argv) {
  const root = path.resolve(argv[2] ?? ".");
  if (!statIs(root, "isDirectory")) {
    console.log(`error: ${root} is not a directory`);
    return 2;
  }
  const errors = [];
  for (const file of mdFiles(root)) {
    const rel = path.relative(root, file);
    const text = readText(file);
    if (!text.trim()) {
      errors.push(`${rel}: empty Markdown file`);
      continue;
    }
    checkLinks(root, file, text, errors);
    const parts = rel.split(path.sep);
    if (CONTENT_DIRS.has(parts[0]) && parts.at(-1) !== "README.md") checkFrontmatter(rel, text, errors);
  }
  const agents = path.join(root, "AGENTS.md");
  if (!statIs(agents, "isFile")) errors.push("AGENTS.md: missing");
  else {
    const version = parseFrontmatter(readText(agents))?.format_version ?? null;
    if (!version) errors.push("AGENTS.md: format_version missing from the frontmatter header");
    else if (!SEMVER_RE.test(version)) errors.push(`AGENTS.md: format_version ${version} is not semver X.Y.Z`);
  }
  for (const error of errors) console.log(`BLOCKING ${error}`);
  console.log(errors.length ? `health-check: ${errors.length} blocking issue(s)` : "health-check: OK");
  return errors.length ? 1 : 0;
}

process.exit(main(process.argv));
