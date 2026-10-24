#!/usr/bin/env node
// RepoGrade CLI — grade any public GitHub repo before you announce it.
// Zero dependencies. Node 18.17+.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { buildRepoContext, parseRepoInput, VERSION } from '../src/context.js';
import { runChecks, CHECKS, CATEGORIES } from '../src/checks.js';
import { scoreResults, compactSummary } from '../src/score.js';
import {
  renderTerminal, renderMarkdown, toJson, renderBadge, renderFixPlan, renderHtml,
} from '../src/report.js';

const argv = process.argv.slice(2);

function parseArgs(strs) {
  const flags = new Map();
  const positional = [];
  let i = 0;
  const need = (k) => {
    const val = strs[++i];
    if (val === undefined) { console.error(`Flag --${k} needs a value`); process.exit(2); }
    return val;
  };
  while (i < strs.length) {
    const a = strs[i];
    if (a === '--help' || a === '-h') { flags.set('help', true); }
    else if (a === '--version' || a === '-v') { flags.set('version', true); }
    else if (a === '--list') { flags.set('list', true); }
    else if (a === '--no-color') { flags.set('color', false); }
    else if (a === '--color') { flags.set('color', true); }
    else if (a === '--quiet' || a === '-q') { flags.set('quiet', true); }
    else if (a === '--fail-under') { flags.set('fail-under', Number(need('fail-under'))); }
    else if (a === '--token') { flags.set('token', need('token')); }
    else if (a === '--format' || a === '-f') { flags.set('format', need('format')); }
    else if (a === '--out' || a === '-o') { flags.set('out', need('out')); }
    else if (a === '--md') { flags.set('format', 'markdown'); }
    else if (a === '--json') { flags.set('format', 'json'); }
    else if (a === '--html') { flags.set('format', 'html'); }
    else if (a === '--') { for (i += 1; i < strs.length; i++) positional.push(strs[i]); }
    else if (a.startsWith('-')) {
      console.error(`Unknown flag: ${a} (try --help)`);
      process.exit(2);
    } else positional.push(a);
    i++;
  }
  return { flags, positional };
}

const { flags, positional } = parseArgs(argv);

if (flags.get('help')) {
  console.log(`▲ RepoGrade v${VERSION} — grade your repo before you announce it.

Usage
  repograde owner/repo                    one repo (or a https://github.com URL)
  repograde owner/repo -o report          writes report.{html,json,md} + badge.svg + fix-plan.md

Formats
  terminal (default)   --json   --md   --html   --format <name>

Flags
  --fail-under <n>   non-zero exit code when the score is lower than n
  --out, -o <dir>    write the five report artifacts
  --token <t>        GitHub token: 5,000 req/hour instead of 60 (or set GITHUB_TOKEN)
  --no-color         plain output, safe for logs
  --quiet            one summary line
  --list             print the whole rule list
  --version          print version

Examples
  repograde fastpresspages/launchgrade
  repograde https://github.com/vercel/next.js --fail-under 70
  repograde owner/repo --out .repograde && cat .repograde/badge.svg

Rate limits: 60 req/hour unauthenticated on api.github.com, 5,000 with GITHUB_TOKEN.
Zero dependencies. Runs on Node 18.17+. Apache-2.0.`);
  process.exit(0);
}

if (flags.get('version')) {
  console.log(VERSION);
  process.exit(0);
}

async function printList() {
  console.log('\nRepoGrade checks\n');
  for (const cat of CATEGORIES) {
    console.log(`  ${cat.label} (weight ${cat.weight})`);
    for (const ck of CHECKS.filter(c => c.cat === cat.key)) {
      console.log(`    ${ck.id.padEnd(22)} w${ck.weight}  ${ck.title}`);
    }
  }
  console.log(`\n  ${CHECKS.length} checks · ${CATEGORIES.length} categories · zero dependencies\n`);
}

if (flags.get('list')) {
  await printList();
  process.exit(0);
}

const inputArg = positional[0];
if (!inputArg) {
  console.error('Usage: repograde owner/repo   (try --help)');
  process.exit(2);
}
const parsed = parseRepoInput(inputArg);
if (!parsed) {
  console.error(`Could not parse "${inputArg}" as a GitHub repository.\nUse owner/repo or an https://github.com/owner/repo URL.`);
  process.exit(2);
}

let ctx;
try {
  ctx = await buildRepoContext(inputArg, { token: flags.get('token') || (typeof process !== 'undefined' ? process.env.GITHUB_TOKEN : undefined) });
} catch (e) {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}

const results = runChecks(ctx);
const scored = scoreResults(results);
const format = (flags.get('format') || 'terminal');

let out = '';
if (format === 'json') out = toJson(scored, ctx, { version: VERSION });
else if (format === 'markdown' || format === 'md') out = renderMarkdown(scored, ctx, { version: VERSION });
else if (format === 'html') out = renderHtml(scored, ctx, { version: VERSION });
else if (format === 'terminal') {
  out = flags.get('quiet')
    ? compactSummary(scored, `${ctx.input?.owner}/${ctx.input?.repo}`)
    : renderTerminal(scored, ctx, { color: flags.get('color') !== false });
} else {
  console.error(`Unknown format "${format}" (try --help)`);
  process.exit(2);
}

console.log(out);

if (flags.get('out')) {
  const dir = resolve(String(flags.get('out')));
  const base = `${ctx.input?.owner}-${ctx.input?.repo}`;
  const artifacts = new Map([
    ['report.html', renderHtml(scored, ctx, { version: VERSION })],
    ['report.json', toJson(scored, ctx, { version: VERSION })],
    ['report.md', renderMarkdown(scored, ctx, { version: VERSION })],
    ['badge.svg', renderBadge(scored)],
    ['fix-plan.md', renderFixPlan(scored, ctx)],
  ]);
  try {
    for (const [name, content] of artifacts) {
      const file = join(dir, name);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, content, 'utf8');
    }
    console.error(`\n→ Wrote ${artifacts.size} report artifacts to ${dir}`);
  } catch (e) {
    console.error(`✗ Could not write artifacts: ${e.message}`);
    process.exit(1);
  }
}

const failUnder = flags.get('fail-under');
if (typeof failUnder === 'number' && !Number.isNaN(failUnder) && scored.score < failUnder) {
  console.error(`\n✗ score ${scored.score} is under the ${failUnder} threshold`);
  process.exit(2);
}
