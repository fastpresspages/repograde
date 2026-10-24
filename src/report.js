// RepoGrade renderers: terminal (ANSI), markdown, JSON, HTML, badge, fix plan.
export function scoreColor(grade) {
  const g = String(grade || '');
  if (g.startsWith('A')) return '#3DDC84';
  if (g.startsWith('B')) return '#C6FF4A';
  if (g.startsWith('C')) return '#FFB020';
  if (g.startsWith('D') || g === 'F') return '#FF5C5C';
  return '#A78BFA';
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderTerminal(scored, ctx, { color = true } = {}) {
  const c = (code, s) => (color ? `\x1b[${code}m${s}\x1b[0m` : `${s}`);
  const lime = (s) => c('38;5;154', s);
  const dim = (s) => c('90', s);
  const bold = (s) => c('1', s);
  const lines = [];
  const owner = ctx.input?.owner || '';
  const repo = ctx.input?.repo || '';
  lines.push('');
  lines.push(`${lime('▲ RepoGrade')} ${dim(`v${ctx?.version ?? ''}  ·  ${owner}/${repo}`)}`);
  lines.push(dim(`${ctx.url || ''} • branch ${ctx.branch || 'main'}`));
  lines.push('');
  const box = `   ${dim('┌' + '─'.repeat(46) + '┐')}\n   ${dim('│')}  ${c(`38;5;${gradAnsi(scored.grade)}`, scored.grade)}  ${bold(String(scored.score).padStart(3) + '/100')}   ${scored.label}  ${dim('│')}\n   ${dim('└' + '─'.repeat(46) + '┘')}`;
  lines.push(box);
  lines.push(`   ${dim(`${scored.counts.pass} pass · ${scored.counts.warn} warn · ${scored.counts.fail} fail · ${scored.counts.skip + scored.counts.info} n/a`)}`);
  lines.push('');
  for (const cat of scored.categories) {
    const filled = Math.max(0, Math.min(20, Math.round(cat.score / 5)));
    const bar = c(`38;5;${gradAnsi(numGrade(cat.score))}`, '█'.repeat(filled)) + dim('░'.repeat(20 - filled));
    lines.push(`   ${bold(cat.label.padEnd(18))} ${dim(String(cat.score).padStart(3))}  ${bar}`);
  }
  if (scored.topFixes.length) {
    lines.push('');
    lines.push(`   ${bold('Fix these first')}`);
    for (const [i, f] of scored.topFixes.entries()) {
      const tag = f.status === 'fail' ? c('31', ' FAIL') : c('33', ' WARN');
      const catLabel = catLabelOf(f.category);
      lines.push(`  ${dim(`${i + 1}.`)} ${tag} ${dim(`[${catLabel}]`)} ${bold(f.title)}`);
      lines.push(`      ${dim(f.detail || '')}`);
    }
  }
  lines.push('');
  if (ctx?.url) lines.push(`   ${dim('Open the scan:')}  ${ctx.url}`);
  lines.push(`   ${dim('Grade another:')}  ${lime('npx repograde owner/repo')}`);
  return lines.join('\n');
}

function catLabelOf(key) {
  return ({ docs: 'Docs', community: 'Community', engineering: 'Eng', discoverability: 'Discover', release: 'Release', agent: 'Agent' })[key] || key;
}
function numGrade(score) {
  if (score >= 80) return 'A'; if (score >= 60) return 'B'; if (score >= 40) return 'C'; return 'D';
}
function gradAnsi(grade) {
  const g = String(grade || '')[0];
  return g === 'A' ? '41' : g === 'B' ? '190' : g === 'C' ? '214' : '203';
}

export function renderMarkdown(scored, ctx, { version = '0.1.0' } = {}) {
  const L = [];
  L.push(`# RepoGrade — ${esc(ctx.input?.owner)}/${esc(ctx.input?.repo)}`);
  L.push(`> **${esc(scored.grade)} · ${scored.score}/100 · ${esc(scored.label)}** — scanned ${new Date(ctx.fetchedAt).toISOString().slice(0, 10)} with RepoGrade v${version}`);
  L.push('');
  L.push(`${scored.counts.pass} pass · ${scored.counts.warn} warn · ${scored.counts.fail} fail · ${scored.counts.skip} skipped · ${scored.counts.info} info`);
  L.push('');
  L.push('| Category | Score |');
  L.push('| --- | --- |');
  for (const cat of scored.categories) L.push(`| ${esc(cat.label)} | ${cat.score} |`);
  if (scored.topFixes.length) {
    L.push('');
    L.push('## Fix these first');
    for (const f of scored.topFixes) L.push(`- **${esc(f.title)}** (${esc(f.status)} · ${esc(f.id)}) — ${esc(f.detail || '')}`);
  }
  L.push('');
  L.push('<details>');
  L.push('<summary>All checks</summary>');
  L.push('');
  for (const r of scored.results) L.push(`- ${badgeFor(r.status)} \`${esc(r.id)}\` — ${esc(r.title)} ${r.detail ? `— ${esc(r.detail)}` : ''}`);
  L.push('');
  L.push('</details>');
  L.push('');
  L.push(`Source: ${esc(ctx.url)}`);
  return L.join('\n');
}
function badgeFor(status) {
  return ({ pass: '✅', warn: '⚠️', fail: '❌', error: '🛑', skip: '⏭️', info: 'ℹ️' })[status] || '·';
}

export function toJson(scored, ctx, { version = '0.1.0' } = {}) {
  return JSON.stringify({
    tool: 'repograde',
    version,
    generatedAt: new Date().toISOString(),
    repo: {
      owner: ctx.input?.owner ?? null,
      name: ctx.input?.repo ?? null,
      url: ctx.url ?? null,
      branch: ctx.branch ?? null,
      description: ctx.meta?.description ?? null,
    },
    grade: scored.grade,
    score: scored.score,
    label: scored.label,
    counts: scored.counts,
    categories: scored.categories,
    topFixes: scored.topFixes,
    checks: scored.results,
  }, null, 2);
}

export function renderBadge(scored) {
  const w = 140, h = 24, color = scoreColor(scored.grade);
  const grade = esc(scored.grade);
  const score = `${scored.score}%25`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="RepoGrade: ${grade} ${scored.score} out of 100">
  <title>RepoGrade: ${grade} ${scored.score}/100</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${w}" height="${h}" rx="4" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="70" height="${h}" fill="#08080A"/>
    <rect x="70" width="${w - 70}" height="${h}" fill="${color}"/>
    <rect width="${w}" height="${h}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="11">
    <text x="35" y="16" fill="#010101" fill-opacity=".3">repograde</text>
    <text x="35" y="15">repograde</text>
    <text x="${70 + (w - 70) / 2}" y="16" fill="#010101" fill-opacity=".3">${grade} ${scored.score}</text>
    <text x="${70 + (w - 70) / 2}" y="15">${grade} ${scored.score}</text>
  </g>
</svg>`;
}

export function renderFixPlan(scored, ctx) {
  const L = [];
  L.push(`# RepoGrade fix plan — ${ctx.input?.owner || ''}/${ctx.input?.repo || ''}`);
  L.push('');
  L.push(`Grade: **${scored.grade} ${scored.score}/100** (${scored.label}) — scan ${new Date(ctx.fetchedAt).toISOString().slice(0, 10)}`);
  L.push('');
  if (!scored.topFixes.length) {
    L.push('Nothing on the fix list. Announce it, then keep this file green for the next release.');
  } else {
    for (const [i, f] of scored.topFixes.entries()) {
      const fix = FIX_TEXT[f.id] || 'Improve this area before you announce.';
      L.push(`${i + 1}. [${f.status.toUpperCase()}] **${f.title}** — ${fix}`);
      L.push(`   _Evidence: ${f.detail || 'n/a'}_`);
      L.push('');
    }
  }
  L.push('Run me again after fixes: `npx repograde owner/repo`.');
  return L.join('\n');
}

const FIX_TEXT = {
  'docs.readme': 'Add a README.md with a title, one-paragraph description and install/usage.',
  'docs.readme-quality': 'Rewrite the first 3 lines: what it is, who it is for, why it exists.',
  'docs.install': 'Add an "Install" section with one fenced command people can paste.',
  'docs.usage': 'Add a "Usage" section with the happy path, copy-pasteable.',
  'docs.changelog': 'Create/open CHANGELOG.md and record the current release under a version heading.',
  'comm.license': 'Add a LICENSE (Apache-2.0 or MIT are common defaults).',
  'comm.permissive': 'Consider a permissive SPDX license for adoption.',
  'comm.contributing': 'Add CONTRIBUTING.md describing setup, tests and PR norms.',
  'comm.code-of-conduct': 'Add CODE_OF_CONDUCT.md (Contributor Covenant works).',
  'comm.support': 'Add SUPPORT.md pointing to issues/discussions.',
  'comm.issue-templates': 'Add .github/ISSUE_TEMPLATE bug + feature forms.',
  'comm.pr-template': 'Add .github/PULL_REQUEST_TEMPLATE.md.',
  'eng.tests': 'Add a first automated test.',
  'eng.ci': 'Add .github/workflows/ci.yml running your tests.',
  'eng.test-script': 'Set scripts.test in package.json.',
  'eng.engines': 'Set engines.node (or your runtime) in package.json.',
  'eng.gitignore': 'Add .gitignore.',
  'eng.zero-deps': 'Remove runtime dependencies you do not truly need.',
  'eng.lockfile': 'Commit a lockfile for reproducible installs.',
  'eng.pkg-wellformed': 'Complete package.json name/version/description/license.',
  'disc.description': 'Set the one-line GitHub description (15-90 chars).',
  'disc.topics': 'Add at least 3 topics.',
  'disc.homepage': 'Set the homepage URL in the About sidebar.',
  'disc.active': 'Ship something small so the repo does not read abandoned.',
  'rel.releases': 'Tag a version and publish a GitHub release.',
  'rel.notes': 'Write short readable release notes.',
  'rel.version-match': 'Re-sync the release tag with package.json version.',
  'agent.instructions': 'Add AGENTS.md with repo rules for humans and agents.',
  'agent.skills': 'Package an agent skill at skills/<name>/SKILL.md.',
  'agent.mcp': 'Expose an MCP server or a .well-known/mcp.json manifest.',
  'agent.llms': 'Publish llms.txt.',
};

export function renderHtml(scored, ctx, { version = '0.1.0' } = {}) {
  const color = scoreColor(scored.grade);
  const escc = esc;
  const rows = scored.categories.map(cat => `
      <div class="cat">
        <div class="cat-head"><span>${escc(cat.label)}</span><b>${cat.score}</b></div>
        <div class="bar"><i style="width:${cat.score}%; background:${color}"></i></div>
      </div>`).join('\n');
  const fixes = scored.topFixes.map((f, i) => `
        <li><span class="tag ${f.status}">${f.status.toUpperCase()}</span> <b>${esc(f.title)}</b><br><small>${esc(f.detail || '')} ${FIX_TEXT[f.id] ? `— ${esc(FIX_TEXT[f.id])}` : ''}</small></li>`).join('');
  const all = scored.results.map(r => `<tr><td>${badgeFor(r.status)}</td><td><code>${esc(r.id)}</code><br><b>${esc(r.title)}</b><br><small>${esc(r.detail || '')}</small></td></tr>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RepoGrade — ${esc(ctx.input?.owner)}/${esc(ctx.input?.repo)} · ${esc(scored.grade)} ${scored.score}/100</title>
<meta name="description" content="RepoGrade scan of ${esc(ctx.input?.owner)}/${esc(ctx.input?.repo)}: grade ${esc(scored.grade)} (${scored.score}/100), ${esc(scored.label)}.">
<meta property="og:title" content="RepoGrade: ${esc(ctx.input?.owner)}/${esc(ctx.input?.repo)} = ${esc(scored.grade)} ${scored.score}/100">
<meta property="og:description" content="Docs, community, engineering, discoverability, release hygiene and agent-readiness graded.">
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#08080A;color:#EDEDEF;font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:880px;margin:0 auto;padding:28px 20px 60px}
h1{font-size:26px;margin:0 0 4px} .sub{color:#9CA3AF;font-size:14px}
.card{background:#0D0D11;border:1px solid #1C1C24;border-radius:14px;padding:22px;margin-top:18px}
.grade{display:flex;align-items:baseline;gap:14px} .grade b{font-size:52px;color:${color}} .grade span{color:#9CA3AF}
.cat{margin-top:12px} .cat-head{display:flex;justify-content:space-between;font-size:14px}
.bar{height:8px;border-radius:99px;background:#15151B;margin-top:4px;overflow:hidden}
.bar i{display:block;height:100%;border-radius:99px}
ol{margin:0;padding-left:20px} li{margin:10px 0} li b{color:#EDEDEF}
.tag{font-size:11px;padding:2px 8px;border-radius:99px;margin-right:6px}
.tag.fail{background:#3A1414;color:#FF7A7A} .tag.warn{background:#3A2C14;color:#FFC24A}
table{width:100%;border-collapse:collapse;font-size:13px} td{padding:10px 6px;border-bottom:1px solid #1C1C24;vertical-align:top}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#A78BFA;font-size:12px}
small{color:#9CA3AF} .foot{margin-top:26px;color:#9CA3AF} a{color:#C6FF4A}
</style>
</head>
<body>
<main>
<h1>RepoGrade report</h1>
<p class="sub">${esc(ctx.input?.owner)}/${esc(ctx.input?.repo)} · scanned ${new Date(ctx.fetchedAt).toISOString().slice(0, 10)} · v${version}</p>
<div class="card">
  <div class="grade"><b>${esc(scored.grade)}</b><span>${scored.score}/100 · ${esc(scored.label)}<br>${scored.counts.pass} pass · ${scored.counts.warn} warn · ${scored.counts.fail} fail · ${scored.counts.skip + scored.counts.info} n/a</span></div>
  ${rows}
</div>
<div class="card">
  <h2 style="font-size:18px;margin-top:0">Fix these first</h2>
  <ol>${fixes || '<li>Nothing on the fix list — announce it.</li>'}</ol>
</div>
<div class="card">
  <h2 style="font-size:18px;margin-top:0">All checks</h2>
  <table>${all}</table>
</div>
<p class="foot">Scanned with <a href="https://github.com/fastpresspages/repograde">RepoGrade</a> (open source, zero dependencies). Report generated from public GitHub data; no repository contents were modified. <a href="${esc(ctx.url)}">View the repo</a>.</p>
</main>
</body>
</html>`;
}
