# RepoGrade fix plan — fastpresspages/fastpress-start

Grade: **B 79/100** (Needs polish) — scan 2026-10-24

1. [FAIL] **Changelog with version entries** — Create/open CHANGELOG.md and record the current release under a version heading.
   _Evidence: No CHANGELOG.md_

2. [FAIL] **CONTRIBUTING guide** — Add CONTRIBUTING.md describing setup, tests and PR norms.
   _Evidence: No CONTRIBUTING.md (root or .github)_

3. [WARN] **Tests exist** — Add a first automated test.
   _Evidence: No test files detected_

4. [WARN] **Usage example** — Add a "Usage" section with the happy path, copy-pasteable.
   _Evidence: No usage/quick-start section heading_

5. [WARN] **Installable agent skill** — Package an agent skill at skills/<name>/SKILL.md.
   _Evidence: No skills/*/SKILL.md_

6. [WARN] **MCP or manifest released** — Expose an MCP server or a .well-known/mcp.json manifest.
   _Evidence: No MCP server/manifest detected_

7. [WARN] **Code of Conduct** — Add CODE_OF_CONDUCT.md (Contributor Covenant works).
   _Evidence: No Code of Conduct_

Run me again after fixes: `npx repograde owner/repo`.