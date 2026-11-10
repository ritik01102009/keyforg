import React from 'react';
import { Cpu, ArrowRight, Check, Zap, Sparkles } from 'lucide-react';
import { ModelProfile } from '../types/otari';

interface ModelDirectoryViewProps {
  models: ModelProfile[];
  onSelectModelAndChat: (modelId: string) => void;
}

export const ModelDirectoryView: React.FC<ModelDirectoryViewProps> = ({
  models,
  onSelectModelAndChat,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Keyforg Model Directory & Pricing</h1>
        <p className="text-xs text-slate-500 mt-1">
          Unified access to frontier and open-weight models behind a single Keyforg gateway abstraction.
        </p>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {models.map((model) => (
          <div
            key={model.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                    {model.name}
                  </h2>
                  <span className="text-xs text-slate-500">{model.provider}</span>
                </div>
                {model.isFallback ? (
                  <span className="text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                    Automated Fallback
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-500">
                    ~{model.latencyAvgMs}ms
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {model.description}
              </p>

              {/* Pricing & Limits */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs font-mono tabular-nums">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Input Cost:</span>
                  <span className="font-semibold text-slate-900">${model.inputCostPerMillion.toFixed(2)} / 1M</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Output Cost:</span>
                  <span className="font-semibold text-slate-900">${model.outputCostPerMillion.toFixed(2)} / 1M</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Context Window:</span>
                  <span className="text-slate-700">{model.contextWindow}</span>
                </div>
              </div>

              {/* Capabilities */}
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Supported Features
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs text-slate-600">
                  {model.supportedFeatures.map((feat, idx) => (
                    <span key={idx} className="bg-slate-100 rounded px-2 py-0.5 text-[11px]">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => onSelectModelAndChat(model.id)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg transition-all"
              >
                <span>Chat with {model.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">Gateway Inference Unit Economics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare model tier unit economics to optimize cost and latency across your AI workloads.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Model</th>
                <th className="py-2.5 px-4">Provider</th>
                <th className="py-2.5 px-4 text-right">Input ($/1M)</th>
                <th className="py-2.5 px-4 text-right">Output ($/1M)</th>
                <th className="py-2.5 px-4 text-right">Latency Target</th>
                <th className="py-2.5 px-4">Context Window</th>
                <th className="py-2.5 px-4">Primary Workload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {models.map((model) => (
                <tr key={model.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                    {model.name}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">
                    {model.provider}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    ${model.inputCostPerMillion.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    ${model.outputCostPerMillion.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500">
                    ~{model.latencyAvgMs}ms
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {model.contextWindow}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">
                    {model.recommendedFor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
