#!/usr/bin/env node
/**
 * Run scripts/health-check.mjs against fixtures and a few temp-dir cases.
 *
 * Each tests/health-check/fixtures/<case>/expected.txt is the exact stdout
 * followed by a final line that is the exit code (0, 1, or 2).
 * `{{root}}` in that file is replaced with the path passed to the script.
 * A case may contain argv.txt, a path relative to the case directory to use
 * instead of the directory itself.
 *
 * Usage: node tests/health-check/run.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.resolve(here, "../../scripts/health-check.mjs");
const fixtures = path.join(here, "fixtures");
const AGENTS = "---\nformat_version: 0.9.0\n---\n\n# Format\n";

let failed = 0;

function runCheck(root) {
  const result = spawnSync(process.execPath, [script, root], { encoding: "utf8" });
  return { stdout: result.stdout ?? "", stderr: result.stderr ?? "", code: result.status };
}

function parseExpected(raw, root) {
  const text = raw.replaceAll("{{root}}", root);
  if (!text.endsWith("\n")) throw new Error("expected.txt must end with a newline");
  const body = text.slice(0, -1);
  const splitAt = body.lastIndexOf("\n");
  const codeLine = splitAt === -1 ? body : body.slice(splitAt + 1);
  const stdout = splitAt === -1 ? "" : body.slice(0, splitAt + 1);
  if (!/^[012]$/.test(codeLine)) throw new Error(`expected.txt exit line must be 0, 1, or 2, got ${codeLine}`);
  return { stdout, code: Number(codeLine) };
}

function showMismatch(name, expected, actual) {
  failed += 1;
  console.log(`FAIL ${name}`);
  if (actual.code !== expected.code) console.log(`  exit ${actual.code}, expected ${expected.code}`);
  if (actual.stdout !== expected.stdout) {
    const got = actual.stdout.split("\n");
    const want = expected.stdout.split("\n");
    const lines = Math.max(got.length, want.length);
    for (let i = 0; i < lines; i += 1) {
      if (got[i] === want[i]) continue;
      console.log(`  expected: ${JSON.stringify(want[i] ?? "")}`);
      console.log(`  actual:   ${JSON.stringify(got[i] ?? "")}`);
    }
  }
  if (actual.stderr) console.log(actual.stderr);
}

function compare(name, root, expectedStdout, expectedCode) {
  const actual = runCheck(root);
  if (actual.stdout === expectedStdout && actual.code === expectedCode) {
    console.log(`ok ${name}`);
    return;
  }
  showMismatch(name, { stdout: expectedStdout, code: expectedCode }, actual);
}

function topic(updated, body = "") {
  return `---\ntype: topic\nstatus: active\nupdated: ${updated}\n---\n\n${body}`;
}

const cases = fs.readdirSync(fixtures, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const name of cases) {
  const dir = path.join(fixtures, name);
  const argvPath = path.join(dir, "argv.txt");
  const root = fs.existsSync(argvPath)
    ? path.resolve(dir, fs.readFileSync(argvPath, "utf8").trim())
    : dir;
  let expected;
  try {
    expected = parseExpected(fs.readFileSync(path.join(dir, "expected.txt"), "utf8"), root);
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${name}`);
    console.log(`  ${error.message}`);
    continue;
  }
  compare(name, root, expected.stdout, expected.code);
}

function tempCase(name, setup, expectedStdout, expectedCode) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "health-check-"));
  const extra = [];
  try {
    fs.writeFileSync(path.join(root, "AGENTS.md"), AGENTS);
    fs.mkdirSync(path.join(root, "topics"));
    setup(root, extra);
    compare(name, root, expectedStdout, expectedCode);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    for (const dir of extra) fs.rmSync(dir, { recursive: true, force: true });
  }
}

tempCase("bom-frontmatter", (root) => {
  const body = Buffer.from(topic("2026-10-14", "Body.\n"));
  fs.writeFileSync(path.join(root, "topics", "note.md"), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), body]));
}, "health-check: OK\n", 0);

tempCase("bom-only", (root) => {
  fs.writeFileSync(path.join(root, "topics", "bom.md"), Buffer.from([0xef, 0xbb, 0xbf]));
}, "BLOCKING topics/bom.md: empty Markdown file\nhealth-check: 1 blocking issue(s)\n", 1);

tempCase("invalid-utf8", (root) => {
  fs.writeFileSync(path.join(root, "topics", "bad.md"), Buffer.from([0xff, 0xfe]));
}, "BLOCKING topics/bad.md: missing or unterminated frontmatter\nhealth-check: 1 blocking issue(s)\n", 1);

tempCase("symlink-md", (root) => {
  fs.writeFileSync(path.join(root, "topics", "real.md"), topic("2026-10-14", "[missing](no-such.md)\n"));
  fs.symlinkSync("real.md", path.join(root, "topics", "link.md"));
}, [
  "BLOCKING topics/link.md:7: link to a non-existent file: no-such.md",
  "BLOCKING topics/real.md:7: link to a non-existent file: no-such.md",
  "health-check: 2 blocking issue(s)",
  "",
].join("\n"), 1);

tempCase("broken-symlink", (root, extra) => {
  fs.writeFileSync(path.join(root, "topics", "note.md"), topic("2026-10-14", "Body.\n"));
  fs.symlinkSync("missing.md", path.join(root, "topics", "broken.md"));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "health-check-out-"));
  extra.push(outside);
  fs.writeFileSync(path.join(outside, "secret.md"), "");
  fs.symlinkSync(outside, path.join(root, "topics", "linked-dir"));
}, "health-check: OK\n", 0);

tempCase("line-separator-u2028", (root) => {
  const text = ["---", "type: topic", "status: active", "updated: 2026-10-14", "---", "", "[missing](gone.md)"].join("\u2028");
  fs.writeFileSync(path.join(root, "topics", "sep.md"), text);
}, "BLOCKING topics/sep.md:7: link to a non-existent file: gone.md\nhealth-check: 1 blocking issue(s)\n", 1);

tempCase("skip-git", (root) => {
  fs.mkdirSync(path.join(root, ".git"));
  fs.writeFileSync(path.join(root, ".git", "bad.md"), "");
  fs.writeFileSync(path.join(root, "topics", "note.md"), topic("2026-10-14", "Body.\n"));
}, "health-check: OK\n", 0);

if (failed) {
  console.log(`health-check tests: ${failed} failed`);
  process.exit(1);
}
console.log(`health-check tests: ${cases.length} fixtures and 7 runtime cases passed`);
