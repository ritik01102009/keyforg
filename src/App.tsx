/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TopBar, ActiveTab } from './components/TopBar';
import { ChatAssistant } from './components/ChatAssistant';
import { VirtualKeysView } from './components/VirtualKeysView';
import { BudgetAnalyticsView } from './components/BudgetAnalyticsView';
import { GuardrailsView } from './components/GuardrailsView';
import { ModelDirectoryView } from './components/ModelDirectoryView';
import { SecurityAuditView } from './components/SecurityAuditView';
import { PromptVaultModal } from './components/PromptVaultModal';
import { HyperswitchBillingModal } from './components/HyperswitchBillingModal';
import { VirtualKey, ModelProfile, GatewayAnalytics, GatewayAuditLog, GuardrailConfig } from './types/otari';
import { SUPPORTED_MODELS } from './data/models';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('assistant');
  const [virtualKeys, setVirtualKeys] = useState<VirtualKey[]>([]);
  const [models, setModels] = useState<ModelProfile[]>(SUPPORTED_MODELS);
  const [analytics, setAnalytics] = useState<GatewayAnalytics | null>(null);
  const [auditLogs, setAuditLogs] = useState<GatewayAuditLog[]>([]);
  const [activeVirtualKeyId, setActiveVirtualKeyId] = useState<string>('');
  
  // Modals state
  const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false);
  const [isPromptVaultOpen, setIsPromptVaultOpen] = useState(false);
  const [isHyperswitchModalOpen, setIsHyperswitchModalOpen] = useState(false);

  // Global Gateway Guardrail Settings
  const [guardrails, setGuardrails] = useState<GuardrailConfig>({
    piiMasking: true,
    promptInjectionShield: true,
    contentModeration: true,
    budgetHardStop: true,
    enforceMaxTokens: 2048,
  });

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Keys
      const keysRes = await fetch('/api/keys');
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setVirtualKeys(keysData.keys || []);
        if (keysData.keys && keysData.keys.length > 0 && !activeVirtualKeyId) {
          setActiveVirtualKeyId(keysData.keys[0].id);
        }
      }

      // 2. Fetch Models
      const modelsRes = await fetch('/api/models');
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        if (modelsData.models && modelsData.models.length > 0) {
          setModels(modelsData.models);
        }
      }

      // 3. Fetch Analytics & Audit Logs
      const analyticsRes = await fetch('/api/analytics');
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics);
        setAuditLogs(analyticsData.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to fetch Keyforg Gateway telemetry:', err);
    }
  }, [activeVirtualKeyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeKey = virtualKeys.find((k) => k.id === activeVirtualKeyId) || virtualKeys[0];

  const handleSelectModelAndChat = (_modelId: string) => {
    setActiveTab('assistant');
  };

  const handleNewChat = () => {
    setActiveTab('assistant');
  };

  const handleApplySystemPrompt = (_promptText: string, _templateName: string) => {
    setActiveTab('assistant');
  };

  const handlePaymentSuccess = (updatedKey: VirtualKey, _amountAdded: number) => {
    setVirtualKeys((prev) => prev.map((k) => (k.id === updatedKey.id ? updatedKey : k)));
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewChat={handleNewChat}
        onOpenNewKeyModal={() => {
          setActiveTab('keys');
          setIsNewKeyModalOpen(true);
        }}
        onOpenHyperswitchBilling={() => setIsHyperswitchModalOpen(true)}
        onOpenPromptVault={() => setIsPromptVaultOpen(true)}
        activeKeySpend={{
          current: activeKey ? activeKey.currentSpendUSD : 0,
          limit: activeKey ? activeKey.budgetLimitUSD : 25,
        }}
      />

      <main className="flex-1">
        {activeTab === 'assistant' && (
          <ChatAssistant
            models={models}
            virtualKeys={virtualKeys}
            activeVirtualKeyId={activeVirtualKeyId || (virtualKeys[0]?.id ?? '')}
            onSelectVirtualKeyId={setActiveVirtualKeyId}
            onRefreshData={fetchData}
            guardrails={guardrails}
          />
        )}

        {activeTab === 'keys' && (
          <VirtualKeysView
            virtualKeys={virtualKeys}
            onRefreshData={fetchData}
            isOpenModal={isNewKeyModalOpen}
            onOpenModal={() => setIsNewKeyModalOpen(true)}
            onCloseModal={() => setIsNewKeyModalOpen(false)}
          />
        )}

        {activeTab === 'analytics' && (
          <BudgetAnalyticsView
            analytics={analytics}
            auditLogs={auditLogs}
            models={models}
            onRefreshData={fetchData}
          />
        )}

        {activeTab === 'guardrails' && (
          <GuardrailsView
            guardrails={guardrails}
            onUpdateGuardrails={setGuardrails}
          />
        )}

        {activeTab === 'security' && (
          <SecurityAuditView onRunAudit={fetchData} />
        )}

        {activeTab === 'models' && (
          <ModelDirectoryView
            models={models}
            onSelectModelAndChat={handleSelectModelAndChat}
          />
        )}
      </main>

      {/* System Prompts Vault Modal (source: asgeirtj/system_prompts_leaks) */}
      <PromptVaultModal
        isOpen={isPromptVaultOpen}
        onClose={() => setIsPromptVaultOpen(false)}
        onSelectPrompt={handleApplySystemPrompt}
      />

      {/* Hyperswitch Payment & Budget Top-Up Modal (source: juspay/hyperswitch) */}
      <HyperswitchBillingModal
        isOpen={isHyperswitchModalOpen}
        onClose={() => setIsHyperswitchModalOpen(false)}
        virtualKeys={virtualKeys}
        activeVirtualKeyId={activeVirtualKeyId || (virtualKeys[0]?.id ?? '')}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
