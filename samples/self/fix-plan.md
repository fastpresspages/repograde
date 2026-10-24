# RepoGrade fix plan — fastpresspages/repograde

Grade: **B+ 84/100** (Almost there) — scan 2026-10-24

1. [FAIL] **At least one GitHub release** — Tag a version and publish a GitHub release.
   _Evidence: No releases - nobody can point at a stable version_

2. [FAIL] **Changelog with version entries** — Create/open CHANGELOG.md and record the current release under a version heading.
   _Evidence: No CHANGELOG.md_

3. [WARN] **Installable agent skill** — Package an agent skill at skills/<name>/SKILL.md.
   _Evidence: No skills/*/SKILL.md_

4. [WARN] **Dependencies pinned** — Commit a lockfile for reproducible installs.
   _Evidence: No lockfile: builds for this package.json will not be reproducible_

Run me again after fixes: `npx repograde owner/repo`.