const rateLimit = require('express-rate-limit');
const app = require('express').Router();
const { isConfigured, getProvider, getSupportedProviders } = require('../utils/ai');
const { extractFromUrl, extractFromWikipedia, extractFromPdf } = require('../utils/ai/extract');
const { generateUuid } = require('../utils/random');
const { requireAuth } = require('../middleware/auth');
const { getConfig } = require('../utils/file');
const fs = require('fs');
const path = require('path');

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 10,
    message: { message: "Too many requests. Please try again later." }
});

const extractLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 15,
    message: { message: "Too many requests. Please try again later." }
});

app.get('/status', (req, res) => {
    res.json({
        available: isConfigured(),
        providers: getSupportedProviders()
    });
});

// --- Flow loader (loads ai-flows/*.json from project root) ---
const flowsDir = path.join(process.cwd(), 'ai-flows');
function loadFlowsFromDir(dir) {
    const result = {};
    try {
        if (!fs.existsSync(dir)) return result;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
        for (const f of files) {
            try {
                const full = path.join(dir, f);
                const j = JSON.parse(fs.readFileSync(full, 'utf8'));
                const name = j.flow_name || path.basename(f, '.json');
                result[name] = Object.assign({ _file: f, _path: full }, j);
            } catch (e) {
                console.warn('Failed to load flow', f, e.message);
            }
        }
    } catch (e) {
        console.warn('Flow loader error', e.message);
    }
    return result;
}
let flows = loadFlowsFromDir(flowsDir);

// Simple in-memory job queue for async generation jobs (development only)
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
            const provider = getProvider();
            if (!provider) throw new Error('No AI provider available');
            const result = await provider.generateOnce ? provider.generateOnce(job.params) : (async () => {
                // fallback: accumulate stream
                let acc = '';
                const stream = provider.generateStream(job.params);
                for await (const chunk of stream) acc += chunk;
                return { raw: acc };
            })();
            job.status = 'done';
            job.result = result;
        } catch (err) {
            job.status = 'failed';
            job.error = String(err);
        }
    }
    workerRunning = false;
}

// Expose available flows
app.get('/flows', (req, res) => {
    // reload on each request in dev so flows updates are picked up
    flows = loadFlowsFromDir(flowsDir);
    return res.json({ flows: Object.keys(flows) });
});

// Run a named flow (improved runner: templating + basic node types)
app.post('/run-flow', requireAuth, async (req, res) => {
    if (!isConfigured()) return res.status(503).json({ message: 'AI is not configured.' });
    const { flowName, params } = req.body || {};
    if (!flowName) return res.status(400).json({ message: 'flowName is required' });
    const flow = flows[flowName];
    if (!flow) return res.status(404).json({ message: 'flow not found' });

    const provider = getProvider();
    if (!provider) return res.status(503).json({ message: 'AI provider not available.' });

    // SSE streaming response
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    const sendEvent = (evt) => res.write(`data: ${JSON.stringify(evt)}\n\n`);

    // Minimal template renderer for {{var}} and nested paths like {{user.name}}
    const renderTemplate = (template, ctx) => {
        if (typeof template !== 'string') return template;
        return template.replace(/{{\s*([^}]+)\s*}}/g, (_, pathExpr) => {
            const parts = pathExpr.split('.').map(p => p.trim());
            let v = ctx;
            for (const p of parts) {
                if (v == null) return '';
                v = v[p];
            }
            return (v === undefined || v === null) ? '' : String(v);
        });
    };

    // Execute nodes sequentially, passing a shared context object
    const context = Object.assign({}, params || {});

    try {
        for (const node of flow.nodes || []) {
            // input node: merge given params (optional)
            if (node.type === 'input') {
                if (node.name) context[node.name] = Object.assign({}, context[node.name] || {}, params || {});
                continue;
            }

            // llm node: render template to prompt and call provider
            if (node.type === 'llm' || node.type === 'generate_quiz') {
                const tpl = node.template || '';
                const prompt = renderTemplate(tpl, context);
                sendEvent({ type: 'node_start', node: node.name || node.id, kind: 'llm' });

                // prefer streaming if provider supports it
                if (provider.generateStream) {
                    let acc = '';
                    for await (const chunk of provider.generateStream(Object.assign({}, context, { prompt }))) {
                        acc += chunk;
                        sendEvent({ type: 'node_chunk', node: node.name || node.id, chunk });
                    }
                    context[node.name || 'result'] = acc;
                    sendEvent({ type: 'node_done', node: node.name || node.id, result: acc });
                } else if (provider.generateOnce) {
                    const out = await provider.generateOnce(Object.assign({}, context, { prompt }));
                    context[node.name || 'result'] = out;
                    sendEvent({ type: 'node_done', node: node.name || node.id, result: out });
                } else {
                    throw new Error('Provider has no generateStream/generateOnce');
                }
                continue;
            }

            // http node: supports simple GET/POST with templated url/body
            if (node.type === 'http') {
                const method = (node.method || 'GET').toUpperCase();
                const url = renderTemplate(node.url || '', context);
                const headers = Object.assign({}, node.headers || {});
                let body = null;
                if (node.body) body = renderTemplate(node.body, context);

                sendEvent({ type: 'node_start', node: node.name || node.id, kind: 'http', url });
                try {
                    const fetchOpts = { method, headers };
                    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                        fetchOpts.body = body;
                    }
                    const resp = await fetch(url, fetchOpts);
                    const contentType = resp.headers.get('content-type') || '';
                    let data;
                    if (contentType.includes('application/json')) data = await resp.json(); else data = await resp.text();
                    context[node.name || 'http_result'] = data;
                    sendEvent({ type: 'node_done', node: node.name || node.id, result: data });
                } catch (err) {
                    sendEvent({ type: 'node_error', node: node.name || node.id, message: err.message });
                    throw err;
                }
                continue;
            }

            // transform node: simple mapping from context keys
            if (node.type === 'transform') {
                // node.map: { "outKey": "{{in.key}}" }
                const map = node.map || {};
                const out = {};
                for (const k of Object.keys(map)) {
                    out[k] = renderTemplate(map[k], context);
                }
                context[node.name || 'transform'] = out;
                sendEvent({ type: 'node_done', node: node.name || node.id, result: out });
                continue;
            }

            // output node: emit current context or specific field
            if (node.type === 'output') {
                const field = node.field || null;
                const payload = field ? (context[field] || null) : context;
                sendEvent({ type: 'output', node: node.name || node.id, data: payload });
                // do not end: let flow continue but commonly output is last
                continue;
            }

            // unknown node types: warn
            sendEvent({ type: 'node_skip', node: node.name || node.id, message: 'unknown node type: ' + node.type });
        }

        sendEvent({ type: 'done', context });
    } catch (err) {
        console.error('flow runner error', err);
        sendEvent({ type: 'error', message: err.message || 'Flow execution failed.' });
    }

    res.end();
});

// Enqueue a generation job (returns job id) — uses in-memory queue
app.post('/enqueue', requireAuth, async (req, res) => {
    if (!isConfigured()) return res.status(503).json({ message: 'AI is not configured.' });
    const params = req.body || {};
    const id = String(jobCounter++);
    const job = { id, status: 'queued', params, createdAt: new Date().toISOString() };
    jobs.set(id, job);
    queue.push(id);
    workerLoop().catch(e => console.error('worker error', e));
    return res.json({ jobId: id });
});

app.get('/jobs/:id', requireAuth, (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) return res.status(404).json({ message: 'job not found' });
    return res.json(job);
});

const fetchQuestionImage = async (questionTitle) => {
    const config = getConfig();
    const accessKey = config?.media?.unsplashAccessKey;
    if (!accessKey) return null;

    try {
        const query = questionTitle.replace(/[?!.,"']/g, '').substring(0, 80);
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Client-ID ${accessKey}` },
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) return null;

        const data = await response.json();
        const photo = data.results?.[0];
        if (!photo?.urls?.regular) return null;

        const imgResponse = await fetch(photo.urls.regular, {
            signal: AbortSignal.timeout(8000)
        });
        if (!imgResponse.ok) return null;

        const buffer = await imgResponse.arrayBuffer();
        const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
        const base64 = `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;

        return base64;
    } catch {
        return null;
    }
};

app.post('/extract', requireAuth, extractLimiter, async (req, res) => {
    if (!isConfigured()) {
        return res.status(503).json({ message: "AI is not configured." });
    }

    const { type, url, query, lang, pdfBase64 } = req.body || {};
    if (!type || !['url', 'wikipedia', 'pdf'].includes(type)) {
            return res.status(400).json({ message: "Unknown extraction type." });
    }

    try {
        let result;
        if (type === 'url') {
                    if (!url || typeof url !== 'string') return res.status(400).json({ message: "URL is required." });
            result = await extractFromUrl(url);
        } else if (type === 'wikipedia') {
                    if (!query || typeof query !== 'string') return res.status(400).json({ message: "Search query is required." });
                    result = await extractFromWikipedia(query, lang || 'en');
        } else {
                    if (!pdfBase64 || typeof pdfBase64 !== 'string') return res.status(400).json({ message: "PDF data missing." });
            result = await extractFromPdf(pdfBase64);
        }
        return res.json({
            title: result.title || '',
            source: result.source || '',
            text: result.text,
            length: result.text.length
        });
    } catch (error) {
        return res.status(400).json({ message: error.message || "Extraction failed." });
    }
});

const generateMetadataOnce = async (provider, options) => {
    let fullText = '';
    const stream = provider.generateStream({ ...options, mode: 'metadata' });
    for await (const chunk of stream) {
        fullText += chunk;
    }
    const cleaned = fullText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    try {
        const obj = JSON.parse(cleaned.slice(start, end + 1));
        return {
            title: typeof obj.title === 'string' ? obj.title.trim().slice(0, 60) : '',
            description: typeof obj.description === 'string' ? obj.description.trim().slice(0, 300) : ''
        };
    } catch {
        return null;
    }
};

const extractQuestionsFromText = (fullText) => {
    const questions = [];
    try {
        const cleaned = fullText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) return parsed;
    } catch {}

    const cleaned = fullText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    let depth = 0;
    let start = -1;

    for (let i = 0; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (ch === '{' && depth === 0) {
            start = i;
            depth = 1;
        } else if (ch === '{') {
            depth++;
        } else if (ch === '}') {
            depth--;
            if (depth === 0 && start !== -1) {
                try {
                    const obj = JSON.parse(cleaned.slice(start, i + 1));
                    if (obj.title && obj.type && obj.answers) questions.push(obj);
                } catch {}
                start = -1;
            }
        }
    }
    return questions;
};

const validateGenerateRequest = (body) => {
    const { topic, questionCount, context, difficulty } = body;
    const hasTopic = typeof topic === 'string' && topic.trim().length >= 2;
    const hasContext = typeof context === 'string' && context.trim().length >= 50;

    if (!hasTopic && !hasContext) return { error: "A topic or context is required." };
        if (hasTopic && topic.trim().length > 400) return { error: "Topic must be at most 400 characters." };
        if (hasContext && context.length > 80000) return { error: "Context is too large." };
    if (questionCount !== undefined && (typeof questionCount !== 'number' || questionCount < 1 || questionCount > 50)) {
            return { error: "questionCount must be between 1 and 50." };
    }
    if (difficulty !== undefined && difficulty !== null && !['none', 'easy', 'medium', 'hard'].includes(difficulty)) {
            return { error: "Invalid difficulty." };
    }
    return { hasTopic, hasContext };
};

app.post('/generate', requireAuth, limiter, async (req, res) => {
    if (!isConfigured()) return res.status(503).json({ message: "AI is not configured." });

    const body = req.body || {};
    const { topic, questionCount, context, difficulty, generateMetadata } = body;
    const validation = validateGenerateRequest(body);
    if (validation.error) return res.status(400).json({ message: validation.error });

    const provider = getProvider();
    if (!provider) return res.status(503).json({ message: "AI provider not available." });

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    const effectiveTopic = validation.hasTopic ? topic.trim() : 'Quiz from provided source text';
    const effectiveContext = validation.hasContext ? context : undefined;
    const effectiveDifficulty = difficulty && difficulty !== 'none' ? difficulty : undefined;

    const sendEvent = (evt) => res.write(`data: ${JSON.stringify(evt)}\n\n`);

    let fullText = '';
    let sentQuestions = 0;
    const imagePromises = [];

    const sendQuestion = (question) => {
        question.uuid = generateUuid();
        const imageQuery = question.imageQuery;
        delete question.imageQuery;
        sendEvent({ type: 'question', data: question });

        const uuid = question.uuid;
        imagePromises.push(
            fetchQuestionImage(imageQuery || question.title).then(b64 => {
                if (b64) sendEvent({ type: 'image', uuid, b64_image: b64 });
            }).catch(() => {})
        );
    };

    try {
        if (generateMetadata) {
            sendEvent({ type: 'status', stage: 'metadata' });
            try {
                const meta = await generateMetadataOnce(provider, { topic: effectiveTopic, context: effectiveContext });
                if (meta && (meta.title || meta.description)) {
                    sendEvent({ type: 'metadata', data: meta });
                }
            } catch (e) {
                console.warn('Metadata generation failed:', e.message);
            }
        }

        sendEvent({ type: 'status', stage: 'questions' });

        const stream = provider.generateStream({
            topic: effectiveTopic,
            questionCount,
            context: effectiveContext,
            difficulty: effectiveDifficulty
        });

        for await (const chunk of stream) {
            fullText += chunk;
            const questions = extractQuestionsFromText(fullText);
            while (sentQuestions < questions.length) {
                sendQuestion(questions[sentQuestions]);
                sentQuestions++;
            }
        }

        const finalQuestions = extractQuestionsFromText(fullText);
        while (sentQuestions < finalQuestions.length) {
            sendQuestion(finalQuestions[sentQuestions]);
            sentQuestions++;
        }

        await Promise.allSettled(imagePromises);
        sendEvent({ type: 'done', total: sentQuestions });
    } catch (error) {
        console.error('AI generation error:', error);
        sendEvent({ type: 'error', message: error.message || 'Error during generation.' });
    }

    res.end();
});

module.exports = app;
