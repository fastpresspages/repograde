# RepoGrade — fastpresspages/repograde
> **B+ · 84/100 · Almost there** — scanned 2026-10-24 with RepoGrade v0.1.0

25 pass · 2 warn · 2 fail · 2 skipped · 0 info

| Category | Score |
| --- | --- |
| Documentation | 80 |
| Community | 100 |
| Engineering | 96 |
| Discoverability | 100 |
| Release hygiene | 0 |
| Agent-readiness | 90 |

## Fix these first
- **At least one GitHub release** (fail · rel.releases) — No releases - nobody can point at a stable version
- **Changelog with version entries** (fail · docs.changelog) — No CHANGELOG.md
- **Installable agent skill** (warn · agent.skills) — No skills/*/SKILL.md
- **Dependencies pinned** (warn · eng.lockfile) — No lockfile: builds for this package.json will not be reproducible

<details>
<summary>All checks</summary>

- ✅ `docs.readme` — README exists — README.md found
- ✅ `docs.readme-quality` — README explains the repo — 6233 characters of guidance
- ✅ `docs.install` — Install command — Install guidance detected
- ✅ `docs.usage` — Usage example — Usage section present
- ❌ `docs.changelog` — Changelog with version entries — No CHANGELOG.md
- ✅ `comm.license` — License declared — Apache-2.0
- ✅ `comm.permissive` — Permissive license family — Apache-2.0
- ✅ `comm.contributing` — CONTRIBUTING guide — Found CONTRIBUTING.md
- ✅ `comm.code-of-conduct` — Code of Conduct — Found
- ✅ `comm.support` — Support channels — SUPPORT.md present
- ✅ `comm.issue-templates` — Issue templates — 3 template files
- ✅ `comm.pr-template` — Pull Request template — Found
- ✅ `eng.tests` — Tests exist — 1 test file(s)
- ✅ `eng.ci` — CI runs tests — 2 workflow(s)
- ✅ `eng.test-script` — One-command tests — `npm test` works in package.json
- ✅ `eng.engines` — Toolchain declared — node &gt;=18.17
- ✅ `eng.gitignore` — .gitignore present — Found
- ✅ `eng.zero-deps` — Zero runtime deps — No runtime dependencies
- ⚠️ `eng.lockfile` — Dependencies pinned — No lockfile: builds for this package.json will not be reproducible
- ✅ `eng.pkg-wellformed` — package.json basics complete — name/version/description/license present
- ✅ `disc.description` — Repo description — 131 chars - long but searchable
- ✅ `disc.topics` — At least 3 topics — 9 topics
- ✅ `disc.homepage` — Homepage link set — https://fastpresspages.github.io/repograde/
- ✅ `disc.active` — Recent activity (&lt;= 90 days) — last push 0 day(s) ago
- ❌ `rel.releases` — At least one GitHub release — No releases - nobody can point at a stable version
- ⏭️ `rel.notes` — Release notes readable — n/a for this repo
- ⏭️ `rel.version-match` — Tag matches package.json — n/a for this repo
- ✅ `agent.instructions` — AGENTS.md present — Found AGENTS.md
- ⚠️ `agent.skills` — Installable agent skill — No skills/*/SKILL.md
- ✅ `agent.mcp` — MCP or manifest released — 2 MCP artifact(s)
- ✅ `agent.llms` — llms.txt published — Found llms.txt

</details>

Source: https://github.com/fastpresspages/repograde