# Keyforg — AI Gateway & Chat Assistant

**Keyforg** is a production-ready, full-stack AI chat assistant and developer control plane built on the **Otari LLM Gateway** protocol. It provides unified multi-model routing, isolated virtual proxy credentials, pre-request budget enforcement, and real-time token cost telemetry.

---

## Features

- **Interactive AI Assistant**: Multi-turn conversational interface with dynamic model switching across **Gemini 3.8 Flash**, **Claude 3.5 Sonnet**, **GPT-4o**, **DeepSeek R1**, and **Llama 3.3 70B**.
- **Otari Virtual API Keys**: Issue scoped proxy keys (`otari_vk_...`) with hard budget caps and rate limits without exposing root provider keys.
- **Pre-Request Budget Enforcement**: Evaluates spending limits prior to provider dispatch, blocking calls with a `402 BUDGET_EXCEEDED` governance response before incurring charges.
- **Automated Failover Policies**: Simulates provider rate limits and seamlessly reroutes requests to fallback models.
- **Centralized Guardrails**: Enterprise PII masking (emails, phone numbers, SSNs) and prompt injection shielding before requests leave the gateway.
- **Telemetry & Audit Logging**: Real-time per-token pricing calculations in USD (`tabular-nums`), latency benchmarks, and high-density audit grids.
- **Responsive Layout**: Designed for 1440px desktop screens and fully responsive on mobile devices with collapsible navigation and touch-optimized controls.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express, Vite Dev Middleware
- **AI Engine**: Google GenAI SDK (`@google/genai` >= 3.0.0), Otari Gateway Protocol
- **Build System**: Vite 8, tsx, esbuild

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment configuration:
```bash
cp .env.example .env
```
Provide your `GEMINI_API_KEY` (injected automatically in Google AI Studio).

### 3. Start Development Server
```bash
npm run dev
```
The server will boot at `http://localhost:3000`.

---

## Production Deployment

### Build the App
```bash
npm run build
```
This generates the optimized production bundle in `dist/`.

### Start Production Server
```bash
npm start
```
The Express server will serve static assets from `dist/` and handle API endpoints under `/api/*`.

---

## API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check and gateway status |
| `/api/models` | `GET` | Catalog of supported models and pricing |
| `/api/keys` | `GET` / `POST` | List and issue new virtual proxy keys |
| `/api/keys/:id` | `PATCH` / `DELETE` | Update limits or revoke virtual keys |
| `/api/keys/:id/reset` | `POST` | Reset current spend to $0.00 |
| `/api/chat` | `POST` | Keyforg chat gateway execution with budget check |
| `/api/analytics` | `GET` | Aggregated spend KPIs and audit logs |

---

## License

Apache-2.0
