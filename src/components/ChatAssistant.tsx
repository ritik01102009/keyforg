import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Download,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  ShieldCheck,
  Cpu,
  Layers,
  Zap,
} from 'lucide-react';
import { ChatMessage, ChatSession, VirtualKey, ModelProfile, GuardrailConfig } from '../types/otari';

interface ChatAssistantProps {
  models: ModelProfile[];
  virtualKeys: VirtualKey[];
  activeVirtualKeyId: string;
  onSelectVirtualKeyId: (id: string) => void;
  onRefreshData: () => void;
  guardrails: GuardrailConfig;
}

const PRESET_PERSONAS = [
  {
    id: 'general',
    name: 'General Assistant',
    description: 'Concise, versatile multi-domain helper.',
    systemPrompt: 'You are an intelligent, concise, and helpful AI assistant.',
  },
  {
    id: 'architect',
    name: 'Software Architect',
    description: 'API design, system patterns, and clean code.',
    systemPrompt:
      'You are a senior software architect specializing in distributed systems, LLM gateways, and robust API design. Provide clean, production-grade solutions with clear trade-off analyses.',
  },
  {
    id: 'analyst',
    name: 'Quant & Token Analyst',
    description: 'Unit economics, latency, and throughput metrics.',
    systemPrompt:
      'You are an AI infrastructure economist. You analyze inference unit economics, token cost models, rate limits, and latency optimization across LLM providers.',
  },
  {
    id: 'security',
    name: 'Gateway Security Auditor',
    description: 'Guardrails, PII masking, and prompt injection.',
    systemPrompt:
      'You are an AI security auditor specializing in prompt injection defenses, PII detection, OWASP Top 10 for LLMs, and enterprise gateway policies.',
  },
];

const PROMPT_SUGGESTIONS = [
  'Architect an LLM gateway failover policy across Google and Anthropic endpoints.',
  'Calculate the monthly cost delta between Gemini 3.8 Flash and Claude 3.5 Sonnet for 50M tokens.',
  'Draft an Otari virtual key rate-limiting strategy for multi-tenant SaaS clients.',
  'How do pre-request budget checks prevent billing spikes in enterprise AI deployments?',
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  models,
  virtualKeys,
  activeVirtualKeyId,
  onSelectVirtualKeyId,
  onRefreshData,
  guardrails,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg_welcome',
      role: 'assistant',
      content:
        'Hello! I am your Keyforg Assistant, powered by the Otari LLM Gateway. I can route requests dynamically across frontier models (Gemini 3.8 Flash, Claude 3.5 Sonnet, GPT-4o, DeepSeek R1, Llama 3.3 70B), track token spend in real-time, and enforce strict pre-request budget controls.\n\nSelect a model and virtual key above, or try one of the prompt suggestions below.',
      timestamp: Date.now(),
      modelId: 'gemini-3.8-flash',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUSD: 0,
      latencyMs: 120,
      gatewayStatus: 'routed',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('gemini-3.8-flash');
  const [selectedPersonaId, setSelectedPersonaId] = useState('general');
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');
  const [simulateFailover, setSimulateFailover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentVirtualKey = virtualKeys.find((k) => k.id === activeVirtualKeyId) || virtualKeys[0];
  const activeModel = models.find((m) => m.id === selectedModelId) || models[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    setErrorBanner(null);
  };

  const handleExportChat = (format: 'markdown' | 'json') => {
    let content = '';
    let mime = 'text/plain';
    let filename = `otari-chat-${Date.now()}`;

    if (format === 'json') {
      content = JSON.stringify(messages, null, 2);
      mime = 'application/json';
      filename += '.json';
    } else {
      content = `# Keyforg AI Chat Export\nDate: ${new Date().toISOString()}\nVirtual Key: ${currentVirtualKey?.name || 'Default'}\n\n`;
      messages.forEach((m) => {
        content += `### ${m.role === 'user' ? 'User' : `Assistant (${m.modelId})`}\n`;
        content += `${m.content}\n\n`;
        if (m.role === 'assistant' && m.totalTokens > 0) {
          content += `*Tokens: ${m.totalTokens} | Cost: $${m.costUSD.toFixed(6)} | Latency: ${m.latencyMs}ms*\n\n`;
        }
      });
      mime = 'text/markdown';
      filename += '.md';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (overridePrompt?: string) => {
    const promptToSend = (overridePrompt || inputPrompt).trim();
    if (!promptToSend || isLoading) return;

    setErrorBanner(null);
    setInputPrompt('');

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: Date.now(),
      modelId: selectedModelId,
      promptTokens: Math.round(promptToSend.length / 4),
      completionTokens: 0,
      totalTokens: Math.round(promptToSend.length / 4),
      costUSD: 0,
      latencyMs: 0,
      gatewayStatus: 'routed',
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    const persona = PRESET_PERSONAS.find((p) => p.id === selectedPersonaId);
    const systemPrompt = customSystemPrompt || persona?.systemPrompt;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          modelId: selectedModelId,
          virtualKeyId: currentVirtualKey?.id,
          systemPrompt,
          simulateFailover,
          guardrails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setErrorBanner(
            `Budget Limit Reached: ${data.message || 'Virtual key has exceeded its allocated spend ceiling.'}`
          );
        } else {
          setErrorBanner(data.message || data.error || 'Gateway returned an error.');
        }

        const errorMessage: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Request halted by Otari Gateway: ${data.message || data.error || 'Execution blocked.'}`,
          timestamp: Date.now(),
          modelId: selectedModelId,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          costUSD: 0,
          latencyMs: 0,
          gatewayStatus: response.status === 402 ? 'blocked_budget' : 'routed',
        };
        setMessages((prev) => [...prev, errorMessage]);
        onRefreshData();
        return;
      }

      const assistantMessage: ChatMessage = {
        id: `msg_assistant_${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
        modelId: data.modelId,
        promptTokens: data.tokenUsage.promptTokens,
        completionTokens: data.tokenUsage.completionTokens,
        totalTokens: data.tokenUsage.totalTokens,
        costUSD: data.costUSD,
        latencyMs: data.latencyMs,
        virtualKeyId: currentVirtualKey?.id,
        gatewayStatus: data.gatewayStatus || 'routed',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onRefreshData();
    } catch (err: any) {
      setErrorBanner('Failed to communicate with Otari Gateway server.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const remainingBudget = currentVirtualKey ? Math.max(0, currentVirtualKey.budgetLimitUSD - currentVirtualKey.currentSpendUSD) : 0;
  const isBudgetCritical = remainingBudget < 0.20;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      {/* Control Bar: Model, Virtual Key & Policy Switchers */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Model Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Model:</span>
              <div className="relative max-w-[150px] sm:max-w-xs">
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors truncate"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider}) · ${m.inputCostPerMillion}/1M
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Virtual Key Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Key:</span>
              <div className="relative max-w-[140px] sm:max-w-xs">
                <select
                  value={activeVirtualKeyId}
                  onChange={(e) => onSelectVirtualKeyId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors truncate"
                >
                  {virtualKeys.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} (${k.currentSpendUSD.toFixed(2)} / ${k.budgetLimitUSD.toFixed(2)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Failover Simulation Switch */}
            <button
              onClick={() => setSimulateFailover(!simulateFailover)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                simulateFailover
                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="When enabled, simulates provider failure and forces Otari Gateway to reroute to fallback model"
            >
              <Zap className={`w-3.5 h-3.5 ${simulateFailover ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Failover Test: {simulateFailover ? 'ACTIVE' : 'OFF'}</span>
              <span className="sm:hidden">Failover: {simulateFailover ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Persona & Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                showConfigDrawer
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Persona & Prompt</span>
            </button>

            <button
              onClick={() => handleExportChat('markdown')}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Export conversation as Markdown"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleClearChat}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Persona & System Prompt Drawer */}
        {showConfigDrawer && (
          <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-start text-xs">
            <div className="w-full sm:w-64 shrink-0">
              <label className="block font-semibold text-slate-700 mb-1">Preset Role</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPersonaId(p.id);
                      setCustomSystemPrompt('');
                    }}
                    className={`px-2 py-1.5 text-left rounded-md border text-xs transition-colors ${
                      selectedPersonaId === p.id && !customSystemPrompt
                        ? 'bg-slate-900 text-white border-slate-900 font-medium'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="font-medium truncate">{p.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full flex-1">
              <label className="block font-semibold text-slate-700 mb-1">Custom System Instruction</label>
              <input
                type="text"
                value={customSystemPrompt}
                onChange={(e) => setCustomSystemPrompt(e.target.value)}
                placeholder="Override with custom instruction (e.g., 'Act as an AWS Solutions Architect...')"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        )}
      </div>

      {/* Warning banner for Budget / Failover */}
      {isBudgetCritical && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Budget Warning:</strong> Virtual key "{currentVirtualKey?.name}" has only $
              {remainingBudget.toFixed(2)} remaining of its ${currentVirtualKey?.budgetLimitUSD.toFixed(2)} cap.
            </span>
          </div>
        </div>
      )}

      {errorBanner && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorBanner}</span>
            <button
              onClick={() => setErrorBanner(null)}
              className="ml-auto text-rose-600 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Conversation Stream Viewport */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Bot className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 mb-1">Start a Conversation</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                Requests are routed via the Otari gateway control plane with virtual key authorization, budget caps, and multi-model dispatch.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto text-left">
                {PROMPT_SUGGESTIONS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all text-xs text-slate-700 flex items-start gap-2 group"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 mt-0.5 shrink-0 transition-colors" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-semibold mt-1">
                      KF
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-tr-xs shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>

                    {/* Metadata & Telemetry footer (Clean zero-pill format) */}
                    {!isUser && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums px-1">
                        <span className="font-medium text-slate-700">{message.modelId}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>{message.totalTokens > 0 ? `${message.totalTokens} tokens` : 'Cached'}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-semibold text-slate-700">${message.costUSD.toFixed(6)}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>{message.latencyMs}ms</span>
                        
                        {message.gatewayStatus === 'failover' && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="text-amber-700 font-medium">Failover Executed</span>
                          </>
                        )}
                        {message.gatewayStatus === 'blocked_budget' && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="text-rose-700 font-medium">Budget Blocked</span>
                          </>
                        )}

                        <button
                          onClick={() => handleCopy(message.id, message.content)}
                          className="ml-1 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Copy message"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-semibold mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-semibold animate-pulse">
                KF
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-600" />
                  <span>
                    Routing via Keyforg to {activeModel?.name}...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Composer Zone */}
      <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 transition-all"
          >
            <textarea
              ref={inputRef}
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Message ${activeModel?.name} via Keyforg Gateway... (Shift + Enter for new line)`}
              className="flex-1 bg-transparent border-0 resize-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none px-2 py-1"
            />

            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quiet sub-input status note */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-400 mt-2 px-1 font-mono gap-1">
            <div className="truncate">
              <span>Gateway: Otari v1.4</span>
              <span className="mx-1.5">·</span>
              <span>In: ~${activeModel?.inputCostPerMillion}/1M</span>
              <span className="mx-1.5">·</span>
              <span>Out: ~${activeModel?.outputCostPerMillion}/1M</span>
            </div>

            <div className="truncate">
              <span>Key: {currentVirtualKey?.name}</span>
              <span className="mx-1.5">·</span>
              <span className={isBudgetCritical ? 'text-amber-600 font-bold' : ''}>
                Remaining: ${remainingBudget.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
