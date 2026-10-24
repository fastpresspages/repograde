// RepoGrade library surface: gradeRepo is the one-call entry point.
export { VERSION, USER_AGENT, parseRepoInput, buildRepoContext, shapeContext } from './context.js';
export { CATEGORIES, CHECKS, runChecks } from './checks.js';
export { scoreResults, letterGrade, gradeLabel, gradeColor, compactSummary } from './score.js';
export {
  renderTerminal, renderMarkdown, toJson, renderBadge, renderFixPlan, renderHtml, scoreColor,
} from './report.js';

import { buildRepoContext } from './context.js';
import { runChecks } from './checks.js';
import { scoreResults } from './score.js';

export async function gradeRepo(input, { token, timeout } = {}) {
  const ctx = await buildRepoContext(input, { token });
  const results = runChecks(ctx);
  const scored = scoreResults(results);
  return { ctx, results, scored };
}
