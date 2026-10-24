// RepoGrade scoring: same weighted philosophy as LaunchGrade.
// Skipped/info/error excluded from the denominator. pass=1, warn=0.5, fail=0.
import { CATEGORIES } from './checks.js';

export function scoreResults(results) {
  const counts = { pass: 0, warn: 0, fail: 0, error: 0, skip: 0, info: 0 };
  for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;

  const categories = [];
  let weightedSum = 0, weightAvailable = 0;
  for (const cat of CATEGORIES) {
    const mine = results.filter(r => r.category === cat.key);
    const scored = mine.filter(r => r.status !== 'skip' && r.status !== 'info' && r.status !== 'error');
    if (!scored.length) {
      categories.push({ key: cat.key, label: cat.label, weight: cat.weight, score: 0, checks: mine.length, scored: 0 });
      continue;
    }
    let possible = 0, earned = 0;
    for (const r of scored) {
      possible += r.weight;
      earned += r.status === 'pass' ? r.weight : r.status === 'warn' ? r.weight * 0.5 : 0;
    }
    const share = Math.round((earned / possible) * 100);
    categories.push({ key: cat.key, label: cat.label, weight: cat.weight, score: share, checks: mine.length, scored: scored.length });
    weightedSum += cat.weight * (earned / possible);
    weightAvailable += cat.weight;
  }

  const score = Math.round(weightAvailable ? (weightedSum / weightAvailable) * 100 : 0);
  const grade = letterGrade(score);
  const label = gradeLabel(score);
  const color = gradeColor(grade);

  const rankOf = (r) => (r.status === 'fail' || r.status === 'error' ? 2 : 1);
  const impactOf = (r) => {
    const cat = CATEGORIES.find(c => c.key === r.category) || { weight: 0 };
    const grouped = results.filter(x => x.category === r.category && x.status !== 'skip' && x.status !== 'info' && x.status !== 'error');
    const possible = grouped.reduce((s, x) => s + x.weight, 0) || 1;
    return (r.weight / possible) * cat.weight * (r.status === 'warn' ? 0.5 : 1);
  };

  const topFixes = results
    .filter(r => r.status === 'fail' || r.status === 'error' || r.status === 'warn')
    .sort((a, b) => rankOf(b) - rankOf(a) || impactOf(b) - impactOf(a))
    .slice(0, 7)
    .map(r => ({ id: r.id, title: r.title, category: r.category, status: r.status, detail: r.detail, impact: Number(impactOf(r).toFixed(3)) }));

  return { score, grade, label, color, counts, categories, topFixes, results };
}

export function letterGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D+';
  if (score >= 45) return 'D';
  if (score >= 40) return 'D-';
  return 'F';
}

export function gradeLabel(score) {
  if (score >= 90) return 'Announce-ready';
  if (score >= 80) return 'Almost there';
  if (score >= 70) return 'Needs polish';
  if (score >= 55) return 'Risky to announce';
  return 'Not ready';
}

export function gradeColor(grade) {
  const g = String(grade || '');
  if (g.startsWith('A')) return '#3DDC84';
  if (g.startsWith('B')) return '#C6FF4A';
  if (g.startsWith('C')) return '#FFB020';
  if (g.startsWith('D')) return '#FF9E4A';
  return '#FF5C5C';
}

export function compactSummary(scored, repo) {
  return `${repo || 'repo'} — ${scored.grade} ${scored.score}/100 (${scored.label}) · ${scored.counts.pass} pass / ${scored.counts.warn} warn / ${scored.counts.fail} fail`;
}
