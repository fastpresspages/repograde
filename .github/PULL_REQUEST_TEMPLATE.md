# What changed?

**Summary:** one or two sentences.

**Which checks does this touch?** (check ids or `none`)

## How to verify
- [ ] `node --test` passes (all suites)
- [ ] `node bin/repograde.js <some public repo>` behaves correctly
- [ ] No new network calls beyond api.github.com / raw.githubusercontent.com
- [ ] If a number changed (checks count, weights), README, llms.txt, AGENTS.md and the changelog were updated together

## Notes for reviewers
Anything subtle about patch detection, parsing or scoring?
