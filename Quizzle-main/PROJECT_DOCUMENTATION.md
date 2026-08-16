Senior IT Project — Quizzle

1. Introduction

1. Idea / Motivation

Quizzle is an AI-assisted quiz and learning platform that enables teachers to create quizzes and students to engage in interactive learning sessions. The system integrates AI components to support quiz generation and learning recommendations.

2. Product Vision

Provide an easy-to-use, multi-language quiz platform with AI-powered generation and analytics so instructors can quickly produce high-quality quizzes and students receive personalized learning guidance.

3. Persona, Scenarios, User Stories, Features

Personas (see README for more detail):
- Student Learner (takes quizzes, views results)
- Teacher / Instructor (creates and manages quizzes)
- Competitive Quiz User (joins live quizzes, compares scores)

Example user stories:
- As a teacher I want to create and publish a quiz so that students can practice.
- As a student I want to join a live quiz via code so that I can participate.

Features (implemented / partial):
- Interactive quiz system (frontend / backend)
- AI-assisted features via ai-core (OpenAI adapter)
- Langflow UI included in deployment (for flow authoring)
- Multi-language UI (i18n) — English and German

4. Link to GitHub repo

Repository: https://github.com/Aswinbabu976/Quizzle-main


2. Software Development method

1. Scrum
- Team used iterative development. (Document retrospective/sprint notes separately if needed.)

2. Sprint
- Suggested: one-day final sprint for presentation: finish docs, deployment steps, checklist demo.

3. Software Architecture

1. Services (from docker-compose.yml):
- web: React frontend served from Node container
- ai-core: Minimal AI backend for chat and flow execution (uses OpenAI via environment variable OPENAI_API_KEY)
- langflow: Langflow UI (image: langflowai/langflow)
- postgres: Postgres for Langflow
- portainer: optional container manager UI

2. Backend Endpoints (API)
- server/routes includes: auth.js, admin.js, quizzes.js, practice.js, media.js, ai.js, branding.js
- Authentication endpoints: POST /setup, POST /login, GET /me, POST /logout
- AI endpoints exist under server/routes/ai.js (bridges to ai-core / OpenAI)

3. Langflow
- Included as a service in docker-compose.yml and configured with a Postgres DB and volume (langflow-data).
- Langflow is exposed via a DuckDNS subdomain in docker-compose labels (langflow.quizzleaba.duckdns.org).

4. Authentication and Authorization
- Custom cookie-based token system implemented in server/utils/auth.js (file-backed users.json and in-memory sessions). No Keycloak integration present.

5. Langfuse
- No evidence of Langfuse integration in the codebase. (No references found.)


4. AI Integration

1. Langflow flow(s)
- Langflow is deployed as a container and likely stores flows in the volume mapped to /app/langflow.
- No explicit custom Langflow component code found in repository; flows are expected to be authored through the Langflow UI.

Components:
- ai-core: contains adapters and providers for OpenAI, Google, Anthropic, Ollama (see server/utils/ai/)
- OpenAI integration: ai-core/adapters/openai.js and server/utils/ai/openai.js include calls to OpenAI APIs.

2. Prompt handling
- Prompts are defined/handled within ai-core and server utils. No Langfuse prompt-store integration detected.

3. AI model
- OpenAI provider configured; provider options are referenced in server validations and admin UI (OpenAI listed in Admin.jsx).

2. RAG / MCP / API
- No vector DB or RAG pipeline detected (no pinecone/weaviate/milvus references). If RAG is required, vector DB and indexing pipelines need to be added.

3. Chatbot frontend to flow connection
- Frontend communicates to backend (ai-core) and Langflow is available on internal network. The frontend sets LANGFLOW_API_URL (see docker-compose.yml) for integration.


5. Deployment

1. VPS / setup
- Docker-compose-based deployment is provided (docker-compose.yml at repo root). docker-compose defines caddy labels pointing at DuckDNS hostnames.
- VPS provider (Contabo) is mentioned in project notes but no provider-specific scripts provided. Steps to deploy to VPS: clone, transfer .env, run docker-compose up -d, configure Caddy (see labels), setup DuckDNS token on the host / Caddy.

2. Caddy / domain
- docker-compose uses Caddy reverse-proxy via labels and DuckDNS hostnames in labels (e.g. quizzleaba.duckdns.org). A Caddy service is expected to be running on the host (external network caddy).

3. Webhook, CI/CD pipeline
- GitHub Actions present:
  - .github/workflows/docker-deploy.yml — builds and pushes Docker image to Docker Hub on pushes to main
  - .github/workflows/docs.yml — builds and deploys landing page to GitHub Pages

4. Portainer, WireGuard
- Portainer is included as a container in docker-compose and proxied via caddy (portainer.quizzleaba.duckdns.org).
- WireGuard not present in repo; optional VPN setup must be done separately.


6. Testing

1. Prompt optimization
- No automated tests or prompt-optimization scripts found. Manual testing recommended for AI prompts and user flows.


7. Conclusion

1. What has been developed
- Full-stack quiz platform with frontend, backend API, AI core (OpenAI adapter) and Langflow included for flow authoring. Docker-compose provided for local and VPS deployment. GitHub Actions for building/pushing images and landing page deployment.

2. Limitations
- No Keycloak / external auth provider — uses simple file-based users and in-memory sessions.
- No Langfuse integration (prompt observability/versioning) detected.
- No RAG/vector DB present — retrieval augmented generation not implemented.
- Missing production deployment documentation (Caddy, DuckDNS credentials, .env example, firewall rules for Contabo VPS).
- No automated tests or CI for full integration tests.

3. Future work
- Add Langfuse for prompt tracking and metrics.
- Integrate Keycloak or OAuth for enterprise auth (if required).
- Implement a vector DB (Pinecone / Weaviate / Milvus) and RAG pipeline for context-aware generation.
- Add .env.example, deployment script, and a Caddyfile template and instructions for DuckDNS.
- Add end-to-end tests and prompt evaluation harness.


Appendix — Quick dev / demo notes (for presentation):
- Start local dev: cd webui && npm install && npm run dev
- Start full stack with docker-compose (requires Docker): docker-compose up -d
- Required environment variables for ai-core and Langflow: OPENAI_API_KEY, LANGFLOW_SECRET_KEY, etc. See ai-core and .env templates.
- Demo endpoints (local): web at http://localhost:6412 (port depends on Docker host mapping), ai-core at port 4000, langflow at 7860


TODO items (urgent before presentation):
- Create .env.example with all required env vars and placeholders (OPENAI_API_KEY, LANGFLOW_SECRET_KEY)
- Add step-by-step VPS deployment notes (ssh, firewall, Docker, Caddy with DuckDNS token)
- Document how to create initial admin user (setup endpoint) and sample users.json
- Add brief slide with architecture diagram and demo steps


Contact / Maintainers
- Aswin Babu (lead)
- Repo: https://github.com/Aswinbabu976/Quizzle-main
