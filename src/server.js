import http from 'node:http';
import { loadConfig } from './config.js';
import { createBundledPlan } from './agent.js';
import { listTemplates } from './templates.js';
import { summarizeHealth } from './logger.js';

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
}

function sendHtml(res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Purvi Indies Agent</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif; margin: 2rem; background: #0e1020; color: #f7f7fb; }
    main { max-width: 920px; margin: auto; }
    textarea, select, button { width: 100%; margin-top: .75rem; padding: .8rem; border-radius: .75rem; border: 1px solid #3d4168; background: #171a32; color: #fff; }
    button { background: #7c3aed; border: 0; font-weight: 700; cursor: pointer; }
    pre { white-space: pre-wrap; background: #080914; padding: 1rem; border-radius: .75rem; overflow: auto; }
    .card { border: 1px solid #2d3158; border-radius: 1rem; padding: 1rem; margin-top: 1rem; background: #12152b; }
  </style>
</head>
<body>
<main>
  <h1>Purvi Indies Agent</h1>
  <p>Bundle a whole task into one model-planning credit, then execute locally from your terminal or Mac helpers.</p>
  <div class="card">
    <label>Task</label>
    <textarea id="task" rows="7" placeholder="Build my app feature, inspect files, run tests, and summarize changes..."></textarea>
    <label>Template</label>
    <select id="template"><option>code</option><option>app</option><option>mac</option><option>business</option></select>
    <label><input id="dry" type="checkbox" checked /> Dry run / offline plan</label>
    <button onclick="runTask()">Create bundled plan</button>
  </div>
  <h2>Output</h2>
  <pre id="out">Ready.</pre>
</main>
<script>
async function runTask() {
  const out = document.getElementById('out');
  out.textContent = 'Planning...';
  const response = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: document.getElementById('task').value,
      template: document.getElementById('template').value,
      dryRun: document.getElementById('dry').checked
    })
  });
  out.textContent = JSON.stringify(await response.json(), null, 2);
}
</script>
</body>
</html>`);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/') return sendHtml(res);
    if (req.method === 'GET' && url.pathname === '/api/templates') return sendJson(res, 200, listTemplates());
    if (req.method === 'GET' && url.pathname === '/api/health') return sendJson(res, 200, await summarizeHealth());
    if (req.method === 'POST' && url.pathname === '/api/run') {
      const body = await readBody(req);
      const config = await loadConfig();
      const result = await createBundledPlan({
        task: body.task,
        model: body.model || config.model,
        template: body.template || 'code',
        dryRun: Boolean(body.dryRun)
      });
      return sendJson(res, 200, result);
    }
    return sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
});

const port = Number(process.env.PORT || 4737);
server.listen(port, () => {
  console.log(`Purvi Indies Agent running at http://localhost:${port}`);
});
