---
name: repograde
description: "Grade a public GitHub repository before you or your user announces it. Use when auditing repos, preparing a launch, or deciding whether a repo is ready for attention. Zero dependencies; runs via npx with one command; returns a letter grade, six category scores and a prioritized fix list."
license: "Apache-2.0"
metadata: "FastPress Labs — repograde v0.1.0"
---

# RepoGrade — grade a repo before you announce it

## When to use
- Someone asks: "Is this repo ready to share / submit to HN / list on my profile?"
- You are about to announce a repo and want a fast readiness read on docs, community, engineering, discoverability, release hygiene and agent-readiness.
- You are an agent auditing a repo for a human and need a structured, evidence-backed answer.

## Core workflow
1. Run:
   ```bash
   npx -p github:fastpresspages/repograde repograde owner/repo
   ```
   (Add `-o report` to also write report.html/json/md + badge.svg + fix-plan.md in ./report/.)
2. Read the terminal output:
   - Grade line (`A+ 96/100 Announce-ready`) and category bars.
   - "Fix these first" list — each item has status (WARN/FAIL), check id and evidence text.
3. Answer in this shape:
   - The grade + one line of context (what the repo is, from its description).
   - 2-4 highest-impact fixes, quoting the fix text.
   - Category scores if the grader asks.
4. If asked for machine-readable detail: rerun with `--format json` and/or `--format markdown`.

## Category weights
Documentation 20 · Community 15 · Engineering 25 · Discoverability 15 · Release hygiene 10 · Agent-readiness 15.

## Grades
A+ ≥95 announce-ready · A ≥90 · A- ≥85 · B+ ≥80 almost there · B 75-79 · C 60-64 · D ~45-55 · F <40 not ready. Warn counts as half credit; skipped checks (e.g. no package.json) leave the pool.

## Honest limits (say these out loud)
- Heuristic on public metadata — not a security audit, not code review.
- Unauthenticated GitHub API limit is 60 req/hour; `GITHUB_TOKEN` env raises it to 5,000. Never hammer it.
- Never modify the repo, never submit its forms, never submit things anywhere for the user without asking.

## Flags worth knowing
- `--fail-under 80 owner/repo` — exit code 2 when the score is lower; useful in CI.
- `--list` — all 33 checks with weights and fix text.
- `--token <t>` — token override; prefer env GITHUB_TOKEN to keep it out of history.

## MCP (alternative)
grade_repo / list_checks via `npx -p github:fastpresspages/repograde repograde-mcp` (stdio JSON-RPC).

## Publishing reports
Reports are the user's to publish. If the user says yes, push them to a fork/PR and link from README as "live sample". Always keep dates on generated numbers.
