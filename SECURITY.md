# Security Policy

## Supported versions

| Version       | Supported |
| ------------- | --------- |
| v0.x (latest) | ✅        |

## Reporting a vulnerability

Do **not** open a public issue for a vulnerability.

1. Preferred: [private vulnerability reporting](https://github.com/fastpresspages/repograde/security/advisories/new) on GitHub.
2. Or email [meetcode99@gmail.com](mailto:meetcode99@gmail.com) with the subject line starting **"RepoGrade security"**.

Include: affected version (`repograde --version`), steps to reproduce, and your assessment. We aim to respond within 48 hours.

## Scope

In scope:
- Anything that lets RepoGrade damage a user machine or a target repos beyond reading
- Anything that leaks GITHUB_TOKEN or other secrets out of the process
- Anything that lets a crafted repo payload escape the scanning context (script injection into reports, path traversal in `-o`, etc.)
- Denial-of-service via pathological repo payloads (giant trees, crafted URLs)

Out of scope:
- Reports about the **audited** repos being insecure (audit reports are opinions about metadata, not penetration testing)
- The [UI hosted here](https://fastpresspages.github.io/repograde/) (static page with no auth)
- GitHub Pages itself / the org anything. Reproduce on GitHub infra → report to GitHub.

## Safe use notes

- RepoGrade reads public metadata only, but set a **scoped** token (public_repo or none) rather than a full token if you can, and never commit tokens.
- Reports are generated locally; if you publish a `report.html` under your own domain, review it first — it embeds repo-supplied text (README, description) and is escape-coded, but a fresh eyeball beats an assumption.
- Rate limits exist for everyone: keep bulk scans to a sane pace (the tool warns and stops at the limit).
