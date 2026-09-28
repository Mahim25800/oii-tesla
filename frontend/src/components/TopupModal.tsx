import React, { useState } from 'react';
import { User } from '../types';
import { ApiService } from '../lib/api';
import { Wallet, X, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSuccess: () => void;
}

export const TopupModal: React.FC<TopupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess
}) => {
  const [amountBdt, setAmountBdt] = useState<number>(200);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const currentBdt = currentUser.wallet_bdt.toFixed(2);
  const quickAmounts = [100, 250, 500, 1000];

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountBdt <= 0) return;

    setLoading(true);
    setMessage(null);

    try {
      await ApiService.topupWallet(amountBdt);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setMessage(`Successfully added ৳${amountBdt.toFixed(2)} to TeslaPay!`);
      setTimeout(() => {
        onSuccess();
        onClose();
        setMessage(null);
      }, 900);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121216] border border-white/10 rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#D2F832] flex items-center justify-center text-black shadow-md shadow-[#D2F832]/20">
            <Wallet className="w-5 h-5 fill-black" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Recharge TeslaPay</h3>
            <p className="text-xs text-zinc-400 font-mono">
              Zero-fee cashless balance for Dhaka Tesla Pool
            </p>
          </div>
        </div>

        {/* Current Balance Display */}
        <div className="bg-black/60 rounded-2xl p-4 border border-white/10 mb-6 flex items-center justify-between font-mono">
          <div>
            <span className="text-[10px] text-zinc-400 block uppercase">Current Balance</span>
            <span className="text-2xl font-black text-[#D2F832]">৳{currentBdt}</span>
          </div>
          <div className="text-right text-xs text-zinc-400">
            <span>{currentUser.wallet_poysha.toLocaleString()} Poysha</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleTopup} className="space-y-5">
          <div>
            <label className="text-xs font-mono text-zinc-300 block mb-2">
              Select Top-up Amount (BDT)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {quickAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmountBdt(amt)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                    amountBdt === amt
                      ? 'bg-[#D2F832] text-black border-[#D2F832]'
                      : 'bg-black/40 text-zinc-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  +৳{amt}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-bold text-sm">
                ৳
              </span>
              <input
                type="number"
                min="10"
                step="10"
                value={amountBdt}
                onChange={(e) => setAmountBdt(Number(e.target.value))}
                className="w-full bg-[#0A0A0E] border border-white/10 rounded-2xl pl-8 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-[#D2F832]"
              />
            </div>
          </div>

          {message && (
            <div className="text-xs font-mono text-[#D2F832] bg-[#D2F832]/10 p-3 rounded-xl border border-[#D2F832]/20 text-center">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D2F832] hover:bg-[#c2e825] active:scale-95 text-black font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-xl shadow-[#D2F832]/20 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{loading ? 'Recharging...' : `Add ৳${amountBdt.toFixed(2)} to TeslaPay`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
