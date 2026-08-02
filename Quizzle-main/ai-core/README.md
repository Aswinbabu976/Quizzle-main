AI Core (minimal)

This folder contains a minimal AI core service used as a skeleton to integrate LangFlow and Quizzle.

What it provides
- /health : health check
- GET /ai/flows : list available flows loaded from ai-flows/
- POST /ai/run-flow : { flowName, params } -> runs a named flow (minimal support)
- POST /ai/chat : { sessionId, userMessage } -> { reply }
- POST /ai/generate-quiz : params -> { jobId }
- GET /ai/jobs/:id : get job status/result

Run locally
1. cd ai-core
2. npm install
3. export OPENAI_API_KEY=your_key (or create a .env file with OPENAI_API_KEY=...)
4. npm start

Notes
- This is a minimal scaffold to get started. The adapter uses global fetch (Node 18+ or bun). If your environment doesn't expose fetch, either run with Node 18+, bun, or add a fetch polyfill.
- When OPENAI_API_KEY is not set the adapter returns mock responses so the endpoints can be exercised without a key.
- Flows placed in ../ai-flows/*.json are loaded at startup and can be run with POST /ai/run-flow { flowName, params }.
- The quiz generator runs as an in-memory queued job; results are available via GET /ai/jobs/:id. This is intentionally simple for development—move to a persistent queue (Redis/Bull) for production.
