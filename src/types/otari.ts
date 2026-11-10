export interface VirtualKey {
  id: string;
  name: string;
  keySecret: string; // e.g. otari_vk_7f8a9b...
  budgetLimitUSD: number;
  currentSpendUSD: number;
  rateLimitRpm: number;
  rateLimitTpm: number;
  createdAt: number;
  status: 'active' | 'revoked' | 'budget_exhausted';
  workspaceName: string;
  description?: string;
}

export interface ModelProfile {
  id: string;
  name: string;
  provider: 'Google' | 'Anthropic' | 'OpenAI' | 'Meta' | 'DeepSeek' | 'Mistral';
  providerLogo?: string;
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  contextWindow: string;
  latencyAvgMs: number;
  isFallback: boolean;
  description: string;
  recommendedFor: string;
  supportedFeatures: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUSD: number;
  latencyMs: number;
  virtualKeyId?: string;
  gatewayStatus: 'routed' | 'failover' | 'blocked_budget' | 'cached';
  errorDetails?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  systemPrompt: string;
  activeModelId: string;
  virtualKeyId: string;
  createdAt: number;
  updatedAt: number;
}

export interface GuardrailConfig {
  piiMasking: boolean;
  promptInjectionShield: boolean;
  contentModeration: boolean;
  budgetHardStop: boolean;
  enforceMaxTokens: number;
}

export interface GatewayConfig {
  endpointUrl: string;
  selectedVirtualKeyId: string;
  failoverModelId: string;
  enableFailover: boolean;
  simulateFailover: boolean;
  timeoutMs: number;
}

export interface GatewayAuditLog {
  id: string;
  timestamp: number;
  modelId: string;
  virtualKeyName: string;
  virtualKeyId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUSD: number;
  latencyMs: number;
  status: '200_OK' | '402_BUDGET_EXCEEDED' | '429_RATE_LIMITED' | '500_FAILOVER';
  promptExcerpt: string;
}

export interface GatewayAnalytics {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalSpendUSD: number;
  activeVirtualKeysCount: number;
  averageLatencyMs: number;
  modelUsageBreakdown: Record<string, { requests: number; spendUSD: number; tokens: number }>;
}
