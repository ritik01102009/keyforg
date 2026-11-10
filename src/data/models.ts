import { ModelProfile } from '../types/otari';

export const SUPPORTED_MODELS: ModelProfile[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'Google',
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    contextWindow: '1M tokens',
    latencyAvgMs: 240,
    isFallback: false,
    description: 'Next-gen high-speed frontier model with multimodal reasoning and ultra-low latency.',
    recommendedFor: 'Interactive chat, coding assistance, real-time reasoning',
    supportedFeatures: ['Streaming', 'System Instructions', 'Thinking Level', 'JSON Mode']
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: '200K tokens',
    latencyAvgMs: 680,
    isFallback: false,
    description: 'Industry benchmark for nuanced reasoning, software engineering, and visual understanding.',
    recommendedFor: 'Complex architectural design, deep technical writing, code refactoring',
    supportedFeatures: ['Artifacts', 'Tool Use', 'Extended Context']
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: '128K tokens',
    latencyAvgMs: 510,
    isFallback: false,
    description: 'Omni-model pairing broad knowledge with natural conversational flow and tool execution.',
    recommendedFor: 'General enterprise tasks, conversational agents, workflow orchestration',
    supportedFeatures: ['Function Calling', 'Structured Outputs', 'Multimodal']
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    inputCostPerMillion: 0.55,
    outputCostPerMillion: 2.19,
    contextWindow: '64K tokens',
    latencyAvgMs: 890,
    isFallback: false,
    description: 'Open reasoning model specializing in mathematical proofs, algorithmic problem-solving, and logic.',
    recommendedFor: 'Deep step-by-step reasoning, algorithmic audits, mathematical logic',
    supportedFeatures: ['Chain of Thought', 'Code Synthesis', 'Self-Verification']
  },
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    inputCostPerMillion: 0.40,
    outputCostPerMillion: 0.80,
    contextWindow: '128K tokens',
    latencyAvgMs: 310,
    isFallback: false,
    description: 'State-of-the-art open-weight model delivering frontier performance with high throughput.',
    recommendedFor: 'Self-hosted workflows, private deployments, high-throughput text summarization',
    supportedFeatures: ['Open Weights', 'Fast Inference', 'Fine-tuning Ready']
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'Google',
    inputCostPerMillion: 0.075,
    outputCostPerMillion: 0.30,
    contextWindow: '1M tokens',
    latencyAvgMs: 160,
    isFallback: true,
    description: 'Ultra-lightweight budget-optimized fallback model with near-instant time-to-first-token.',
    recommendedFor: 'High-volume classifications, automatic gateway failovers, low-cost screening',
    supportedFeatures: ['Streaming', 'Instant Latency', 'Minimal Thinking']
  }
];

export const DEFAULT_FALLBACK_MODEL_ID = 'gemini-3.1-flash-lite';
