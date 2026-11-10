import React, { useState } from 'react';
import {
  CreditCard,
  Zap,
  Check,
  ShieldCheck,
  ArrowRight,
  DollarSign,
  X,
  Sparkles,
  Layers,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VirtualKey } from '../types/otari';

interface HyperswitchBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  virtualKeys: VirtualKey[];
  activeVirtualKeyId: string;
  onPaymentSuccess: (updatedKey: VirtualKey, amountAdded: number) => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100];

export const HyperswitchBillingModal: React.FC<HyperswitchBillingModalProps> = ({
  isOpen,
  onClose,
  virtualKeys,
  activeVirtualKeyId,
  onPaymentSuccess,
}) => {
  const [selectedKeyId, setSelectedKeyId] = useState(activeVirtualKeyId || virtualKeys[0]?.id || '');
  const [amountUSD, setAmountUSD] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedProcessor, setSelectedProcessor] = useState<'smart_route' | 'Stripe' | 'Razorpay' | 'Adyen' | 'PayPal'>('smart_route');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    txnId: string;
    processor: string;
    amount: number;
    feeSaved: number;
  } | null>(null);

  if (!isOpen) return null;

  const targetKey = virtualKeys.find((k) => k.id === selectedKeyId) || virtualKeys[0];
  const effectiveAmount = customAmount ? parseFloat(customAmount) : amountUSD;

  const handleProcessPayment = async () => {
    if (!effectiveAmount || effectiveAmount <= 0) return;

    setIsProcessing(true);

    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          virtualKeyId: targetKey.id,
          amountUSD: effectiveAmount,
          preferredProcessor: selectedProcessor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment processing failed');
      }

      setPaymentSuccessData({
        txnId: data.transaction.id,
        processor: data.transaction.processor,
        amount: data.transaction.amountUSD,
        feeSaved: data.transaction.feeSavedUSD,
      });

      onPaymentSuccess(data.virtualKey, effectiveAmount);
    } catch (err: any) {
      console.error('Hyperswitch payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                HS
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Hyperswitch Unified Payment Orchestrator
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Powered by <em>juspay/hyperswitch</em>. Smart-routes payments across Stripe, Razorpay, Adyen & PayPal.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentSuccessData ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Payment Succeeded!</h3>
              <p className="text-xs text-slate-500 mt-1">
                ${paymentSuccessData.amount.toFixed(2)} has been added to "{targetKey.name}" budget ceiling.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Hyperswitch Txn ID:</span>
                <span className="font-semibold text-slate-900">{paymentSuccessData.txnId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Processor Selected:</span>
                <span className="font-semibold text-slate-900">{paymentSuccessData.processor} (Smart-Routed)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Processing Fee Saved:</span>
                <span className="font-semibold text-emerald-600">${paymentSuccessData.feeSaved.toFixed(3)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setPaymentSuccessData(null);
                onClose();
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              Done & Return to Workspace
            </button>
          </div>
        ) : (
          <div className="py-4 space-y-4 text-xs">
            {/* Virtual Key Target Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Virtual Key</label>
              <select
                value={selectedKeyId}
                onChange={(e) => setSelectedKeyId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
              >
                {virtualKeys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} (Current Cap: ${k.budgetLimitUSD.toFixed(2)} · Spent: ${k.currentSpendUSD.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Top Up Amount Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Top-Up Amount (USD)</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setAmountUSD(amt);
                      setCustomAmount('');
                    }}
                    className={`py-2 px-3 rounded-lg border font-mono font-bold transition-all ${
                      amountUSD === amt && !customAmount
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1"
                step="5"
                placeholder="Or enter custom amount in USD..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Hyperswitch Smart Routing Processor Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Payment Processor Routing</label>
                <span className="text-[11px] font-mono text-emerald-700">Unified Switch</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProcessor('smart_route')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedProcessor === 'smart_route'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Smart Route (Auto)</span>
                  </div>
                  <div className={`text-[10px] mt-0.5 ${selectedProcessor === 'smart_route' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Lowest fee + 99.99% uptime
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProcessor('Stripe')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedProcessor === 'Stripe'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="font-bold">Stripe Connect</div>
                  <div className={`text-[10px] mt-0.5 ${selectedProcessor === 'Stripe' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Direct card gateway
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProcessor('Razorpay')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedProcessor === 'Razorpay'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="font-bold">Razorpay</div>
                  <div className={`text-[10px] mt-0.5 ${selectedProcessor === 'Razorpay' ? 'text-slate-300' : 'text-slate-500'}`}>
                    UPI, Cards & NetBanking
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProcessor('Adyen')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedProcessor === 'Adyen'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="font-bold">Adyen European</div>
                  <div className={`text-[10px] mt-0.5 ${selectedProcessor === 'Adyen' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Global multi-currency
                  </div>
                </button>
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>New Budget Ceiling:</span>
                <span className="font-bold text-slate-900">
                  ${(targetKey.budgetLimitUSD + effectiveAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Hyperswitch Smart Routing:</span>
                <span className="text-emerald-700 font-semibold">Active (~1.4% fee reduction)</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={isProcessing || !effectiveAmount || effectiveAmount <= 0}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Zap className="w-3.5 h-3.5 animate-spin" />
                  <span>Orchestrating via Hyperswitch...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Authorize & Credit ${effectiveAmount.toFixed(2)} to Key</span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
