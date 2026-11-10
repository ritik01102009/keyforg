import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  ArrowRight,
  ShieldCheck,
  Lock,
  X,
  Sparkles,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SYSTEM_PROMPTS_VAULT, KNOWN_LEAK_EXPLOITS } from '../data/systemPrompts';
import { SystemPromptTemplate } from '../types/security';

interface PromptVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string, templateName: string) => void;
}

export const PromptVaultModal: React.FC<PromptVaultModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPromptTemplate>(SYSTEM_PROMPTS_VAULT[0]);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeakDefense, setShowLeakDefense] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPrompts = SYSTEM_PROMPTS_VAULT.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-800" />
              <h2 className="text-base font-bold text-slate-900">
                System Prompts Vault & Leak Defense Benchmark
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Curated system prompt architectures from major frontier models & agents (source: <em>asgeirtj/system_prompts_leaks</em>).
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Toggle Banner */}
        <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="w-full sm:w-72 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter prompt architectures..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <button
            onClick={() => setShowLeakDefense(!showLeakDefense)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              showLeakDefense
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Leak Defense Benchmark ({KNOWN_LEAK_EXPLOITS.length} tests)</span>
          </button>
        </div>

        {/* Main Content Split View */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Prompt Selection List */}
          <div className="overflow-y-auto pr-1 space-y-2 border-r border-slate-100">
            {filteredPrompts.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPrompt(p)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                  selectedPrompt.id === p.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold truncate">{p.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      selectedPrompt.id === p.id
                        ? 'bg-slate-800 text-slate-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {p.provider}
                  </span>
                </div>
                <p
                  className={`mt-1 line-clamp-2 text-[11px] ${
                    selectedPrompt.id === p.id ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {p.description}
                </p>
              </button>
            ))}
          </div>

          {/* Details & Live Inspection View */}
          <div className="md:col-span-2 overflow-y-auto space-y-4 pl-1">
            {showLeakDefense ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900">
                  <h3 className="font-bold text-sm mb-1">Keyforg System Prompt Leakage Defense Benchmark</h3>
                  <p className="leading-relaxed">
                    Tested against known adversarial extraction prompts collected by the security community. Keyforg's prompt shield intercepts extraction tokens at the gateway boundary, ensuring zero system instruction exposure.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800">Verified Defense Against Known Exploits:</span>
                  <div className="space-y-1.5">
                    {KNOWN_LEAK_EXPLOITS.map((exploit, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs font-mono"
                      >
                        <span className="text-slate-700 truncate max-w-[85%]">{exploit}</span>
                        <span className="text-emerald-700 font-semibold shrink-0 text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          NEUTRALIZED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{selectedPrompt.name}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(selectedPrompt.systemPrompt)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1"
                        title="Copy prompt"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectPrompt(selectedPrompt.systemPrompt, selectedPrompt.name);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                      >
                        <span>Apply to Assistant</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{selectedPrompt.description}</p>
                </div>

                {/* Directives & Safety */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-semibold text-slate-800 block mb-1">Key Directives:</span>
                    <ul className="space-y-1 text-slate-600 text-[11px]">
                      {selectedPrompt.keyDirectives.map((d, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-slate-900 mt-1.5 shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-semibold text-slate-800 block mb-1">Safety Constraints:</span>
                    <ul className="space-y-1 text-slate-600 text-[11px]">
                      {selectedPrompt.safetyRules.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-slate-900 mt-1.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Raw Prompt Fenced Box */}
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1">
                    System Instruction Content:
                  </span>
                  <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed border border-slate-800">
                    {selectedPrompt.systemPrompt}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
