#!/usr/bin/env node
/**
 * Deterministic health check for ops-* repositories (Node.js built-ins only).
 *
 * Usage: node scripts/health-check.mjs [repo_root]
 *
 * Checks (see "Verification before finishing" in AGENTS.md):
 *   1. relative Markdown links lead to existing files, never to directories;
 *   2. no empty .md files;
 *   3. content files (under topics/ and sources/, except README.md) have
 *      frontmatter with type/status from the AGENTS.md vocabularies and
 *      `updated` as an ISO YYYY-MM-DD date;
 *   4. AGENTS.md carries format_version in its frontmatter header.
 *
 * Exits 1 if any blocking issue is found, otherwise 0.
 */
import fs from "node:fs";
import path from "node:path";

const TYPES = new Set(["topic", "source-web", "source-thread", "source-document", "person", "decision"]);
const STATUSES = new Set(["active", "draft", "closed", "archived"]);
const SKIP_DIRS = new Set([".git", "tmp", ".obsidian", ".claude", "node_modules"]);
const CONTENT_DIRS = new Set(["topics", "sources"]);

const LINK_RE = /!?\[(?:[^\]\\]|\\.)*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const FENCE_RE = /^\s*(```|~~~)/;
const INLINE_CODE_RE = /(`+)(.+?)\1/g;
const KEY_RE = /^([A-Za-z_][\p{L}\p{N}_-]*):\s*(.*?)\s*$/u;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const LINE_BREAK_RE = /\r\n|[\n\r\v\f\u001c\u001d\u001e\u0085\u2028\u2029]/g;

function splitLines(text) {
  if (text.length === 0) return [];
  const lines = [];
  let last = 0;
  LINE_BREAK_RE.lastIndex = 0;
  let match;
  while ((match = LINE_BREAK_RE.exec(text))) {
    lines.push(text.slice(last, match.index));
    last = match.index + match[0].length;
  }
  if (last < text.length) lines.push(text.slice(last));
  return lines;
}

function pyRepr(value) {
  if (value === null || value === undefined) return "None";
  const text = String(value);
  const escaped = text
    .replaceAll("\\", "\\\\")
    .replaceAll("\r", "\\r")
    .replaceAll("\n", "\\n")
    .replaceAll("\t", "\\t");
  if (text.includes("'") && !text.includes('"')) return `"${escaped}"`;
  return `'${escaped.replaceAll("'", "\\'")}'`;
}

function pySortedList(values) {
  return `[${[...values].sort().map((item) => pyRepr(item)).join(", ")}]`;
}

function stripQuotes(value) {
  let start = 0;
  let end = value.length;
  while (start < end && (value[start] === "'" || value[start] === '"')) start += 1;
  while (end > start && (value[end - 1] === "'" || value[end - 1] === '"')) end -= 1;
  return value.slice(start, end);
}

function unquote(value) {
  const out = [];
  const bytes = [];
  const flush = () => {
    if (bytes.length === 0) return;
    out.push(Buffer.from(bytes).toString("utf8"));
    bytes.length = 0;
  };
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === "%" && i + 2 < value.length && /^[0-9A-Fa-f]{2}$/.test(value.slice(i + 1, i + 3))) {
      bytes.push(Number.parseInt(value.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      flush();
      out.push(value[i]);
    }
  }
  flush();
  return out.join("");
}

function readText(file) {
  return new TextDecoder("utf-8", { fatal: false }).decode(fs.readFileSync(file));
}

function isDir(file) {
  try {
    return fs.statSync(file).isDirectory();
  } catch {
    return false;
  }
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function mdFiles(root) {
  const out = [];
  const walk = (dir) => {
    let names;
    try {
      names = fs.readdirSync(dir);
    } catch {
      return;
    }
    const dirs = [];
    const files = [];
    for (const name of names) {
      if (isDir(path.join(dir, name))) dirs.push(name);
      else files.push(name);
    }
    dirs.sort();
    files.sort();
    for (const name of files) {
      if (name.toLowerCase().endsWith(".md")) out.push(path.join(dir, name));
    }
    for (const name of dirs) {
      if (SKIP_DIRS.has(name)) continue;
      const full = path.join(dir, name);
      let link = false;
      try {
        link = fs.lstatSync(full).isSymbolicLink();
      } catch {
        link = false;
      }
      if (!link) walk(full);
    }
  };
  walk(root);
  return out;
}

function parseFrontmatter(text) {
  const lines = splitLines(text);
  if (lines.length === 0 || lines[0].trim() !== "---") return null;
  const fm = {};
  for (const line of lines.slice(1)) {
    if (line.trim() === "---") return fm;
    const match = KEY_RE.exec(line);
    if (match) fm[match[1]] = stripQuotes(match[2]);
  }
  return null;
}

function stripCode(text) {
  const out = [];
  let inFence = false;
  for (const line of splitLines(text)) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      out.push("");
      continue;
    }
    out.push(inFence ? "" : line.replace(INLINE_CODE_RE, ""));
  }
  return out;
}

function checkLinks(root, file, text, errors) {
  const base = path.dirname(file);
  const rel = path.relative(root, file);
  stripCode(text).forEach((line, index) => {
    for (const match of line.matchAll(LINK_RE)) {
      const raw = match[1];
      let target = raw;
      if (SCHEME_RE.test(target) || target.startsWith("#") || target.startsWith("//")) continue;
      target = unquote(target.split("#", 2)[0].split("?", 2)[0]);
      if (!target) continue;
      const stripped = target.replace(/^\/+/, "");
      const joined = target.startsWith("/") ? path.join(root, stripped) : path.join(base, stripped);
      const resolved = path.normalize(joined);
      const lineno = index + 1;
      if (target.endsWith("/") || isDir(resolved)) {
        errors.push(`${rel}:${lineno}: link to a directory: ${raw}`);
      } else if (!isFile(resolved)) {
        errors.push(`${rel}:${lineno}: link to a non-existent file: ${raw}`);
      }
    }
  });
}

function isIsoDate(value) {
  if (!ISO_DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function checkFrontmatter(rel, text, errors) {
  const fm = parseFrontmatter(text);
  if (fm === null) {
    errors.push(`${rel}: missing or unterminated frontmatter`);
    return;
  }
  const type = Object.hasOwn(fm, "type") ? fm.type : null;
  const status = Object.hasOwn(fm, "status") ? fm.status : null;
  const updated = Object.hasOwn(fm, "updated") ? fm.updated : null;
  if (!TYPES.has(type)) errors.push(`${rel}: type ${pyRepr(type)} not in ${pySortedList(TYPES)}`);
  if (!STATUSES.has(status)) errors.push(`${rel}: status ${pyRepr(status)} not in ${pySortedList(STATUSES)}`);
  if (!(updated && isIsoDate(updated))) {
    errors.push(`${rel}: updated ${pyRepr(updated)} is not an ISO YYYY-MM-DD date`);
  }
}

function isContentFile(rel) {
  const parts = rel.split(path.sep);
  return CONTENT_DIRS.has(parts[0]) && parts[parts.length - 1] !== "README.md";
}

function main(argv) {
  const root = path.resolve(argv.length > 2 ? argv[2] : ".");
  if (!isDir(root)) {
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
    if (isContentFile(rel)) checkFrontmatter(rel, text, errors);
  }

  const agents = path.join(root, "AGENTS.md");
  if (!isFile(agents)) {
    errors.push("AGENTS.md: missing");
  } else {
    const fm = parseFrontmatter(readText(agents)) || {};
    const version = Object.hasOwn(fm, "format_version") ? fm.format_version : null;
    if (!version) errors.push("AGENTS.md: format_version missing from the frontmatter header");
    else if (!SEMVER_RE.test(version)) errors.push(`AGENTS.md: format_version ${pyRepr(version)} is not semver X.Y.Z`);
  }

  for (const error of errors) console.log(`BLOCKING ${error}`);
  console.log(errors.length ? `health-check: ${errors.length} blocking issue(s)` : "health-check: OK");
  return errors.length ? 1 : 0;
}

process.exit(main(process.argv));
