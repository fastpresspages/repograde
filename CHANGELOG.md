# Changelog

All notable changes to RepoGrade are documented here.
Format: semver. Additive changes land in minor/patch releases; breaking changes need a major.

Compatibility: the JSON report shape (tool/version/generatedAt/repo/grade/score)
is additive-friendly; breaking changes require a major bump note here.

## [v0.1.0] - 2026-10-24

First public release of RepoGrade.

- 🎯 asks: two-faced users forgotten launch readiness — from docs to discoverability.
- ⚙️ 33 checks · 6 weighted categories (docs 20, community 15, engineering 25,
  discoverability 15, release hygiene 10, agent-readiness 15).
- 🪓 Fix: priorized fix list (top 7 highest-impact actions), each with evidence
  and a fix text a tired human can act on.
- 🧾 Reports: terminal, --json, --md, --html, plus badge.svg + fix-plan.md via `-o`.
- 🤖 Agent ship-its: MCP server (stdio, `grade_repo` + `list_checks`),
  GitHub Action (`fastpresspages/repograde@main`), and an installable skill
  (`npx skills add fastpresspages/repograde`).
- 🔍 Reads public GitHub metadata only; no writes, no telemetry; 60 req/hour
  unauthenticated, 5,000/h with GITHUB_TOKEN.
- 🪙 zero runtime dependencies; Node >= 18.17; Apache-2.0.
