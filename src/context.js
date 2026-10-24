// RepoGrade context: normalizes input and collects repo facts from the
// public GitHub API. Works unauthenticated; set GITHUB_TOKEN for 5,000 req/h.
export const VERSION = '0.1.0';
export const USER_AGENT = `RepoGrade/${VERSION}`;
const API = 'https://api.github.com';
const RAW = 'https://raw.githubusercontent.com';

/** Accepts owner/repo, a github.com URL (with optional /tree/branch), or an
 *  HTTPS clone URL. Returns { owner, repo, branch? } or null when unusable. */
export function parseRepoInput(input) {
  if (typeof input !== 'string') return null;
  let s = input.trim();
  if (!s) return null;
  s = s.replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '');
  let m = s.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)(?:\/tree\/([^/\s#?]+))?/);
  if (m) {
    const branch = m[3] ? decodeURIComponent(m[3]) : undefined;
    return { owner: m[1], repo: m[2].replace(/\.git$/, ''), branch };
  }
  m = s.match(/^([\w.-]+)\/([\w.-]+)(?:#(.+))?$/);
  if (m) {
    const branch = m[3];
    return { owner: m[1], repo: m[2], branch: branch || ( /^[A-Za-z][\w./-]*$/.test(m[3] || '') ? m[3] : undefined ) };
  }
  return null;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function ghFetch(url, token, asJson) {
  const headers = {
    'user-agent': USER_AGENT,
    accept: asJson ? 'application/vnd.github+json' : 'text/plain',
  };
  if (token) headers.authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(url, { headers, redirect: 'follow' });
  } catch (e) {
    throw new Error(`Network error talking to GitHub (${e.message}). Check your connection and try again.`);
  }
  if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
    const reset = Number(res.headers.get('x-ratelimit-reset') || 0) * 1000;
    const when = reset ? new Date(reset).toISOString() : 'unknown';
    throw new Error(`GitHub API rate limit reached (unauthenticated: 60 requests/hour). ${token ? '' : 'Set GITHUB_TOKEN for 5,000/hour. '}Window resets at ${when}.`);
  }
  if (res.status === 404) {
    const e = new Error(`Not found (404): ${url}. Check the owner/repo slug and make sure the repo is public.`);
    e.status = 404;
    throw e;
  }
  if (res.status === 301) {
    throw new Error(`Repo moved (301). GitHub redirects private names; the slug you gave no longer resolves to a public repo.`);
  }
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status} for ${parse(url)}. ${res.statusText || ''}`.trim());
  }
  return res;
}

function parse(u) {
  try {
    const x = new URL(u);
    return x.pathname.replace('/repos/', '').replace('/git/trees/', '').replace('~', '~');
  } catch { return u; }
}

async function ghApi(path, token) {
  const res = await ghFetch(`${API}${path}`, token, true);
  return res.json();
}

async function ghRaw(owner, repo, branch, file, token) {
  try {
    const res = await ghFetch(`${RAW}/${owner}/${repo}/${encodeURIComponent(branch)}/${file}`, token, false);
    return await res.text();
  } catch (e) {
    if (e && e.status === 404) return null;
    throw e;
  }
}

/** Pure reshaper used by buildRepoContext and by tests with fixture data. */
export function shapeContext(data) {
  const { meta, tree, otherPayload = {}, testFiles = [], readmeText, changelogText, pkg, licenses = {}, branches = [] } = data || {};
  const paths = (tree || []).map(p => p.path);
  const lower = new Set(paths.map(p => p.toLowerCase()));
  const needs = (name) => lower.has(name.toLowerCase());
  return {
    meta, tree, paths, lower, needs,
    licenseSpdx: (meta?.license && meta?.license.spdx_id) || null,
    testFiles, readmeText: readmeText ?? null, changelogText: changelogText ?? null,
    pkg: pkg ?? null,
    releases: otherPayload.releases || [],
    workflows: paths.filter(p => /^\.github\/workflows\/.+\.(yml|yaml)$/i.test(p)),
    issueTemplates: paths.filter(p => p.toLowerCase().startsWith('.github/issue_template/')),
    prTemplate: needs('.github/PULL_REQUEST_TEMPLATE.md') || needs('.github/PULL_REQUEST_TEMPLATE'),
    securityPolicy: needs('SECURITY.md') || needs('.github/SECURITY.md'),
    agentsMd: needs('AGENTS.md'),
    llmsTxt: needs('llms.txt'),
    skills: paths.filter(p => /(^|\/)(SKILL|skill)\.md$/i.test(p)),
    mcpFiles: paths.filter(p => /(^|\/)(mcp[^/]*\.(js|json)|server\.js$)/i.test(p) && /mcp/i.test(p)),
    domains: paths.filter(p => /\.(lock)$/i.test(p)),
    docsDir: lower.has('docs'),
    branches,
    licenses,
    owner: meta?.owner?.login || null,
    name: meta?.name || null,
  };
}

/** Collects the data a scan needs, per repo, from the GitHub API. */
export async function buildRepoContext(input, { token, timeout = 20000 } = {}) {
  const parsed = parseRepoInput(input);
  if (!parsed) throw new Error(`Could not parse "${input}" as a GitHub repository. Use owner/repo or an https://github.com/owner/repo URL.`);
  const { owner, repo } = parsed;
  const meta = await ghApi(`/repos/${owner}/${repo}`, token);
  if (meta.archived) { /* still grade, but archive check flags it */ }

  const branch = parsed.branch || meta.default_branch || 'main';
  const [treeRes, releases] = await Promise.all([
    ghApi(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, token),
    ghApi(`/repos/${owner}/${repo}/releases?per_page=5`, token).catch(() => []),
  ]);
  const tree = (treeRes.tree || []).filter(p => p.type === 'blob');
  const projects = ['README.md', 'CHANGELOG.md', 'README'];
  const [readmeText, changelogText, pkgText] = await Promise.all([
    tree.some(p => p.path === 'README.md') ? ghRaw(owner, repo, branch, 'README.md', token) : null,
    tree.some(p => p.path === 'CHANGELOG.md') ? ghRaw(owner, repo, branch, 'CHANGELOG.md', token) : null,
    tree.some(p => p.path === 'package.json') ? ghRaw(owner, repo, branch, 'package.json', token) : null,
  ]);
  let pkg = null;
  if (pkgText) {
    try { pkg = JSON.parse(pkgText); } catch { pkg = null; }
  }
  const testFiles = tree.filter(t => /(\.test\.|\.spec\.|\/tests?\/|__tests__)/i.test(t.path)).map(t => t.path);
  const otherPayload = { releases, };
  const shaped = shapeContext({ meta, tree, otherPayload, testFiles, readmeText, changelogText, pkg });
  shaped.branch = branch;
  shaped.version = VERSION;
  shaped.input = { owner, repo, branch, requested: input };
  shaped.url = `https://github.com/${owner}/${repo}`;
  shaped.fetchedAt = new Date().toISOString();
  return shaped;
}
