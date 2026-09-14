#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
const checks = [
  ['test:security', 'node', ['scripts/security-audit.js']],
  ['test:community', 'node', ['scripts/community-security-audit.js']],
  ['test:smoke', 'node', ['scripts/smoke-audit.js']],
  ['release-audit', 'node', ['scripts/release-audit.js']],
];
let failed = 0;
for (const [name, command, args] of checks) {
  try { execFileSync(command, args, { stdio: 'inherit' }); }
  catch { console.error(`FAILED: ${name}`); failed += 1; }
}
if (failed) process.exit(1);
console.log('\nFULL AUDIT: all configured audit suites passed.');
