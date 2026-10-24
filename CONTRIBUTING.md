# Contributing

Thanks for wanting to make repo launching better for everyone.

## Quick facts
- Zero dependencies target: Node stdlib only. No runtime packages, no native modules.
- Node >= 18.17. Tests run with the built-in runner (`node --test`).
- Everything scans public GitHub data; nothing here should talk to anything else.

## Before you start
- Bugs/ideas: open an issue (templates: bug.yml / check.yml). Reproducible data wins.
- Security: do **not** report vulnerabilities publicly; see SECURITY.md for private disclosure.
- For a new check, propose the id + weight in an issue first if it changes scoring —
  it is easier to agree on the number before the code.

## Check contract
Every check lives in `src/checks.js` with:
1. A unique `id` (`category.short-name`).
2. A `cat`, `weight` and `title` (imperative, under 60 chars if you can).
3. A pure `fn(ctx)` using only the shaped context (see src/context.js `shapeContext`).
4. `skipIf` for conditions that legitimately do not apply (e.g. no package.json).
5. A `fixText` a human could act on without reading any thread.
6. At least one test in `test/repograde.test.js` using fixtures, and, if new
   context data is needed, shaping that lives in `shapeContext` (stateless).

## Scoring / report rules
- Weighted scoring is influenced in src/score.js — warn counts half.
- The report renders in 4 flavors; if a check emits `skip`/`info`, leave the
  denominator untouched rather than hacking renderers.
- JSON output must stay additive: see CHANGELOG version-compat note.

## Pull requests
- Small, single-purpose PRs are best. Include which check/behavior changed.
- CI runs the test suite on Node 18/20/22 on Linux and Windows.
- Release: tag vX.Y.Z (annotated), publish a release with notes, then `npm publish`
  from the maintainer account only once npm auth exists.

## Licensing
By contributing, you agree your contributions are licensed Apache-2.0 (same as the project).
