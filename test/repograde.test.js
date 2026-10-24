// RepoGrade tests: fixtures only (no network) plus one smoke of the MCP contract.
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRepoInput, shapeContext } from '../src/context.js';
import { runChecks, CHECKS, CATEGORIES } from '../src/checks.js';
import { scoreResults, letterGrade, compactSummary } from '../src/score.js';
import { renderMarkdown, renderHtml, renderBadge, renderFixPlan, toJson } from '../src/report.js';
import { handleRequest } from '../mcp/server.js';

const recent = () => new Date(Date.now() - 3 * 86400000).toISOString();

function strongRepo() {
  const paths = [
    'README.md', 'CHANGELOG.md', 'LICENSE', 'AGENTS.md', 'llms.txt', '.gitignore',
    'package.json', 'package-lock.json', 'src/index.js', 'src/checks.js',
    'test/index.test.js', 'test/checks.test.js',
    '.github/workflows/ci.yml', '.github/workflows/pages.yml',
    '.github/ISSUE_TEMPLATE/bug.yml', '.github/ISSUE_TEMPLATE/feature.yml',
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/CODE_OF_CONDUCT.md', '.github/CONTRIBUTING.md', '.github/SUPPORT.md',
    'skills/repograde/SKILL.md', 'mcp/server.js',
  ];
  return shapeContext({
    meta: {
      description: 'Grade any public repo before you announce it - 33 checks across 6 categories.',
      topics: ['repo', 'audit', 'cli', 'open-source'],
      homepage: 'https://fastpresspages.github.io/repograde/',
      pushed_at: recent(),
      archived: false,
      license: { spdx_id: 'Apache-2.0' },
    },
    tree: paths.map(p => ({ type: 'blob', path: p })),
    testFiles: ['test/index.test.js', 'test/checks.test.js'],
    readmeText: `# RepoGrade\n\nGrade any public repo before you announce it.\n\n## Install\n\n\`\`\`\nnpm install -g repograde\n\`\`\`\n\n## Usage\n\n\`\`\`\nrepograde owner/repo\n\`\`\`\n\n`.repeat(6),
    changelogText: `# Changelog\n\n## [v0.1.0] - 2026-10-24\n\nFirst public grade release.\n`,
    pkg: { name: 'repograde', version: '0.1.0', description: 'Grade repos with zero deps', license: 'Apache-2.0', engines: { node: '>=18.17' }, scripts: { test: 'node --test' }, dependencies: {} },
    otherPayload: { releases: [{ tag_name: 'v0.1.0', name: 'First public grade', body: 'Ships 33 checks across 6 categories with terminal, json, markdown and html artifacts.', created_at: recent() }] },
  });
}

function sparseRepo() {
  return shapeContext({
    meta: { description: '', topics: [], homepage: null, pushed_at: new Date(Date.now() - 300 * 86400000).toISOString(), archived: true, license: null },
    tree: [{ type: 'blob', path: 'hello.txt' }],
    readmeText: null, changelogText: null, pkg: null,
    otherPayload: { releases: [] },
  });
}

test('parseRepoInput handles slugs, urls with branches and junk', () => {
  assert.deepEqual(parseRepoInput('fastpresspages/launchgrade'), { owner: 'fastpresspages', repo: 'launchgrade', branch: undefined });
  assert.equal(parseRepoInput('fastpresspages/launchgrade#v0.3').branch, 'v0.3');
  const fromUrl = parseRepoInput('https://github.com/vercel/next.js/tree/canary');
  assert.equal(fromUrl.owner, 'vercel');
  assert.equal(fromUrl.repo, 'next.js');
  assert.equal(fromUrl.branch, 'canary');
  assert.equal(parseRepoInput('not a repo'), null);
  assert.equal(parseRepoInput(''), null);
});

test('shapeContext extracts features from tree paths', () => {
  const c = strongRepo();
  assert.equal(c.workflows.length, 2);
  assert.equal(c.issueTemplates.length, 2);
  assert.equal(c.prTemplate, true);
  assert.equal(c.agentsMd, true);
  assert.equal(c.skills.length, 1);
  assert.equal(c.mcpFiles.length, 1);
  assert.equal(c.licenseSpdx, 'Apache-2.0');
  assert.ok(c.needs('LICENSE'));
});

test('runChecks on a strong repo earns an announce-ready grade', () => {
  const results = runChecks(strongRepo());
  const scored = scoreResults(results);
  assert.ok(scored.score >= 90, `expected >=90, got ${scored.score}: ${compactSummary(scored)}`);
  assert.equal(scored.grade === 'A+' || scored.grade === 'A' || scored.grade === 'A-', true, scored.grade);
  assert.equal(scored.topFixes.length <= 7, true);
});

test('runChecks on a sparse repo warns/fails honestly', () => {
  const results = runChecks(sparseRepo());
  const scored = scoreResults(results);
  assert.ok(scored.score < 45, `expected very low, got ${scored.score}`);
  assert.deepEqual(letterGrade(scored.score), 'F');
  const statuses = Object.fromEntries(results.map(r => [r.id, r.status]));
  assert.equal(statuses['docs.readme'], 'fail');
  assert.equal(statuses['eng.ci'], 'fail');
  // pkg-less checks should skip cleanly, not error
  assert.equal(statuses['eng.test-script'], 'skip');
  assert.equal(statuses['rel.version-match'], 'skip');
});

test('check IDs are unique and cover all categories', () => {
  const ids = new Set(CHECKS.map(c => c.id));
  assert.equal(ids.size, CHECKS.length);
  assert.ok(CHECKS.length >= 30, `only ${CHECKS.length} checks`);
  for (const cat of CATEGORIES) assert.ok(CHECKS.some(c => c.cat === cat.key), cat.key);
  const weights = catWeightsShouldMatch(CATEGORIES);
  assert.equal(weights, 100);
});

function catWeightsShouldMatch(categories) {
  let total = 0;
  for (const c of categories) total += c.weight;
  return total;
}

test('scoring treats warn as half credit and rounds category shares', () => {
  const base = { category: 'docs', weight: 4 };
  const results = [
    { ...base, id: 'docs.readme', title: 'x', status: 'pass' },
    { ...base, id: 'docs.readme-quality', title: 'x', status: 'warn' },
    { ...base, id: 'docs.install', title: 'x', status: 'pass' },
    { ...base, id: 'docs.usage', title: 'x', status: 'pass' },
    { ...base, id: 'docs.changelog', title: 'x', status: 'fail' },
  ];
  const scored = scoreResults(results);
  const docs = scored.categories.find(c => c.key === 'docs');
  assert.equal(docs.score, Math.round((4 + 2 + 4 + 4 + 0) / 20 * 100));
  assert.equal(scored.score, Math.round(14 / 20 * 100));
});

test('renderers expose grade in markdown, html, json and badge', () => {
  const results = runChecks(strongRepo());
  const scored = scoreResults(results);
  const md = renderMarkdown(scored, { input: { owner: 'o', repo: 'r' }, url: 'https://github.com/o/r', branch: 'main', fetchedAt: recent() }, { version: 'test' });
  assert.match(md, /RepoGrade — o\/r/);
  assert.match(md, new RegExp(`\\*\\*${scored.grade.replace('+', '\\+')} · ${scored.score}/100`));
  const html = renderHtml(scored, { input: { owner: 'o', repo: 'r' }, url: 'https://github.com/o/r', branch: 'main', fetchedAt: recent() }, { version: 'test' });
  assert.match(html, new RegExp(`<b>${scored.grade.replace('+', '\\+')}<\/b>`));
  assert.match(html, /All checks/);
  const json = JSON.parse(toJson(scored, { input: { owner: 'o', repo: 'r' }, url: 'https://github.com/o/r', branch: 'main', fetchedAt: recent() }, { version: 'test' }));
  assert.equal(json.tool, 'repograde');
  assert.equal(json.grade, scored.grade);
  const svg = renderBadge(scored);
  assert.match(svg, /<svg/);
  assert.match(svg, new RegExp(scored.grade.replace('+', '\\+')));
  const plan = renderFixPlan(scored, { input: { owner: 'o', repo: 'r' }, fetchedAt: recent() });
  assert.match(plan, /fix plan/i);
});

test('MCP contract: initialize, tools/list, list_checks, and graceful errors', async () => {
  const init = await handleRequest({ id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
  assert.equal(init.result.serverInfo.name, 'repograde');
  const list = await handleRequest({ id: 2, method: 'tools/list' });
  const names = list.result.tools.map(t => t.name);
  assert.deepEqual(names, ['grade_repo', 'list_checks']);
  const checks = await handleRequest({ id: 3, method: 'tools/call', params: { name: 'list_checks', arguments: {} } });
  assert.match(checks.result.content[0].text, /AGENTS\.md/);
  const bad = await handleRequest({ id: 4, method: 'tools/call', params: { name: 'grade_repo', arguments: { repo: 'definitely/not-real-xyz-123' } } });
  assert.equal(bad.result.isError, true);
  const missing = await handleRequest({ id: 5, method: 'tools/call', params: { name: 'nope', arguments: {} } });
  assert.ok(missing.error);
  const note = await handleRequest({ method: 'notifications/initialized' });
  assert.equal(note, null);
});
