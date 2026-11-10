import React, { useState } from 'react';
import {
  BarChart3,
  DollarSign,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { GatewayAnalytics, GatewayAuditLog, ModelProfile } from '../types/otari';

interface BudgetAnalyticsViewProps {
  analytics: GatewayAnalytics | null;
  auditLogs: GatewayAuditLog[];
  models: ModelProfile[];
  onRefreshData: () => void;
}

export const BudgetAnalyticsView: React.FC<BudgetAnalyticsViewProps> = ({
  analytics,
  auditLogs,
  models,
  onRefreshData,
}) => {
  const [logFilter, setLogFilter] = useState<'all' | '200_OK' | '402_BUDGET_EXCEEDED' | '500_FAILOVER'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesFilter = logFilter === 'all' || log.status === logFilter;
    const matchesQuery =
      log.modelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.virtualKeyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.promptExcerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Keyforg Gateway Telemetry & Audit</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time inference costs, token consumption, latency benchmarks, and governance logs.
          </p>
        </div>

        <button
          onClick={onRefreshData}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
        >
          Refresh Logs
        </button>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cumulative Spend</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${analytics?.totalSpendUSD.toFixed(4) || '0.0000'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Aggregated across all virtual keys</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tokens Processed</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {analytics?.totalTokens.toLocaleString() || '0'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {analytics?.totalPromptTokens.toLocaleString() || '0'} in ·{' '}
            {analytics?.totalCompletionTokens.toLocaleString() || '0'} out
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Gateway Latency</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {analytics?.averageLatencyMs || 0} <span className="text-xs font-normal text-slate-500">ms</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Time to complete including guardrails</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Gateway Invocations</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {analytics?.totalRequests || auditLogs.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Logged audit entries</div>
        </div>
      </div>

      {/* Model Distribution & Cost Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Model Cost & Volume Distribution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {models.map((model) => {
            const usage = analytics?.modelUsageBreakdown[model.id] || { requests: 0, spendUSD: 0, tokens: 0 };
            return (
              <div key={model.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{model.name}</span>
                  <span className="text-[11px] text-slate-500">{model.provider}</span>
                </div>

                <div className="flex justify-between items-center text-xs font-mono tabular-nums">
                  <span className="text-slate-500">Total Spend:</span>
                  <span className="font-semibold text-slate-900">${usage.spendUSD.toFixed(5)}</span>
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono tabular-nums text-slate-500">
                  <span>{usage.requests} requests</span>
                  <span>{usage.tokens.toLocaleString()} tokens</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* High-Density Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Gateway Audit Log</h2>
            <span className="text-xs text-slate-400">({filteredLogs.length} events)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setLogFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  logFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setLogFilter('200_OK')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  logFilter === '200_OK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Success
              </button>
              <button
                onClick={() => setLogFilter('402_BUDGET_EXCEEDED')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  logFilter === '402_BUDGET_EXCEEDED'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Budget Blocked
              </button>
              <button
                onClick={() => setLogFilter('500_FAILOVER')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  logFilter === '500_FAILOVER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Failover
              </button>
            </div>

            {/* Log Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 w-44"
              />
            </div>
          </div>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Model ID</th>
                <th className="py-2.5 px-4">Virtual Key</th>
                <th className="py-2.5 px-4 text-right">Tokens</th>
                <th className="py-2.5 px-4 text-right">Cost (USD)</th>
                <th className="py-2.5 px-4 text-right">Latency</th>
                <th className="py-2.5 px-4">Prompt Excerpt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No log events found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const date = new Date(log.timestamp);
                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors h-10">
                      <td className="py-2 px-4 text-slate-500 whitespace-nowrap">{timeStr}</td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        {log.status === '200_OK' && (
                          <span className="text-emerald-700 font-semibold">200 OK</span>
                        )}
                        {log.status === '402_BUDGET_EXCEEDED' && (
                          <span className="text-rose-700 font-semibold">402 BUDGET EXCEEDED</span>
                        )}
                        {log.status === '500_FAILOVER' && (
                          <span className="text-amber-700 font-semibold">500 FAILOVER</span>
                        )}
                      </td>
                      <td className="py-2 px-4 font-sans font-medium text-slate-800 whitespace-nowrap">
                        {log.modelId}
                      </td>
                      <td className="py-2 px-4 font-sans text-slate-600 truncate max-w-[150px]">
                        {log.virtualKeyName}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-700">
                        {log.totalTokens > 0 ? log.totalTokens.toLocaleString() : '—'}
                      </td>
                      <td className="py-2 px-4 text-right font-semibold text-slate-900">
                        ${log.costUSD.toFixed(6)}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-500">{log.latencyMs}ms</td>
                      <td className="py-2 px-4 font-sans text-slate-500 truncate max-w-[200px]" title={log.promptExcerpt}>
                        {log.promptExcerpt || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
