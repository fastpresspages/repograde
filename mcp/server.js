// RepoGrade MCP server — zero-dependency stdio JSON-RPC, same contract as LaunchGrade's.
import readline from 'node:readline';

const name = 'repograde';
const version = '0.1.0';

export const INSTRUCTIONS = [
  'RepoGrade grades public GitHub repositories before you announce them.',
  'Call grade_repo with owner/repo (or a github.com URL). It returns a letter grade, category scores, and the highest-impact fixes.',
  'Read-only: it never writes to the repo. Data comes from the public GitHub API; unauthenticated requests are limited to 60/hour, so batch sanely.',
].join(' ');

const TOOL_DEFS = [
  {
    name: 'grade_repo',
    description: 'Grade a public GitHub repository (docs, community, engineering, discoverability, release hygiene, agent-readiness). Input: owner/repo or a GitHub URL.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'owner/repo or full https://github.com/owner/repo URL' },
        format: { type: 'string', enum: ['markdown', 'json'], default: 'markdown' },
        max_fixes: { type: 'integer', minimum: 1, maximum: 20, description: 'Cap the fix list length' },
      },
      required: ['repo'],
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  {
    name: 'list_checks',
    description: 'List all RepoGrade checks grouped by category with weights and fix text.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
  },
];

export async function handleRequest(msg) {
  const { method, id, params } = msg || {};
  const reply = (result) => (id === undefined ? null : { jsonrpc: '2.0', id, result });
  const errReply = (code, message, data) => (id === undefined ? null : { jsonrpc: '2.0', id, error: { code, message, data } });

  if (method === 'initialize') {
    return reply({
      protocolVersion: params?.protocolVersion || '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name, version },
      instructions: INSTRUCTIONS,
    });
  }
  if (typeof method === 'string' && method.startsWith('notifications/')) return null;
  if (method === 'ping') return reply({});
  if (method === 'tools/list') return reply({ tools: TOOL_DEFS });

  if (method === 'tools/call') {
    const toolName = params?.name;
    const args = params?.arguments || {};
    try {
      if (toolName === 'grade_repo') {
        const { gradeRepo } = await import('../src/index.js');
        const { ctx, scored } = await gradeRepo(args.repo, {});
        let text;
        let meta = {};
        if (args.format === 'json') {
          text = JSON.stringify(scored, null, 2);
        } else {
          const lines = [];
          lines.push(`RepoGrade — ${ctx.input.owner}/${ctx.input.repo}: ${scored.grade} ${scored.score}/100 (${scored.label})`);
          lines.push('');
          for (const cat of scored.categories) lines.push(`- ${cat.label}: ${cat.score}/100 (weight ${cat.weight})`);
          lines.push('');
          lines.push('Fix these first:');
          for (const f of (args.max_fixes ? scored.topFixes.slice(0, args.max_fixes) : scored.topFixes)) {
            lines.push(`1. [${f.status.toUpperCase()}] ${f.title} — ${f.detail || ''}`);
          }
          lines.push('');
          lines.push(`Source: ${ctx.url}. Scan is a heuristic from public metadata, not a code review.`);
          text = lines.join('\n');
          meta = { grade: scored.grade, score: scored.score, url: ctx.url };
        }
        return reply({ content: [{ type: 'text', text }], isError: false, ...(Object.keys(meta).length ? { _meta: meta } : {}) });
      }
      if (toolName === 'list_checks') {
        const { CATEGORIES, CHECKS } = await import('../src/checks.js');
        const chunks = [`RepoGrade ships ${CHECKS.length} checks across ${CATEGORIES.length} categories.`];
        for (const c of CATEGORIES) {
          chunks.push(`\n${c.label} (weight ${c.weight})`);
          for (const ck of CHECKS.filter(x => x.cat === c.key)) chunks.push(`- [w${ck.weight}] ${ck.id} — ${ck.title}\n  fix: ${ck.fixText}`);
        }
        return reply({ content: [{ type: 'text', text: chunks.join('\n') }], isError: false });
      }
      return errReply(-32602, `Unknown tool: ${toolName}`);
    } catch (e) {
      return reply({ content: [{ type: 'text', text: `RepoGrade could not complete that request: ${e instanceof Error ? e.message : String(e)}` }], isError: true });
    }
  }
  return errReply(-32601, `Method not found: ${method}`);
}

export async function serve() {
  const queue = [];
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  let closed = false;
  rl.on('line', line => {
    const s = line.trim();
    if (!s) return;
    queue.push(s);
  });
  rl.on('close', () => { closed = true; });
  for (;;) {
    const line = queue.shift();
    if (line === undefined) {
      if (closed) break;
      await new Promise(r => setTimeout(r, 15));
      continue;
    }
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    let resp = null;
    try { resp = await handleRequest(msg); } catch (e) {
      if (msg?.id !== undefined) resp = { jsonrpc: '2.0', id: msg.id, error: { code: -32700, message: e?.message || 'server error' } };
    }
    if (resp) process.stdout.write(JSON.stringify(resp) + '\n');
  }
}

const isMain = process.argv[1] && (process.argv[1].endsWith('mcp/server.js') || process.argv[1].endsWith('repograde-mcp'));
if (isMain) serve();
