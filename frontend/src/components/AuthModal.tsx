import React, { useState } from 'react';
import { User } from '../types';
import { ApiService } from '../lib/api';
import { Zap, X, Car, User as UserIcon, Lock, Mail, Phone, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  currentUser?: User | null;
  onSignOut?: () => void;
  initialMode?: 'SIGN_IN' | 'SIGN_UP';
  initialRole?: 'PASSENGER' | 'DRIVER';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  currentUser,
  onSignOut,
  initialMode = 'SIGN_IN',
  initialRole = 'PASSENGER'
}) => {
  const [mode, setMode] = useState<'SIGN_IN' | 'SIGN_UP'>(initialMode);
  const [role, setRole] = useState<'PASSENGER' | 'DRIVER'>(initialRole);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState(''); // email or phone for sign in

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setIdentifier('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleQuickFill = (demoEmail: string, demoRole: 'PASSENGER' | 'DRIVER') => {
    setMode('SIGN_IN');
    setIdentifier(demoEmail);
    setPassword('password123');
    setError(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your email or phone and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.login(identifier.trim(), password);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      setSuccessMsg(`Welcome back, ${res.user.name}!`);
      setTimeout(() => {
        onAuthSuccess(res.user);
        onClose();
        resetForm();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password,
        role
      });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setSuccessMsg(`Account created successfully as ${role}!`);
      setTimeout(() => {
        onAuthSuccess(res.user);
        onClose();
        resetForm();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email or phone may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121216] border border-white/10 rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#D2F832]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#D2F832]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            onClose();
            resetForm();
          }}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Logo & Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#D2F832] flex items-center justify-center text-black shadow-lg shadow-[#D2F832]/20">
            <Zap className="w-5 h-5 fill-black" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              Dhaka Tesla Auth
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D2F832]/20 text-[#D2F832] border border-[#D2F832]/30">
                SECURE ACCESS
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              {mode === 'SIGN_IN' ? 'Sign in to access your cockpit or wallet' : 'Create an account as Passenger or Tesla Pilot'}
            </p>
          </div>
        </div>

        {/* Currently Active User Bar with Sign Out */}
        {currentUser && (
          <div className="mb-5 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentUser.role === 'DRIVER'
                  ? 'bg-[#D2F832] text-black shadow-sm'
                  : 'bg-white/20 text-white'
              }`}>
                {currentUser.role === 'DRIVER' ? <Car className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {currentUser.role} • ৳{currentUser.wallet_bdt.toFixed(0)}
                </span>
              </div>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="text-[11px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-xl transition-colors border border-rose-500/20"
              >
                Sign Out
              </button>
            )}
          </div>
        )}

        {/* Mode Toggle Tabs */}
        <div className="flex bg-black/40 border border-white/10 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('SIGN_IN');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'SIGN_IN'
                ? 'bg-[#D2F832] text-black shadow-md shadow-[#D2F832]/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('SIGN_UP');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'SIGN_UP'
                ? 'bg-[#D2F832] text-black shadow-md shadow-[#D2F832]/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-start gap-2">
            <span className="text-rose-400 font-bold shrink-0">✕</span>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-[#D2F832]/10 border border-[#D2F832]/30 text-[#D2F832] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= SIGN IN FORM ================= */}
        {mode === 'SIGN_IN' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                Email or Phone Number
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="nusrat@dhakatesla.com or +88017..."
                  className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#D2F832] focus:ring-1 focus:ring-[#D2F832] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#D2F832] focus:ring-1 focus:ring-[#D2F832] transition-colors"
                />
              </div>
            </div>

            {/* Quick-Fill Seed Cast Shortcut */}
            <div className="pt-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">
                ⚡ Quick-Fill PRD Cast:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('nusrat@dhakatesla.com', 'PASSENGER')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 transition-colors"
                >
                  Nusrat (Pass)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('jashim@dhakatesla.com', 'DRIVER')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-[#D2F832]/10 text-zinc-300 hover:text-[#D2F832] border border-white/5 transition-colors"
                >
                  Jashim (Driver)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('rafiq@dhakatesla.com', 'PASSENGER')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 transition-colors"
                >
                  Rafiq (Pass)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('shirin@dhakatesla.com', 'PASSENGER')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 transition-colors"
                >
                  Shirin (Pass)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 rounded-2xl bg-[#D2F832] hover:bg-[#c2e825] active:scale-[0.99] text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D2F832]/25 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  <span>Sign In to Dhaka Tesla</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= SIGN UP FORM ================= */}
        {mode === 'SIGN_UP' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            {/* Role Selection */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('PASSENGER')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    role === 'PASSENGER'
                      ? 'bg-white/10 border-white text-white shadow-sm'
                      : 'bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className="w-4 h-4 text-[#D2F832]" />
                    <span className="text-xs font-bold">Passenger</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">Request rides & split fares</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('DRIVER')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    role === 'DRIVER'
                      ? 'bg-[#D2F832]/10 border-[#D2F832] text-white shadow-sm'
                      : 'bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="w-4 h-4 text-[#D2F832]" />
                    <span className="text-xs font-bold text-[#D2F832]">Tesla Pilot</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">Owns a 3-seat Tesla Bullet</p>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#D2F832] transition-colors"
                />
              </div>
            </div>

            {/* Phone & Email side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">
                  Phone (+880)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801711234567"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#D2F832] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tanvir@dhaka.com"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#D2F832] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#D2F832] transition-colors"
                />
              </div>
            </div>

            {/* Perk Highlight */}
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D2F832] shrink-0" />
              <span>
                {role === 'PASSENGER'
                  ? 'Includes ৳500 TeslaPay bonus credit on registration'
                  : 'Auto-provisions a Dhaka Tesla (3 seats, 85% battery, Online)'}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-[#D2F832] hover:bg-[#c2e825] active:scale-[0.99] text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D2F832]/25 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                <>
                  <span>Complete {role === 'DRIVER' ? 'Driver Pilot' : 'Passenger'} Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
