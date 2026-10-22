#!/usr/bin/env node
'use strict';
const path = require('path');
const root = path.join(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const arg = process.argv[2];
if (arg === '--version' || arg === '-v') {
  console.log(pkg.version);
} else {
  console.log(`ops-agents ${pkg.version} — the ops-* repository format`);
  console.log(`Format docs:  ${path.join(root, 'AGENTS.md')}`);
  console.log(`Changelog:    ${path.join(root, 'CHANGELOG.md')}`);
  console.log(`Templates:    ${path.join(root, 'CLAUDE.md')}, ${path.join(root, '.gitignore')} (copy unchanged into ops-<project>)`);
  console.log(`More: ${pkg.homepage}`);
}
