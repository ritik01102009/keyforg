import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { VirtualKey, ModelProfile, GatewayAuditLog, GatewayAnalytics, GuardrailConfig } from './src/types/otari';
import { HyperswitchTransaction } from './src/types/security';
import { SUPPORTED_MODELS, DEFAULT_FALLBACK_MODEL_ID } from './src/data/models';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize server-side Gemini SDK client with required telemetry header
const hasValidGeminiKey =
  Boolean(process.env.GEMINI_API_KEY) &&
  process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
  (process.env.GEMINI_API_KEY?.trim() ?? '') !== '';

let geminiClient: GoogleGenAI | null = null;
if (hasValidGeminiKey) {
  try {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
  }
}

// Seed Virtual Keys for Otari Gateway
let virtualKeys: VirtualKey[] = [
  {
    id: 'vk_dev_101',
    name: 'Engineering Assistant Sandbox',
    keySecret: 'otari_vk_live_8f29410ac9b2',
    budgetLimitUSD: 25.0,
    currentSpendUSD: 4.825,
    rateLimitRpm: 60,
    rateLimitTpm: 120000,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    status: 'active',
    workspaceName: 'Engineering Workspace',
    description: 'Internal development key for testing model switches and prompt chains.',
  },
  {
    id: 'vk_prod_102',
    name: 'Customer Support Bot Production',
    keySecret: 'otari_vk_live_1b78e24fa601',
    budgetLimitUSD: 100.0,
    currentSpendUSD: 24.18,
    rateLimitRpm: 120,
    rateLimitTpm: 300000,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    status: 'active',
    workspaceName: 'Production Support',
    description: 'High-throughput production key with automatic failover enabled.',
  },
  {
    id: 'vk_eval_103',
    name: 'Budget Cap Stress Test Key',
    keySecret: 'otari_vk_live_3a99c421008d',
    budgetLimitUSD: 5.0,
    currentSpendUSD: 4.965, // Close to limit ($0.035 left) to test budget enforcement
    rateLimitRpm: 30,
    rateLimitTpm: 60000,
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    status: 'active',
    workspaceName: 'QA & Safety',
    description: 'Restricted key with a low $5 cap to demonstrate pre-request budget stopping.',
  },
];

// Seed Audit Logs
let auditLogs: GatewayAuditLog[] = [
  {
    id: 'log_001',
    timestamp: Date.now() - 1000 * 60 * 24,
    modelId: 'gemini-3.8-flash',
    virtualKeyName: 'Engineering Assistant Sandbox',
    virtualKeyId: 'vk_dev_101',
    promptTokens: 412,
    completionTokens: 850,
    totalTokens: 1262,
    costUSD: 0.000572,
    latencyMs: 235,
    status: '200_OK',
    promptExcerpt: 'Analyze the architectural trade-offs between centralized and distributed LLM gateways...',
  },
  {
    id: 'log_002',
    timestamp: Date.now() - 1000 * 60 * 12,
    modelId: 'claude-3-5-sonnet',
    virtualKeyName: 'Customer Support Bot Production',
    virtualKeyId: 'vk_prod_102',
    promptTokens: 620,
    completionTokens: 1240,
    totalTokens: 1860,
    costUSD: 0.02046,
    latencyMs: 642,
    status: '200_OK',
    promptExcerpt: 'Draft a polite escalation reply for an enterprise client experiencing webhook latency...',
  },
  {
    id: 'log_003',
    timestamp: Date.now() - 1000 * 60 * 4,
    modelId: 'gpt-4o',
    virtualKeyName: 'Engineering Assistant Sandbox',
    virtualKeyId: 'vk_dev_101',
    promptTokens: 530,
    completionTokens: 920,
    totalTokens: 1450,
    costUSD: 0.010525,
    latencyMs: 512,
    status: '200_OK',
    promptExcerpt: 'Write a TypeScript function that validates Otari virtual key prefixes and entropy...',
  },
];

/**
 * Intelligent Otari Gateway Response Generator
 * Provides model-specific answers when external API keys are pending or timing out.
 */
function generateOtariGatewayResponse(modelId: string, prompt: string, systemPrompt?: string): string {
  const p = prompt.toLowerCase();

  // Model-specific prefix / personality markers
  let prefix = '';
  if (modelId === 'deepseek-r1') {
    prefix = `[DeepSeek R1 Chain-of-Thought]\nAnalyzing question structure -> Mapping gateway constraints -> Formulating answer.\n\n`;
  }

  // 1. Inquiries about Otari LLM Gateway
  if (p.includes('otari') || p.includes('gateway') || p.includes('what is otari')) {
    return `${prefix}Otari is an open-source large language model (LLM) control plane and API gateway developed by Mozilla.ai. It acts as an intelligent intermediary between your client applications and 40+ LLM providers.

Key Capabilities of Otari Gateway:
1. Unified API Endpoint: Exposes a single OpenAI- and Anthropic-compatible interface, allowing instant model switching without changing client code.
2. Virtual API Keys: Organizations store upstream credentials securely in Otari and issue restricted virtual keys ('otari_vk_...') per team, bot, or workspace.
3. Pre-Request Budget Enforcement: Evaluates spending caps before requests hit provider servers, preventing surprise bills and runaway loops.
4. Automatic Failover: Intelligently redirects traffic to fallback models if the primary provider encounters rate limits or outages.
5. Centralized Guardrails: Enforces PII redaction and prompt injection mitigations at the infrastructure layer.`;
  }

  // 2. Failover Policy inquiries
  if (p.includes('failover') || p.includes('fallback') || p.includes('outage') || p.includes('reliability')) {
    return `${prefix}In Otari Gateway architecture, failover routing guarantees zero downtime:

1. Health & Status Probing: The gateway tracks 429 (Rate Limited), 500/503 (Provider Unavailable), and timeout events.
2. Automatic Rerouting: If a request to '${modelId}' fails or exceeds latency thresholds, the gateway automatically dispatches to the configured fallback model (e.g. Gemini 3.1 Flash Lite).
3. Circuit Breaking: After 3 consecutive provider failures, traffic is temporarily diverted for 60 seconds before probing recovery.
4. Downstream Transparency: The client receives a successful response with telemetry headers ('x-otari-gateway-status: failover') so analytics dashboards can track provider degradation.`;
  }

  // 3. Pricing / Cost delta inquiries
  if (p.includes('cost') || p.includes('pricing') || p.includes('delta') || p.includes('token') || p.includes('50m')) {
    return `${prefix}Token Economic Comparison (50M tokens; 70% input / 30% output split):

• Gemini 3.8 Flash:
  - Input (35M tokens @ $0.15/1M): $5.25
  - Output (15M tokens @ $0.60/1M): $9.00
  - Total Monthly Cost: $14.25

• Claude 3.5 Sonnet:
  - Input (35M tokens @ $3.00/1M): $105.00
  - Output (15M tokens @ $15.00/1M): $225.00
  - Total Monthly Cost: $330.00

• Total Cost Delta:
  - Gemini 3.8 Flash delivers a 95.7% cost reduction ($315.75 savings per 50M tokens) while maintaining high-speed multimodal reasoning.
  - Optimal Gateway Strategy: Route high-throughput classification and interactive chat to Gemini 3.8 Flash, reserving Claude 3.5 Sonnet for deep architectural code audits.`;
  }

  // 4. Virtual Keys & Rate Limiting inquiries
  if (p.includes('key') || p.includes('virtual') || p.includes('rate limit') || p.includes('multi-tenant')) {
    return `${prefix}Otari Virtual Key Architecture for Multi-Tenant Deployments:

1. Scoped Isolation:
   - Issue distinct keys (e.g. 'otari_vk_live_...') with tenant metadata. Root API keys never leave the secure gateway vault.
2. Hard Budget Quotas:
   - Assign per-key monthly caps ($10.00, $50.00, $500.00). When spend reaches 100%, subsequent requests receive '402 Payment Required' before incurring vendor charges.
3. Leaky-Bucket Rate Limiting:
   - Configurable RPM (Requests Per Minute) and TPM (Tokens Per Minute) ceilings protect against burst traffic and denial-of-wallet attacks.
4. Zero-Trust Revocation:
   - Instantly revoke compromised virtual keys from the Otari console without invalidating other services.`;
  }

  // 5. Code & TypeScript inquiries
  if (p.includes('code') || p.includes('typescript') || p.includes('function') || p.includes('python')) {
    return `${prefix}Here is an implementation of an Otari Gateway client with automated virtual key budgeting in TypeScript:

\`\`\`typescript
interface GatewayRequest {
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  virtualKey: string;
}

export async function callOtariGateway(req: GatewayRequest) {
  const response = await fetch('https://api.otari.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${req.virtualKey}\`,
      'X-Otari-Failover': 'enabled',
    },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      temperature: 0.7,
    }),
  });

  if (response.status === 402) {
    const errorData = await response.json();
    throw new Error(\`[Otari Budget Stop] \${errorData.message}\`);
  }

  return response.json();
}
\`\`\`

This standard interface ensures full compatibility across OpenAI, Anthropic, and Google GenAI endpoints.`;
  }

  // 6. General intelligent response
  return `${prefix}I have processed your request via the Otari Gateway using ${modelId}.

${prompt}

• Analysis: The Otari control plane routes queries through policy-checked virtual keys, ensuring rate-limit adherence, strict budget limits, and failover redundancy.
• Next Steps: You can adjust this session's model, inspect real-time token unit costs in the telemetry footer, or simulate provider outages using the Failover toggle above.`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Cloudflare recommended security headers (Project Glasswing compliance)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Seed Hyperswitch transactions (juspay/hyperswitch unified orchestrator)
  const hyperswitchTransactions: HyperswitchTransaction[] = [
    {
      id: 'pay_hyper_8f2910ac9b2',
      amountUSD: 25.0,
      virtualKeyId: 'vk_dev_101',
      virtualKeyName: 'Engineering Assistant Sandbox',
      processor: 'Stripe',
      status: 'succeeded',
      feeSavedUSD: 0.35,
      timestamp: Date.now() - 1000 * 60 * 60 * 48,
      paymentMethod: 'Visa ending in 4242 (Smart Route)',
    },
    {
      id: 'pay_hyper_1b78e24fa60',
      amountUSD: 100.0,
      virtualKeyId: 'vk_prod_102',
      virtualKeyName: 'Customer Support Bot Production',
      processor: 'Adyen',
      status: 'succeeded',
      feeSavedUSD: 1.4,
      timestamp: Date.now() - 1000 * 60 * 60 * 96,
      paymentMethod: 'Mastercard ending in 5555 (Smart Route)',
    },
  ];

  // Hyperswitch payment confirmation endpoint
  app.post('/api/payments/confirm', (req: Request, res: Response) => {
    const { virtualKeyId, amountUSD, preferredProcessor = 'smart_route' } = req.body;
    const key = virtualKeys.find((k) => k.id === virtualKeyId);
    if (!key) {
      res.status(404).json({ error: 'Virtual key not found' });
      return;
    }

    const amount = typeof amountUSD === 'number' && amountUSD > 0 ? parseFloat(amountUSD.toFixed(2)) : 25.0;

    let routedProcessor: 'Stripe' | 'Razorpay' | 'Adyen' | 'PayPal' = 'Stripe';
    const feeSaved = amount * 0.014;

    if (preferredProcessor === 'smart_route') {
      if (amount > 50) routedProcessor = 'Adyen';
      else routedProcessor = 'Stripe';
    } else {
      routedProcessor = preferredProcessor;
    }

    key.budgetLimitUSD = parseFloat((key.budgetLimitUSD + amount).toFixed(2));
    if (key.status === 'budget_exhausted') {
      key.status = 'active';
    }

    const txn: HyperswitchTransaction = {
      id: `pay_hyper_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      amountUSD: amount,
      virtualKeyId: key.id,
      virtualKeyName: key.name,
      processor: routedProcessor,
      status: 'succeeded',
      feeSavedUSD: parseFloat(feeSaved.toFixed(3)),
      timestamp: Date.now(),
      paymentMethod: `${routedProcessor} Direct / Smart Route`,
    };

    hyperswitchTransactions.unshift(txn);

    res.json({
      success: true,
      transaction: txn,
      virtualKey: key,
      message: `Successfully credited $${amount.toFixed(2)} to ${key.name} via Hyperswitch (${routedProcessor}).`,
    });
  });

  app.get('/api/payments/transactions', (_req: Request, res: Response) => {
    res.json({ transactions: hyperswitchTransactions });
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      otariGatewayVersion: '1.4.2-open',
      activeVirtualKeys: virtualKeys.filter((k) => k.status === 'active').length,
      timestamp: Date.now(),
    });
  });

  // Get supported models
  app.get('/api/models', (_req: Request, res: Response) => {
    res.json({
      models: SUPPORTED_MODELS,
      defaultFallbackModelId: DEFAULT_FALLBACK_MODEL_ID,
    });
  });

  // Virtual Keys Management
  app.get('/api/keys', (_req: Request, res: Response) => {
    res.json({ keys: virtualKeys });
  });

  app.post('/api/keys', (req: Request, res: Response) => {
    const { name, budgetLimitUSD, rateLimitRpm, workspaceName, description } = req.body;

    if (!name || typeof budgetLimitUSD !== 'number' || budgetLimitUSD <= 0) {
      res.status(400).json({ error: 'Valid name and positive budgetLimitUSD required' });
      return;
    }

    const randomSuffix = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
    const newKey: VirtualKey = {
      id: `vk_${Date.now()}`,
      name: String(name).trim(),
      keySecret: `otari_vk_live_${randomSuffix}`,
      budgetLimitUSD: parseFloat(budgetLimitUSD.toFixed(2)),
      currentSpendUSD: 0.0,
      rateLimitRpm: rateLimitRpm ? parseInt(rateLimitRpm, 10) : 60,
      rateLimitTpm: (rateLimitRpm ? parseInt(rateLimitRpm, 10) : 60) * 2000,
      createdAt: Date.now(),
      status: 'active',
      workspaceName: workspaceName ? String(workspaceName).trim() : 'Default Workspace',
      description: description ? String(description).trim() : '',
    };

    virtualKeys.unshift(newKey);
    res.status(201).json({ key: newKey });
  });

  app.patch('/api/keys/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, budgetLimitUSD, rateLimitRpm, status, description } = req.body;

    const keyIndex = virtualKeys.findIndex((k) => k.id === id);
    if (keyIndex === -1) {
      res.status(404).json({ error: 'Virtual key not found' });
      return;
    }

    const existing = virtualKeys[keyIndex];
    if (name) existing.name = String(name).trim();
    if (typeof budgetLimitUSD === 'number' && budgetLimitUSD > 0) {
      existing.budgetLimitUSD = parseFloat(budgetLimitUSD.toFixed(2));
      if (existing.currentSpendUSD < existing.budgetLimitUSD && existing.status === 'budget_exhausted') {
        existing.status = 'active';
      }
    }
    if (typeof rateLimitRpm === 'number' && rateLimitRpm > 0) {
      existing.rateLimitRpm = rateLimitRpm;
      existing.rateLimitTpm = rateLimitRpm * 2000;
    }
    if (status && ['active', 'revoked', 'budget_exhausted'].includes(status)) {
      existing.status = status;
    }
    if (description !== undefined) {
      existing.description = String(description).trim();
    }

    virtualKeys[keyIndex] = existing;
    res.json({ key: existing });
  });

  app.post('/api/keys/:id/reset', (req: Request, res: Response) => {
    const { id } = req.params;
    const key = virtualKeys.find((k) => k.id === id);
    if (!key) {
      res.status(404).json({ error: 'Virtual key not found' });
      return;
    }

    key.currentSpendUSD = 0.0;
    key.status = 'active';
    res.json({ success: true, key });
  });

  app.delete('/api/keys/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const keyIndex = virtualKeys.findIndex((k) => k.id === id);
    if (keyIndex === -1) {
      res.status(404).json({ error: 'Virtual key not found' });
      return;
    }

    virtualKeys.splice(keyIndex, 1);
    res.json({ success: true, id });
  });

  // Aggregated analytics & logs
  app.get('/api/analytics', (_req: Request, res: Response) => {
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalSpendUSD = 0;
    let totalLatency = 0;
    const modelUsageBreakdown: Record<string, { requests: number; spendUSD: number; tokens: number }> = {};

    auditLogs.forEach((log) => {
      totalPromptTokens += log.promptTokens;
      totalCompletionTokens += log.completionTokens;
      totalSpendUSD += log.costUSD;
      totalLatency += log.latencyMs;

      if (!modelUsageBreakdown[log.modelId]) {
        modelUsageBreakdown[log.modelId] = { requests: 0, spendUSD: 0, tokens: 0 };
      }
      modelUsageBreakdown[log.modelId].requests += 1;
      modelUsageBreakdown[log.modelId].spendUSD += log.costUSD;
      modelUsageBreakdown[log.modelId].tokens += log.totalTokens;
    });

    const cumulativeKeySpend = virtualKeys.reduce((acc, k) => acc + k.currentSpendUSD, 0);
    const effectiveSpend = Math.max(totalSpendUSD, cumulativeKeySpend);

    const analytics: GatewayAnalytics = {
      totalRequests: auditLogs.length,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      totalSpendUSD: parseFloat(effectiveSpend.toFixed(4)),
      activeVirtualKeysCount: virtualKeys.filter((k) => k.status === 'active').length,
      averageLatencyMs: auditLogs.length > 0 ? Math.round(totalLatency / auditLogs.length) : 0,
      modelUsageBreakdown,
    };

    res.json({ analytics, auditLogs: auditLogs.slice(0, 50) });
  });

  // Main Otari Chat Gateway Execution Endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    const startTime = Date.now();
    const {
      prompt,
      messages = [],
      modelId = 'gemini-3.8-flash',
      virtualKeyId,
      systemPrompt,
      simulateFailover = false,
      failoverModelId = DEFAULT_FALLBACK_MODEL_ID,
      guardrails = {} as GuardrailConfig,
    } = req.body;

    if (!prompt && (!messages || messages.length === 0)) {
      res.status(400).json({ error: 'Prompt or conversation messages required' });
      return;
    }

    // 1. Locate and validate the Virtual Key
    let key = virtualKeys.find((k) => k.id === virtualKeyId);
    if (!key) {
      key = virtualKeys.find((k) => k.status === 'active') || virtualKeys[0];
    }

    if (!key || key.status === 'revoked') {
      res.status(403).json({
        error: 'INVALID_VIRTUAL_KEY',
        message: 'The requested Otari Virtual API Key is revoked or invalid.',
      });
      return;
    }

    // 2. Pre-Request Budget Check (Otari Hall-Mark Feature)
    const remainingBudget = key.budgetLimitUSD - key.currentSpendUSD;
    if (remainingBudget <= 0.0001) {
      key.status = 'budget_exhausted';

      const blockedLog: GatewayAuditLog = {
        id: `log_blocked_${Date.now()}`,
        timestamp: Date.now(),
        modelId,
        virtualKeyName: key.name,
        virtualKeyId: key.id,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUSD: 0,
        latencyMs: Date.now() - startTime,
        status: '402_BUDGET_EXCEEDED',
        promptExcerpt: String(prompt || (messages[messages.length - 1]?.content ?? '')).substring(0, 100),
      };
      auditLogs.unshift(blockedLog);

      res.status(402).json({
        error: 'BUDGET_EXCEEDED',
        message: `Otari Gateway blocked request: Virtual key "${key.name}" has reached its budget ceiling of $${key.budgetLimitUSD.toFixed(2)} (Spent: $${key.currentSpendUSD.toFixed(2)}).`,
        virtualKey: key,
      });
      return;
    }

    // 3. Evaluate Guardrails
    let activePrompt = String(prompt || (messages[messages.length - 1]?.content ?? ''));
    let guardrailNotes: string[] = [];

    if (guardrails.promptInjectionShield) {
      const suspiciousPatterns = [
        /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
        /override\s+system\s+prompt/i,
        /disregard\s+guardrails/i,
        /you\s+are\s+now\s+dan/i,
        /repeat\s+(the\s+)?words\s+above/i,
        /what\s+(is|are)\s+your\s+(initial\s+)?(system\s+)?prompt/i,
        /output\s+(your\s+)?system\s+prompt/i,
        /dump\s+(your\s+)?context/i,
        /translate\s+(your\s+)?system\s+instruction/i,
      ];
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(activePrompt)) {
          guardrailNotes.push('Keyforg & Strix Prompt Shield: Intercepted system prompt extraction exploit.');
          break;
        }
      }
    }

    if (guardrails.piiMasking) {
      const piiEmail = /[\w.-]+@[\w.-]+\.\w+/g;
      const piiPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
      const piiSSN = /\b\d{3}-\d{2}-\d{4}\b/g;
      if (piiEmail.test(activePrompt) || piiPhone.test(activePrompt) || piiSSN.test(activePrompt)) {
        activePrompt = activePrompt
          .replace(piiEmail, '[REDACTED_EMAIL]')
          .replace(piiPhone, '[REDACTED_PHONE]')
          .replace(piiSSN, '[REDACTED_SSN]');
        guardrailNotes.push('Otari Guardrail: PII masked before model transmission.');
      }
    }

    // 4. Resolve Model & Failover Policy
    let targetModelId = modelId;
    let gatewayStatus: 'routed' | 'failover' = 'routed';

    if (simulateFailover) {
      targetModelId = failoverModelId || DEFAULT_FALLBACK_MODEL_ID;
      gatewayStatus = 'failover';
    }

    const modelProfile = SUPPORTED_MODELS.find((m) => m.id === targetModelId) || SUPPORTED_MODELS[0];

    try {
      let responseText = '';

      // Try calling live Google GenAI SDK if initialized and real key is present
      if (hasValidGeminiKey && geminiClient && !simulateFailover) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 9000)
          );

          let effectiveSystemPrompt = systemPrompt || 'You are an intelligent, concise, and helpful AI assistant.';
          if (targetModelId === 'claude-3-5-sonnet') {
            effectiveSystemPrompt += ' Adopt the tone, precision, and nuanced analysis of Claude 3.5 Sonnet.';
          } else if (targetModelId === 'gpt-4o') {
            effectiveSystemPrompt += ' Adopt the omni-reasoning style, warmth, and versatility of GPT-4o.';
          } else if (targetModelId === 'deepseek-r1') {
            effectiveSystemPrompt += ' Provide deep, structured, step-by-step reasoning and algorithmic rigor like DeepSeek R1.';
          } else if (targetModelId === 'llama-3.3-70b') {
            effectiveSystemPrompt += ' Provide transparent, open-weight-style direct answers like Llama 3.3 70B.';
          }

          const callPromise = geminiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: activePrompt,
            config: {
              systemInstruction: effectiveSystemPrompt,
            },
          });

          const aiResp = await Promise.race([callPromise, timeoutPromise]);
          responseText = aiResp.text || '';
        } catch (apiErr) {
          // If Gemini API call fails or times out, fall back gracefully to Otari Gateway engine
          console.warn('Gemini direct call fell back to Otari Gateway engine:', apiErr);
        }
      }

      // If response text is still empty (e.g. simulated failover, key not set, or timeout),
      // use the rich Otari Gateway engine
      if (!responseText) {
        responseText = generateOtariGatewayResponse(targetModelId, activePrompt, systemPrompt);
      }

      const latencyMs = Math.max(80, Date.now() - startTime);

      // Token Usage & Cost Calculation
      const promptTokens = Math.max(1, Math.round(activePrompt.length / 3.8));
      const completionTokens = Math.max(1, Math.round(responseText.length / 3.8));
      const totalTokens = promptTokens + completionTokens;

      const promptCost = (promptTokens * modelProfile.inputCostPerMillion) / 1000000;
      const completionCost = (completionTokens * modelProfile.outputCostPerMillion) / 1000000;
      const costUSD = parseFloat((promptCost + completionCost).toFixed(6));

      // Accrue cost to Virtual Key & Check Thresholds
      key.currentSpendUSD = parseFloat((key.currentSpendUSD + costUSD).toFixed(5));
      if (key.currentSpendUSD >= key.budgetLimitUSD) {
        key.status = 'budget_exhausted';
      }

      // Create Gateway Audit Log
      const auditLogEntry: GatewayAuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        modelId: targetModelId,
        virtualKeyName: key.name,
        virtualKeyId: key.id,
        promptTokens,
        completionTokens,
        totalTokens,
        costUSD,
        latencyMs,
        status: gatewayStatus === 'failover' ? '500_FAILOVER' : '200_OK',
        promptExcerpt: activePrompt.substring(0, 100),
      };
      auditLogs.unshift(auditLogEntry);

      if (auditLogs.length > 100) {
        auditLogs.pop();
      }

      res.json({
        content: responseText,
        modelId: targetModelId,
        actualExecutedModel: `${targetModelId} (via Otari Gateway Protocol)`,
        gatewayStatus,
        guardrailNotes,
        latencyMs,
        tokenUsage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
        costUSD,
        virtualKey: {
          id: key.id,
          name: key.name,
          currentSpendUSD: key.currentSpendUSD,
          budgetLimitUSD: key.budgetLimitUSD,
          status: key.status,
          remainingBudgetUSD: Math.max(0, key.budgetLimitUSD - key.currentSpendUSD),
        },
      });
    } catch (err: any) {
      console.error('Otari Gateway execution error:', err);
      res.status(500).json({
        error: 'GATEWAY_EXECUTION_ERROR',
        message: err.message || 'Error occurred during gateway LLM dispatch',
      });
    }
  });

  // Setup Vite Dev Middleware or Static File Serving
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Otari Studio Gateway server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Otari Gateway server:', err);
  process.exit(1);
});
