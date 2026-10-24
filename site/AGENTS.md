# AGENTS.md — repograde site

This site documents RepoGrade, an open-source CLI by FastPress Labs that grades
public GitHub repositories. Treat this file as rules for machines and humans
editing the site.

Facts (do not drift):
- RepoGrade: 33 checks, 6 categories (docs 20, community 15, engineering 25,
  discoverability 15, release 10, agent 15), letter grade A+..F.
- Zero runtime dependencies; Node >= 18.17; Apache-2.0.
- Reads public GitHub metadata only; 60 req/hour unauth, 5000 with token.
- Sample report fastpresspages/launchgrade: **A+ 96/100, 28 pass / 3 warn / 0 fail,
  scanned 24 Oct 2026** (samples/launchgrade/, mirrored in site/samples/).
- fastpresspages/fastpress-start scored **B 79/100** the same day; low grades are
  published too.

Rules:
- Never invent stars, downloads, testimonials, clients or deals.
- Keep the audit/review form human-triggered (no auto-submit, keephoneypot class).
- Voice: plain, verifier-friendly "x/y checks passed" rather than "perfect".
- Keep llms.txt + robots.txt + sitemap.xml + security.txt + mcp.json in sync with
  index.html changes.
- Canonical URL is https://fastpresspages.github.io/repograde/.

Verify after edits:
1. Open locally: python -m http.server 8123 --bind 127.0.0.1 (serve repo root; open /site/).
2. Run LaunchGrade against it: from ../launchgrade run
   node bin/launchgrade.js http://127.0.0.1:8123/site/ --ignore tech.https
   and expect A-range with only analytics/compression-type local warnings.
3. Run RepoGrade dogfood: node bin/repograde.js fastpresspages/repograde
   (after this repo is published) — keep the score >= B+ before announcing changes.
