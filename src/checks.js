// RepoGrade checks. Pure functions on a shaped context - no network, so a
// whole scan is deterministic and unit-testable with fixtures.
export const CATEGORIES = [
  { key: 'docs', label: 'Documentation', weight: 20 },
  { key: 'community', label: 'Community', weight: 15 },
  { key: 'engineering', label: 'Engineering', weight: 25 },
  { key: 'discoverability', label: 'Discoverability', weight: 15 },
  { key: 'release', label: 'Release hygiene', weight: 10 },
  { key: 'agent', label: 'Agent-readiness', weight: 15 },
];

export const CHECKS = [
  // ---- Documentation (20)
  {
    id: 'docs.readme', cat: 'docs', weight: 4, title: 'README exists',
    fn: (c) => c.readmeText ? pass('README.md found') : fail('No README.md in the repo root'),
    fixText: 'The README is the front door - users, judges and agents read it first. Add one.',
  },
  {
    id: 'docs.readme-quality', cat: 'docs', weight: 4, title: 'README explains the repo', skipIf: (c) => !c.readmeText,
    fn: (c) => {
      const t = c.readmeText || '';
      const short = t.length < 400;
      const noTitle = !/^#\s+\S/m.test(t);
      if (noTitle && short) return fail('README has no heading and is very short');
      if (short) return warn('README is thin (under 400 characters)');
      return pass(`${t.length} characters of guidance`);
    },
    fixText: 'Start the README with a title and a two-or-three-sentence description so a newcomer can tell what this is and why to care in 15 seconds.',
  },
  {
    id: 'docs.install', cat: 'docs', weight: 4, title: 'Install command', skipIf: (c) => !c.readmeText,
    fn: (c) => {
      const t = (c.readmeText || '').toLowerCase();
      const fence = /(npm|npx|pip|pip3|cargo|brew|go install|cargo install|gem install|cargo add)/;
      if (fence.test(t)) return pass('Install guidance detected');
      return warn('No recognizable install command in the README');
    },
    fixText: 'Add an Install section with one fenced copy-pasteable command (npm/pip/cargo/brew or equivalent) that a machine would actually try.',
  },
  {
    id: 'docs.usage', cat: 'docs', weight: 4, title: 'Usage example', skipIf: (c) => !c.readmeText,
    fn: (c) => {
      const t = (c.readmeText || '').toLowerCase();
      const sections = /(usage|getting started|quick start|example)/.test(t);
      if (!sections) return warn('No usage/quick-start section heading');
      return pass('Usage section present');
    },
    fixText: 'Add a Usage or Quick start section and show the happy path in 5-10 lines so someone can copy it immediately.',
  },
  {
    id: 'docs.changelog', cat: 'docs', weight: 4, title: 'Changelog with version entries',
    fn: (c) => {
      const t = c.changelogText || '';
      if (!t) return fail('No CHANGELOG.md');
      return /\n##?\s*\[?v?\d+\.\d+/.test(t) ? pass('Versioned changelog entries') : warn('CHANGELOG exists but entries do not look versioned');
    },
    fixText: 'Keep a CHANGELOG.md with at least one `## [v0.1.0] - <date>` style entry while shipping.',
  },
  // ---- Community (15)
  {
    id: 'comm.license', cat: 'community', weight: 3, title: 'License declared',
    fn: (c) => (c.licenseSpdx && c.licenseSpdx !== 'Other') || c.needs('LICENSE') || c.needs('LICENCE') ? pass(c.licenseSpdx || 'License file present') : fail('No license detected'),
    // licenseSpdx set by context via meta.license.spdx_id plus needs() for file presence.
    fixText: 'Add a LICENSE file (or license field) so GitHub can publish the license attribution for the repo.',
  },
  {
    id: 'comm.permissive', cat: 'community', weight: 2, title: 'Permissive license family',
    fn: (c) => {
      const spdx = c.licenseSpdx || '';
      if (/^(Apache|MIT|BSD|ISC|MPL|Unlicense|MIT-0)/i.test(spdx)) return pass(spdx);
      if (spdx === 'Other' || !spdx) return info('License family unknown or custom');
      return info(`License: ${spdx}`);
    },
    fixText: 'Prefer a permissive SPDX license (Apache-2.0, MIT, BSD, ISC, MPL-2.0). Custom licenses reduce adoption.',
  },
  {
    id: 'comm.contributing', cat: 'community', weight: 2, title: 'CONTRIBUTING guide',
    fn: (c) => c.needs('CONTRIBUTING.md') || c.needs('.github/CONTRIBUTING.md') ? pass('Found CONTRIBUTING.md') : fail('No CONTRIBUTING.md (root or .github)'),
    fixText: 'Create CONTRIBUTING.md describing how to propose changes: tests to run, code style, PR naming.',
  },
  {
    id: 'comm.code-of-conduct', cat: 'community', weight: 2, title: 'Code of Conduct',
    fn: (c) => c.needs('CODE_OF_CONDUCT.md') || c.needs('.github/CODE_OF_CONDUCT.md') ? pass('Found') : warn('No Code of Conduct'),
    fixText: 'Add CODE_OF_CONDUCT.md (root or .github) so contributors know the expected behavior.',
  },
  {
    id: 'comm.support', cat: 'community', weight: 2, title: 'Support channels',
    fn: (c) => c.needs('SUPPORT.md') || c.needs('.github/SUPPORT.md') ? pass('SUPPORT.md present') : warn('No SUPPORT.md'),
    fixText: 'Document where people get help: SUPPORT.md (root or .github), an issue tracker link, or a discussion category.',
  },
  {
    id: 'comm.issue-templates', cat: 'community', weight: 2, title: 'Issue templates',
    fn: (c) => c.issueTemplates.length > 0 ? pass(`${c.issueTemplates.length} template files`) : warn('No .github/ISSUE_TEMPLATE'),
    fixText: 'Add .github/ISSUE_TEMPLATE forms (bug + feature) so the first issues you receive arrive structured.',
  },
  {
    id: 'comm.pr-template', cat: 'community', weight: 2, title: 'Pull Request template',
    fn: (c) => c.prTemplate ? pass('Found') : warn('No PULL_REQUEST_TEMPLATE'),
    fixText: 'Add a PULL_REQUEST_TEMPLATE.md that asks for what changed and how to test it.',
  },
  // ---- Engineering (25)
  {
    id: 'eng.tests', cat: 'engineering', weight: 8, title: 'Tests exist',
    fn: (c) => (c.testFiles.length >= 1 ? pass(`${c.testFiles.length} test file(s)`) : warn('No test files detected')),
    fixText: 'Keep at least one automated test (files with .test/.spec, tests/ or __tests__ folder) before announcing.',
  },
  {
    id: 'eng.ci', cat: 'engineering', weight: 5, title: 'CI runs tests',
    fn: (c) => c.workflows.length > 0 ? pass(`${c.workflows.length} workflow(s)`) : fail('No .github/workflows/ CI config'),
    fixText: 'Add .github/workflows/ci.yml that runs your test suite on every push and pull request.',
  },
  {
    id: 'eng.test-script', cat: 'engineering', weight: 3, title: 'One-command tests', skipIf: (c) => !c.pkg,
    fn: (c) => (c.pkg?.scripts && c.pkg.scripts.test) ? pass(`\`npm test\` works in package.json`) : fail('package.json has no scripts.test'),
    fixText: 'In package.json set scripts.test so anyone (and CI) can run the suite with one command.',
  },
  {
    id: 'eng.engines', cat: 'engineering', weight: 2, title: 'Toolchain declared', skipIf: (c) => !c.pkg,
    fn: (c) => (c.pkg?.engines?.node) ? pass(`node ${c.pkg.engines.node}`) : warn('package.json has no engines.node'),
    fixText: 'Declare engines (Node version, Python, etc.) so users know exactly what you support.',
  },
  {
    id: 'eng.gitignore', cat: 'engineering', weight: 2, title: '.gitignore present',
    fn: (c) => c.needs('.gitignore') ? pass('Found') : warn('No .gitignore'),
    fixText: 'Add .gitignore so built files and temp artifacts stay out of the commit history.',
  },
  {
    id: 'eng.zero-deps', cat: 'engineering', weight: 3, title: 'Zero runtime deps', skipIf: (c) => !c.pkg,
    fn: (c) => {
      const deps = Object.keys(c.pkg?.dependencies || {}).length;
      if (!deps) return pass('No runtime dependencies');
      return warn(`${deps} runtime dependency(ies)`);
    },
    fixText: 'Try shipping without runtime dependencies; smaller attack surface and faster install. If you need them, say why in the README.',
  },
  {
    id: 'eng.lockfile', cat: 'engineering', weight: 2, skipIf: (c) => !c.pkg, title: 'Dependencies pinned',
    fn: (c) => {
      const any = c.paths.some(p => /\.(lock)$/i.test(p)) || c.paths.some(p => /package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|cargo\.lock|poetry\.lock/i.test(p));
      if (any) return pass('Lockfile committed');
      return warn('No lockfile: builds for this package.json will not be reproducible');
    },
    fixText: 'Commit package-lock.json (or yarn.lock / pnpm-lock.yaml / Cargo.lock) so builds stay reproducible.',
  },
  {
    id: 'eng.pkg-wellformed', cat: 'engineering', weight: 2, title: 'package.json basics complete', skipIf: (c) => !c.pkg,
    fn: (c) => {
      const p = c.pkg;
      const ok = ['name', 'version', 'description', 'license'].filter(k => p[k]).length;
      return ok >= 4 ? pass('name/version/description/license present') : warn(`Only ${ok}/4 core fields present`);
    },
    fixText: 'Fill in package.json: name, version, description, license, repository so registries and agents read you properly.',
  },
  // ---- Discoverability (15)
  {
    id: 'disc.description', cat: 'discoverability', weight: 5, title: 'Repo description',
    fn: (c) => {
      const d = (c.meta.description || '').trim();
      if (!d) return fail('No description set');
      if (d.length < 15) return warn(`Description is short (${d.length} chars)`);
      return pass(d.length > 90 ? `${d.length} chars - long but searchable` : d);
    },
    fixText: 'Set a one-line description on GitHub between 15 and 90 characters; it is what search and social cards show.',
  },
  {
    id: 'disc.topics', cat: 'discoverability', weight: 3, title: 'At least 3 topics',
    fn: (c) => {
      const n = ((c.meta.topics || []).length);
      if (!n) return warn('No topics set');
      if (n >= 3) return pass(`${n} topics`);
      return warn(`Only ${n} topic(s)`);
    },
    fixText: 'Add at least 3 topics (Settings -> General) so the repo appears in topic search and topic pages.',
  },
  {
    id: 'disc.homepage', cat: 'discoverability', weight: 3, title: 'Homepage link set',
    fn: (c) => (c.meta.homepage) ? pass(c.meta.homepage) : warn('No homepage URL'),
    fixText: 'Set the GitHub repo homepage (e.g., your docs or demo) in the About sidebar.',
  },
  {
    id: 'disc.active', cat: 'discoverability', weight: 4, title: 'Recent activity (<= 90 days)', skipIf: (c) => !c.meta?.pushed_at,
    fn: (c) => {
      const days = daysSince(c.meta.pushed_at);
      if (days <= 90) return pass(`last push ${days} day(s) ago`);
      return warn(`last push ${days} days ago`);
    },
    fixText: 'Before announcing, ship something small (fix, docs, tag) so the repo does not read as abandoned.',
  },
  // ---- Release (10)
  {
    id: 'rel.releases', cat: 'release', weight: 4, title: 'At least one GitHub release',
    fn: (c) => (c.releases.length > 0 ? pass(`${c.releases.length} release(s)`) : fail('No releases - nobody can point at a stable version')),
    fixText: 'Tag a version and publish a GitHub Release so people can see where stability lives.',
  },
  {
    id: 'rel.notes', cat: 'release', weight: 3, skipIf: (c) => c.releases.length === 0, title: 'Release notes readable',
    fn: (c) => {
      const latest = c.releases[0];
      const body = (latest.body || '').trim();
      const name = (latest.name || '').trim();
      if (!body && !name) return warn('Latest release has no notes');
      if (body.length < 30) return warn('Release notes are very short');
      return pass('Notes explain what changed');
    },
    fixText: 'Write short, plain notes on your latest release: what changed and how to update.',
  },
  {
    id: 'rel.version-match', cat: 'release', weight: 3, skipIf: (c) => !c.pkg || c.releases.length === 0, title: 'Tag matches package.json',
    fn: (c) => {
      const tag = (c.releases[0]?.tag_name || '').replace(/^v/i, '');
      const pver = `${c.pkg.version ?? ''}`;
      if (!tag) return info('Latest release has no tag');
      if (!pver) return info('package.json has no version');
      if (tag === pver) return pass(`${c.pkg.version} == tag ${c.releases[0].tag_name}`);
      return warn(`package.json ${pver} vs release tag ${c.releases[0].tag_name}`);
    },
    fixText: 'Re-sync your latest release tag with package.json version (npm version trick or a manual rerun) so package installs match your announced release.',
  },
  // ---- Agent (15)
  {
    id: 'agent.instructions', cat: 'agent', weight: 6, title: 'AGENTS.md present',
    fn: (c) => (c.needs('AGENTS.md') ? pass('Found AGENTS.md') : warn('No AGENTS.md for agents')),
    fixText: 'Add AGENTS.md telling coding agents the rules of this repo: layout, commands, verification steps, license.',
  },
  {
    id: 'agent.skills', cat: 'agent', weight: 3, title: 'Installable agent skill',
    fn: (c) => (c.skills.length > 0 ? pass(`${c.skills.length} SKILL.md`) : warn('No skills/*/SKILL.md')),
    fixText: 'Package an agent skill (skills/<name>/SKILL.md) so tools can install it with one command (npx skills add owner/repo).',
  },
  {
    id: 'agent.mcp', cat: 'agent', weight: 3, title: 'MCP or manifest released',
    fn: (c) => (c.mcpFiles.length > 0 ? pass(`${c.mcpFiles.length} MCP artifact(s)` ) : warn('No MCP server/manifest detected')),
    fixText: 'Expose your tool to agents: an MCP server, a .well-known/mcp.json manifest, or a README section explaining agent usage.',
  },
  {
    id: 'agent.llms', cat: 'agent', weight: 3, title: 'llms.txt published',
    fn: (c) => (c.needs('llms.txt') ? pass('Found llms.txt') : warn('No llms.txt')),
    fixText: 'Publish an llms.txt in repo describing the project in machine-readable bullet form for agents and crawlers.',
  },
];

function pass(detail) { return { status: 'pass', detail: detail ?? 'OK' }; }
function warn(detail) { return { status: 'warn', detail: detail ?? 'partial' }; }
function fail(detail) { return { status: 'fail', detail: detail ?? 'missing' }; }
function info(detail) { return { status: 'info', detail: detail ?? '' }; }

function daysSince(iso) {
  const t = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(t / 86400000));
}

export function runChecks(ctx) {
  const results = [];
  for (const ck of CHECKS) {
    if (ck.skipIf && ck.skipIf(ctx)) {
      results.push({ id: ck.id, title: ck.title, category: ck.cat, weight: ck.weight, status: 'skip', detail: 'n/a for this repo' });
      continue;
    }
    let r;
    try {
      r = ck.fn(ctx);
    } catch (e) {
      r = { status: 'error', detail: e && e.message ? e.message : String(e) };
    }
    results.push({ id: ck.id, title: ck.title, category: ck.cat, weight: ck.weight, ...r });
  }
  return results;
}
