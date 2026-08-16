// Streaming-capable OpenAI adapter for ai-core
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function callOpenAI(messages, options = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  if (typeof fetch !== 'function') throw new Error('fetch is not available in this runtime. Use Node 18+ or bun, or add a fetch polyfill');

  const body = Object.assign({ model: options.model || 'gpt-3.5-turbo', messages }, options);
  const resp = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OpenAI API error: ${resp.status} ${txt}`);
  }
  const data = await resp.json();
  return data;
}

async function* callOpenAIStream(messages, options = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  if (typeof fetch !== 'function') throw new Error('fetch is not available in this runtime. Use Node 18+ or bun, or add a fetch polyfill');

  const body = Object.assign({ model: options.model || 'gpt-3.5-turbo', messages, stream: true }, options);
  const resp = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OpenAI API error: ${resp.status} ${txt}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch (e) {}
    }
  }
}

module.exports = {
  chat: async ({ sessionId, userMessage }) => {
    if (!process.env.OPENAI_API_KEY) {
      return { text: `Mock reply: received "${userMessage}". Set OPENAI_API_KEY to enable real model.` };
    }
    const messages = [
      { role: 'system', content: 'You are a helpful assistant for Quizzle.' },
      { role: 'user', content: userMessage },
    ];
    const data = await callOpenAI(messages, { max_tokens: 600 });
    const text = data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
    return { text };
  },

  chatStream: async function* ({ sessionId, userMessage, history = [], persona = 'You are a helpful assistant for Quizzle.' }) {
    if (!process.env.OPENAI_API_KEY) {
      yield `Mock reply: received "${userMessage}". Set OPENAI_API_KEY to enable real model.`;
      return;
    }

    const messages = [];
    messages.push({ role: 'system', content: persona });
    if (Array.isArray(history)) {
      for (const h of history) {
        if (h && h.role && h.content) messages.push({ role: h.role, content: h.content });
      }
    }
    messages.push({ role: 'user', content: userMessage });

    for await (const chunk of callOpenAIStream(messages, { max_tokens: 600 })) {
      yield chunk;
    }
  },

  generateQuiz: async (params = {}) => {
    if (!process.env.OPENAI_API_KEY) {
      return {
        quiz: {
          title: `Mock quiz for ${params.topic || 'General'}`,
          questions: [],
        },
        note: 'Set OPENAI_API_KEY to enable real model.',
      };
    }

    const num = parseInt(params.numQuestions || 5, 10) || 5;
    const prompt = `Generate a JSON object with keys title and questions. Title should be a short string. Questions should be an array of ${num} items each with keys: q (string), choices (array of strings), answer (index of correct choice). Topic: ${params.topic || 'General'}. Respond ONLY with valid JSON.`;

    const messages = [{ role: 'system', content: 'You are a quiz generator that outputs strict JSON.' }, { role: 'user', content: prompt }];
    const data = await callOpenAI(messages, { max_tokens: 800 });
    const text = data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
    try {
      const quiz = JSON.parse(text);
      return { quiz };
    } catch (err) {
      return { raw: text, error: 'failed to parse model output as JSON' };
    }
  },
};