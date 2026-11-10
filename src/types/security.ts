export interface SystemPromptTemplate {
  id: string;
  name: string;
  provider: 'Anthropic' | 'OpenAI' | 'Cursor' | 'Cognition' | 'Perplexity' | 'xAI';
  modelOrProduct: string;
  description: string;
  systemPrompt: string;
  sourceLeakDate: string;
  keyDirectives: string[];
  safetyRules: string[];
}

export interface SecurityFinding {
  id: string;
  category: 'LLM01_PROMPT_INJECTION' | 'LLM02_INSECURE_OUTPUT' | 'LLM06_SENSITIVE_INFO' | 'LLM07_SYSTEM_PROMPT_LEAK' | 'LLM10_UNBOUNDED_CONSUMPTION' | 'GATEWAY_HEADERS' | 'VIRTUAL_KEY_ENTROPY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'PASSED';
  title: string;
  description: string;
  remediation: string;
  testedSurface: string;
  evidence?: string;
  status: 'verified_safe' | 'mitigated' | 'action_needed';
}

export interface StrixScanReport {
  id: string;
  timestamp: number;
  durationMs: number;
  targetGateway: string;
  overallScore: number; // 0 - 100
  passedChecks: number;
  totalChecks: number;
  findings: SecurityFinding[];
  testedPayloadsCount: number;
}

export interface CloudflareAuditPhase {
  phase: number;
  name: string;
  status: 'pending' | 'running' | 'completed';
  summary: string;
  itemsChecked: number;
}

export interface HyperswitchPaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'wallet' | 'bank_transfer';
  processor: 'Stripe' | 'Razorpay' | 'Adyen' | 'PayPal';
  feePercentage: number;
  recommendedReason?: string;
}

export interface HyperswitchTransaction {
  id: string; // pay_hyper_...
  amountUSD: number;
  virtualKeyId: string;
  virtualKeyName: string;
  processor: 'Stripe' | 'Razorpay' | 'Adyen' | 'PayPal';
  status: 'succeeded' | 'processing' | 'failed';
  feeSavedUSD: number;
  timestamp: number;
  paymentMethod: string;
}
