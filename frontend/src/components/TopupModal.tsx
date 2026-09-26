import React, { useState } from 'react';
import { ApiService } from '../lib/api';
import { Wallet, X, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export const TopupModal: React.FC<TopupModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleTopup = async () => {
    setLoading(true);
    try {
      const res = await ApiService.topupWallet(amount);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      onSuccess(res.wallet_bdt);
      onClose();
    } catch (err: any) {
      alert(`Top-up error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Recharge TeslaPay Wallet</h3>
            <p className="text-xs text-gray-400 font-mono">Simulated Dhaka digital payment</p>
          </div>
        </div>

        <div className="space-y-4 my-4">
          <div className="grid grid-cols-3 gap-2">
            {[100, 500, 1000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                  amount === val
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/30'
                    : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                +৳{val}
              </button>
            ))}
          </div>

          <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 font-mono text-xs text-gray-400">
            <span>Recharge Amount: </span>
            <strong className="text-emerald-400 text-sm">৳{amount.toFixed(2)}</strong>
            <div className="text-[10px] text-gray-500 mt-1">
              Automated instant credit into account
            </div>
          </div>

          <button
            onClick={handleTopup}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-black font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Processing...' : `Add ৳${amount} to TeslaPay`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
