import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  Key,
  BarChart3,
  ShieldAlert,
  Cpu,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  BookOpen,
} from 'lucide-react';
import { motion } from 'motion/react';

export type ActiveTab = 'assistant' | 'keys' | 'analytics' | 'guardrails' | 'models' | 'security';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onNewChat: () => void;
  onOpenNewKeyModal: () => void;
  onOpenHyperswitchBilling: () => void;
  onOpenPromptVault: () => void;
  activeKeySpend: { current: number; limit: number };
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onNewChat,
  onOpenNewKeyModal,
  onOpenHyperswitchBilling,
  onOpenPromptVault,
  activeKeySpend,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: ActiveTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'assistant' as ActiveTab, label: 'AI Assistant', icon: Sparkles },
    { id: 'keys' as ActiveTab, label: 'Virtual Keys', icon: Key },
    { id: 'analytics' as ActiveTab, label: 'Budget & Usage', icon: BarChart3 },
    { id: 'guardrails' as ActiveTab, label: 'Guardrails', icon: ShieldAlert },
    { id: 'security' as ActiveTab, label: 'Security & DAST', icon: ShieldCheck },
    { id: 'models' as ActiveTab, label: 'Model Directory', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Brand wordmark & Monogram */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
              KF
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleTabClick('assistant');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-slate-700 transition-colors"
            >
              Keyforg
            </a>
          </div>

          {/* Zone 2: Desktop Navigation Links with animated active state */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-slate-100 rounded-lg -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary action & Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Prompt Vault Button */}
            <button
              onClick={onOpenPromptVault}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs"
              title="Inspect System Prompts Vault (source: asgeirtj/system_prompts_leaks)"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xl:inline">Prompts Vault</span>
            </button>

            {/* Hyperswitch Top-up Button */}
            <button
              onClick={onOpenHyperswitchBilling}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs font-mono tabular-nums"
              title="Top up budget via Hyperswitch Payment Switch"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Top Up (${activeKeySpend.current.toFixed(1)}/${activeKeySpend.limit.toFixed(0)})</span>
              <span className="md:hidden">Top Up</span>
            </button>

            {/* Context-aware primary action button */}
            {activeTab === 'keys' ? (
              <button
                onClick={onOpenNewKeyModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-sm min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Issue Key</span>
                <span className="sm:hidden">Key</span>
              </button>
            ) : (
              <button
                onClick={onNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-sm min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Chat</span>
                <span className="sm:hidden">New</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono mb-2">
            <span className="text-slate-500">Active Budget:</span>
            <span className="font-semibold text-slate-900">
              ${activeKeySpend.current.toFixed(2)} / ${activeKeySpend.limit.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={() => {
                onOpenPromptVault();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Prompt Vault</span>
            </button>

            <button
              onClick={() => {
                onOpenHyperswitchBilling();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Top Up Budget</span>
            </button>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ArrowRight className="w-4 h-4 text-slate-400" />}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
