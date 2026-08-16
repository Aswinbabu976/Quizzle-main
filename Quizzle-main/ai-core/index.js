require('dotenv').config();
const express = require('express');
const bodyParser = require('express').json;
const adapter = require('./adapters/openai_stream');
const { loadFlows } = require('./lib/flowLoader');
const path = require('path');

const app = express();
app.use(bodyParser());

// Load flows from ai-flows directory
const flowsDir = path.join(__dirname, '..', 'ai-flows');
let flows = loadFlows(flowsDir);
console.log('Loaded flows:', Object.keys(flows));

// Simple in-memory job queue for async tasks (quiz generation)
const jobs = new Map();
let jobCounter = 1;
const queue = [];
let workerRunning = false;

async function workerLoop() {
  if (workerRunning) return;
  workerRunning = true;
  while (queue.length) {
    const jobId = queue.shift();
    const job = jobs.get(jobId);
    if (!job) continue;
    try {
      job.status = 'running';
      const result = await adapter.generateQuiz(job.params);
      job.status = 'done';
      job.result = result;
    } catch (err) {
      job.status = 'failed';
      job.error = String(err);
    }
  }
  workerRunning = false;
}

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ai-core' }));

app.get('/ai/flows', (req, res) => {
  return res.json({ flows: Object.keys(flows) });
});

app.post('/ai/run-flow', async (req, res) => {
  const { flowName, params } = req.body || {};
  if (!flowName) return res.status(400).json({ error: 'flowName is required' });
  const flow = flows[flowName];
  if (!flow) return res.status(404).json({ error: 'flow not found' });

  // For this minimal scaffold, only support the simple 'generate_quiz' node type
  const node = flow.nodes && flow.nodes.find(n => n.type === 'llm' || n.type === 'generate_quiz');
  if (!node) return res.status(400).json({ error: 'no LLM node found in flow' });

  try {
    const result = await adapter.generateQuiz(params || {});
    return res.json({ flow: flowName, result });
  } catch (err) {
    console.error('run-flow error', err);
    return res.status(500).json({ error: String(err) });
  }
});

app.post('/ai/chat', async (req, res) => {
  const { sessionId, userMessage, history } = req.body || {};
  if (!userMessage) return res.status(400).json({ error: 'userMessage is required' });

  // Persona: friendly polite teacher
  const persona = "You are Quizzle Bot, a friendly and polite teacher. Answer clearly and encouragingly, explain quiz rules when asked, help create quiz prompts, and keep responses concise and helpful.";

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  const sendEvent = (evt) => res.write(`data: ${JSON.stringify(evt)}\n\n`);

  try {
    // Stream through adapter.chatStream if available
    if (adapter.chatStream) {
      sendEvent({ type: 'status', stage: 'streaming' });
      for await (const chunk of adapter.chatStream({ sessionId, userMessage, history, persona })) {
        sendEvent({ type: 'chunk', chunk });
      }
      sendEvent({ type: 'done' });
      return res.end();
    }

    // Fallback to single-shot
    const result = await adapter.chat({ sessionId, userMessage });
    sendEvent({ type: 'chunk', chunk: result.text || result });
    sendEvent({ type: 'done' });
    return res.end();
  } catch (err) {
    console.error('chat error', err);
    sendEvent({ type: 'error', message: String(err) });
    return res.end();
  }
});

app.post('/ai/generate-quiz', async (req, res) => {
  const params = req.body || {};
  const id = String(jobCounter++);
  const job = { id, status: 'queued', params, createdAt: new Date().toISOString() };
  jobs.set(id, job);
  queue.push(id);
  workerLoop().catch(err => console.error('worker error', err));
  return res.json({ jobId: id });
});

app.get('/ai/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  return res.json(job);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`ai-core listening on ${port}`));
