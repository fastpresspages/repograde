# AGENTS.md — fastpresspages/repograde

RepoGrade: grade a public GitHub repo before you announce it. Zero dependencies.
Rules below bind humans and agents.

Facts (verified 2026-10-24, keep in sync):
- 33 checks / 6 categories (weights: docs 20, community 15, engineering 25,
  discoverability 15, release 10, agent 15).
- Runs on Node >= 18.17. Test suite: node --test (8 tests at time of writing).
- Reads public GitHub metadata only (repo, git tree, README/CHANGELOG/package.json,
  releases). Never writes. Unauthenticated rate limit: 60 req/h; put GITHUB_TOKEN
  in the env for 5,000/h.
- Own dogfood sample (fastpresspages/launchgrade): A+ 96/100 on 24 Oct 2026 —
  see samples/launchgrade/. fastpress-start scored B 79; we publish both.

Layout:
- src/context.js — input parsing + GitHub fetch + shaping (pure, fixture-friendly).
- src/checks.js — CATEGORIES + CHECKS; every check is a pure fn(ctx).
- src/score.js — weighted scoring; src/report.js — renderers; bin/repograde.js — CLI.
- mcp/server.js — stdio MCP server exposing grade_repo + list_checks.
- site/ — GitHub Pages site; deploy via .github/workflows/pages.yml.
- action.yml — composite GitHub Action (input repo, fail_under).

Change rules:
- Every new check needs: id in checks.js, weight, fixText, and a fixture-based
  test in test/repograde.test.js. Builder rule of thumb: if a fix needs a person,
  write the fix text so a person can act on it.
- Keep JSON output shape stable (tool/version/generatedAt/repo/grade/score/...);
  additive changes OK, breaking changes need a major bump note in CHANGELOG.
- No telemetry. No patching user repos. No rate-limit abuse (batch your scans).
- Publish honest numbers; if a sample dips, ship the sample anyway.

Commands:
- node --test
- node bin/repograde.js fastpresspages/repograde   (self dogfood)
- node bin/repograde.js --list
- node mcp/server.js                                (stdio; speak JSON-RPC)

Windows note: prefer `npm.cmd` or plain `node`; npm.ps1 is blocked by policy.
