import React, { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  Edit2,
  DollarSign,
  AlertCircle,
  Search,
  Lock,
  Layers,
} from 'lucide-react';
import { VirtualKey } from '../types/otari';

interface VirtualKeysViewProps {
  virtualKeys: VirtualKey[];
  onRefreshData: () => void;
  isOpenModal: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
}

export const VirtualKeysView: React.FC<VirtualKeysViewProps> = ({
  virtualKeys,
  onRefreshData,
  isOpenModal,
  onCloseModal,
  onOpenModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({});

  // New Key Form State
  const [newName, setNewName] = useState('');
  const [newWorkspace, setNewWorkspace] = useState('Engineering Team');
  const [newBudget, setNewBudget] = useState('25.00');
  const [newRateLimit, setNewRateLimit] = useState('60');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Key Modal State
  const [editingKey, setEditingKey] = useState<VirtualKey | null>(null);
  const [editBudget, setEditBudget] = useState('');
  const [editRateLimit, setEditRateLimit] = useState('');

  const handleCopySecret = (id: string, secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedKeyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Key name is required.');
      return;
    }

    const budget = parseFloat(newBudget);
    if (isNaN(budget) || budget <= 0) {
      setFormError('Please enter a valid positive budget ceiling.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          workspaceName: newWorkspace.trim(),
          budgetLimitUSD: budget,
          rateLimitRpm: parseInt(newRateLimit, 10) || 60,
          description: newDescription.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create virtual key');
      }

      setNewName('');
      setNewDescription('');
      setNewBudget('25.00');
      onRefreshData();
      onCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'Error creating key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSpend = async (key: VirtualKey) => {
    if (!confirm(`Reset current spend on "${key.name}" to $0.00?`)) return;

    try {
      await fetch(`/api/keys/${key.id}/reset`, { method: 'POST' });
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete virtual key "${name}"?`)) return;

    try {
      await fetch(`/api/keys/${id}`, { method: 'DELETE' });
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;

    const budget = parseFloat(editBudget);
    const rpm = parseInt(editRateLimit, 10);

    try {
      await fetch(`/api/keys/${editingKey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetLimitUSD: budget > 0 ? budget : undefined,
          rateLimitRpm: rpm > 0 ? rpm : undefined,
        }),
      });

      setEditingKey(null);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Aggregated KPIs
  const totalAllocatedBudget = virtualKeys.reduce((acc, k) => acc + k.budgetLimitUSD, 0);
  const totalAccruedSpend = virtualKeys.reduce((acc, k) => acc + k.currentSpendUSD, 0);
  const activeKeysCount = virtualKeys.filter((k) => k.status === 'active').length;

  const filteredKeys = virtualKeys.filter(
    (k) =>
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.keySecret.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.workspaceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Keyforg Virtual Keys</h1>
          <p className="text-xs text-slate-500 mt-1">
            Issue scoped, budget-controlled proxy credentials without sharing root model provider API keys.
          </p>
        </div>

        <button
          onClick={onOpenModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Issue Virtual Key</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Virtual Keys</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {activeKeysCount} <span className="text-xs font-normal text-slate-400">/ {virtualKeys.length} total</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Budget Allocated</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalAllocatedBudget.toFixed(2)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accrued Spend</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalAccruedSpend.toFixed(2)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget Utilization</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalAllocatedBudget > 0 ? ((totalAccruedSpend / totalAllocatedBudget) * 100).toFixed(1) : '0'}%
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter virtual keys by name, secret prefix, or workspace..."
          className="w-full bg-transparent border-none text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Virtual Keys Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-200">
          {filteredKeys.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No virtual keys match your query. Click "Issue Virtual Key" to create one.
            </div>
          ) : (
            filteredKeys.map((key) => {
              const isRevealed = revealedKeyIds[key.id];
              const spendPercent = Math.min(100, (key.currentSpendUSD / key.budgetLimitUSD) * 100);
              const isExhausted = key.status === 'budget_exhausted' || key.currentSpendUSD >= key.budgetLimitUSD;
              const isNearCap = spendPercent >= 85 && !isExhausted;

              return (
                <div key={key.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Name, Description, Secret Key */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{key.name}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500">{key.workspaceName}</span>
                        <span className="text-slate-300">·</span>
                        <span
                          className={`text-[11px] font-medium font-mono ${
                            isExhausted
                              ? 'text-rose-600'
                              : isNearCap
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {isExhausted ? 'BUDGET EXHAUSTED' : isNearCap ? 'BUDGET WARNING' : 'ACTIVE'}
                        </span>
                      </div>

                      {key.description && (
                        <p className="text-xs text-slate-500 max-w-2xl">{key.description}</p>
                      )}

                      {/* Secret token row */}
                      <div className="flex items-center gap-2 font-mono text-xs max-w-full">
                        <div className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 tracking-wider truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                          {isRevealed
                            ? key.keySecret
                            : `${key.keySecret.substring(0, 15)}••••••••••••`}
                        </div>
                        <button
                          onClick={() => toggleReveal(key.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          title={isRevealed ? 'Hide secret' : 'Reveal secret'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopySecret(key.id, key.keySecret)}
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Copy key secret"
                        >
                          {copiedKeyId === key.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Middle: Budget Progress Meter */}
                    <div className="w-full lg:w-72 shrink-0 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Spend:</span>
                        <span className="tabular-nums font-semibold text-slate-900">
                          ${key.currentSpendUSD.toFixed(3)} / ${key.budgetLimitUSD.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isExhausted ? 'bg-rose-600' : isNearCap ? 'bg-amber-500' : 'bg-slate-900'
                          }`}
                          style={{ width: `${spendPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>{spendPercent.toFixed(1)}% utilized</span>
                        <span>{key.rateLimitRpm} RPM cap</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                      <button
                        onClick={() => {
                          setEditingKey(key);
                          setEditBudget(key.budgetLimitUSD.toString());
                          setEditRateLimit(key.rateLimitRpm.toString());
                        }}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit budget or rate limits"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleResetSpend(key)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Reset current spend to $0.00 (Test budget recovery)"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteKey(key.id, key.name)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete virtual key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Issue Key Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900">Issue New Keyforg Virtual Key</h2>
            <p className="text-xs text-slate-500 mt-1">
              Virtual keys allow you to enforce hard spend limits and assign rate quotas per bot or workspace.
            </p>

            {formError && (
              <div className="mt-3 p-2 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateKey} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Support Bot Gateway, Analytics Bot"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workspace / Department</label>
                <input
                  type="text"
                  value={newWorkspace}
                  onChange={(e) => setNewWorkspace(e.target.value)}
                  placeholder="e.g., Engineering, Marketing, Operations"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Budget Ceiling (USD) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rate Limit (RPM)</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={newRateLimit}
                    onChange={(e) => setNewRateLimit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose / Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional brief notes on how this key will be used..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Issuing...' : 'Create Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Key Modal */}
      {editingKey && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900">Edit Virtual Key Limits</h2>
            <p className="text-xs text-slate-500 mt-1">Adjust budget or throughput rules for "{editingKey.name}".</p>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Budget Ceiling (USD)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rate Limit (RPM)</label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={editRateLimit}
                  onChange={(e) => setEditRateLimit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingKey(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
