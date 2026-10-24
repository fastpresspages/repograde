# ▲ RepoGrade

**Grade your repo before you announce it.** 33 checks across 6 categories on any
public GitHub repository — in one command, in ~15 seconds, with zero dependencies.

[![CI](https://github.com/fastpresspages/repograde/actions/workflows/ci.yml/badge.svg)](https://github.com/fastpresspages/repograde/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-green.svg)](LICENSE)
![Node >=18.17](https://img.shields.io/badge/node-%3E%3D18.17-3DDC84)
![Zero dependencies](https://img.shields.io/badge/runtime%20deps-0-C6FF4A)
![Checks](https://img.shields.io/badge/checks-33-A78BFA)
![Sample](https://img.shields.io/badge/launchgrade%20repo-A%2B%2096%2F100-3DDC84)

Part of [FastPress Labs](https://github.com/fastpresspages) — small, free, open
source tools for people who ship. Sister project: [LaunchGrade](https://github.com/fastpresspages/launchgrade)
audits the **landing page**; RepoGrade audits **everything behind the link**.

## Install

```bash
npx -p github:fastpresspages/repograde repograde owner/repo
```

An `npm publish` is planned once publishing credentials exist; the GitHub install
path above works **today** with zero install footprint.

```bash
repograde owner/repo          # grade any public repo
repograde owner/repo -o report   # + report.html/json/md, badge.svg, fix-plan.md
repograde --list              # all 33 checks, grouped
repograde --fail-under 80 owner/repo   # CI gate (exit 2 when under)
```

## What it grades

| Category | Weight | Highlights |
| --- | --- | --- |
| Documentation | 20 | README that explains the repo in 15s, install command, usage example, real changelog |
| Community | 15 | LICENSE (permissive preferred), CONTRIBUTING, Code of Conduct, SUPPORT, issue/PR templates |
| Engineering | 25 | Tests exist and CI runs them, declared toolchain, lockfile, zero-dep gentle flag |
| Discoverability | 15 | Description (15–90 chars), ≥3 topics, homepage link, activity within 90 days |
| Release hygiene | 10 | Tagged release, readable notes, tag matches package.json |
| Agent-readiness | 15 | AGENTS.md, installable skill, MCP/lang manifest, llms.txt |

Every check is a pure function over the shaped repo context (see `src/checks.js`)
— the whole scan is deterministic and fixable in PR-sized chunks.

## Real example (not marketing)

`fastpresspages/launchgrade` scanned on 24 October 2026 (v0.1.0):

```
┌──────────────────────────────────────────────┐
│  A+   96/100   Announce-ready                │
└──────────────────────────────────────────────┘
  28 pass · 3 warn · 0 fail

  Documentation     100  ████████████████████
  Community         100  ████████████████████
  Engineering        96  ███████████████████░
  Discoverability   100  ████████████████████
  Release hygiene    85  █████████████████░░░
  Agent-readiness    90  ██████████████████░░

Fix these first
 1. WARN [Release] Tag matches package.json
      package.json 0.3.0 vs release tag v0.1.0
 2. WARN [Agent] llms.txt published
      No llms.txt at the repo root
 3. WARN [Eng] Dependencies pinned
      No lockfile ...
```

Full artifacts for that scan and a lower-grade example live in `samples/`
(launchgrade → **A+ 96**, fastpress-start → **B 79**, same day, honest numbers).
Low grades get published too — that is the point.

## Reports & artifacts

| Artifact | What it is |
| --- | --- |
| terminal output | colored grade card, per-category bars, top fixes |
| `report.html` | standalone dark report (works offline, shareable) |
| `report.md` | drop into a README or PR |
| `report.json` | machine-readable; `tool/version/generatedAt/repo/grade/...` |
| `badge.svg` | repograde badge for your README |
| `fix-plan.md` | prioritized fixes with evidence, ready to work through |

## GitHub Action

```yaml
name: RepoGrade
on:
  schedule: [{ cron: "0 8 * * 1" }]
  workflow_dispatch:
jobs:
  grade:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: fastpresspages/repograde@main
        with:
          fail-under: '75'
        env:
          GITHUB_TOKEN: ${{ github.token }}   # 5,000 req/h instead of 60
```

Outputs `score` and `grade`; add `--fail-under` semantics via `fail-under`.

## MCP server (agents can grade repos too)

```json
{ "mcpServers": { "repograde": {
    "command": "npx",
    "args": ["-p", "github:fastpresspages/repograde", "repograde-mcp"] } } }
```

Tools: `grade_repo` (owner/repo → grade + category scores + fixes), `list_checks`.

> MCP check-only rule for agents: batch sanely; the unauthenticated GitHub API
> allows 60 requests/hour and we respect that limit.

## Agent skill

```bash
npx skills add fastpresspages/repograde
```

## Scoring

- Each category score = share of its weight earned (pass=100%, warn=50%, fail=0%).
- Overall = weighted mean over scored categories; skip/info checks leave the pool.
- Letter grades: A+ ≥95 · A ≥90 · A- ≥85 · B+ ≥80 … F <40.
- It is an **heuristic about readiness to be announced**, not a security audit and
  not a code review (see SECURITY.md and terms).

## Free human review

Open a discussion with your repo + what you are stuck on, drop your repo at
[the site form](https://fastpresspages.github.io/repograde/#contact), or email
[meetcode99@gmail.com](mailto:meetcode99@gmail.com): we rerun the scan, read the
repo **and** reply with the three changes that matter most — free, no drip
campaign. Deeper help (fix sprints, launch builds) exists and is transparently
priced in the [FastPress Labs playbook](https://github.com/fastpresspages/outreach).

## Principles

1. Zero dependencies — Node stdlib only.
2. Public data only — never writes to your repo, never uploads anything.
3. Publish low grades too.
4. Fix text a tired human can act on.
5. No fake metrics: downloads, stars, testimonials — all hand-countable or absent.

## Contributing / security / license

- [CONTRIBUTING.md](CONTRIBUTING.md) (check contract, PRs)
- [SECURITY.md](SECURITY.md) (private disclosure)
- [SUPPORT.md](SUPPORT.md) · [Code of Conduct](CODE_OF_CONDUCT.md)
- Apache-2.0 — see [LICENSE](LICENSE)

Built by [FastPress Labs](https://github.com/fastpresspages) — see our
[org profile](https://github.com/fastpresspages/.github) for everything we ship.
