import React from 'react';
import { User } from '../types';
import { Zap, Wallet, Users, Radio, Car, ArrowUpRight, Compass, ShieldCheck, UserCircle, LogOut } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  demoUsers: User[];
  onSelectUser: (user: User) => void;
  activeTab: 'PASSENGER' | 'DRIVER' | 'SIMULATION' | 'HOME';
  onSelectTab: (tab: 'PASSENGER' | 'DRIVER' | 'SIMULATION' | 'HOME', overrideUser?: User) => void;
  onTopup: () => void;
  onOpenAuth: () => void;
  onSignOut?: () => void;
  isWsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  demoUsers,
  onSelectUser,
  activeTab,
  onSelectTab,
  onTopup,
  onOpenAuth,
  onSignOut,
  isWsConnected
}) => {
  return (
    <header className="sticky top-4 z-50 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="bg-[#121216]/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2.5 flex items-center justify-between shadow-2xl shadow-black/80">
        
        {/* Brand Logo with Electric Lime Squircle */}
        <div 
          onClick={() => onSelectTab('HOME')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-2xl bg-[#D2F832] flex items-center justify-center shadow-lg shadow-[#D2F832]/25 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          <div className="hidden sm:block">
            <span className="font-extrabold text-sm tracking-tight text-white block">
              DHAKA TESLA
            </span>
            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-[#D2F832]' : 'bg-amber-400'} animate-pulse`} />
              Banani Corridor v1.0
            </span>
          </div>
        </div>

        {/* Center Pill Nav Links (Direct from Reference Style) */}
        <nav className="hidden md:flex items-center gap-1 bg-black/40 border border-white/5 rounded-full px-2 py-1">
          <button
            onClick={() => onSelectTab('HOME')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'HOME'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectTab('PASSENGER')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'PASSENGER'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Passenger App
          </button>
          <button
            onClick={() => onSelectTab('DRIVER')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'DRIVER'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Driver Cockpit
          </button>
          <button
            onClick={() => onSelectTab('SIMULATION')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
              activeTab === 'SIMULATION'
                ? 'bg-[#D2F832] text-black font-bold shadow-md shadow-[#D2F832]/20'
                : 'text-[#D2F832] hover:bg-[#D2F832]/10'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Rush-Hour Sim</span>
          </button>
        </nav>

        {/* Active Account Profile Pill & TeslaPay Wallet */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            /* Logged-In User Profile Pill (Displays the specific logged-in account) */
            <div className="flex items-center bg-black/50 border border-white/10 rounded-full p-1 pl-1.5 pr-2 gap-2 shadow-inner">
              <button
                onClick={onOpenAuth}
                title="Account Profile - Click to switch account"
                className="flex items-center gap-2 text-xs hover:opacity-85 transition-opacity"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentUser.role === 'DRIVER' 
                    ? 'bg-[#D2F832] text-black shadow-sm shadow-[#D2F832]/30' 
                    : 'bg-white/20 text-white'
                }`}>
                  {currentUser.role === 'DRIVER' ? <Car className="w-3.5 h-3.5" /> : <UserCircle className="w-3.5 h-3.5" />}
                </div>
                <div className="text-left flex items-center gap-1.5">
                  <span className="font-semibold text-white max-w-[120px] truncate block text-xs">
                    {currentUser.name}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                    currentUser.role === 'DRIVER'
                      ? 'bg-[#D2F832]/20 text-[#D2F832]'
                      : 'bg-white/10 text-zinc-300'
                  }`}>
                    {currentUser.role === 'DRIVER' ? 'Pilot' : 'Pass'}
                  </span>
                </div>
              </button>

              <button
                onClick={onOpenAuth}
                title="Switch Account / Sign In"
                className="text-[11px] font-mono text-zinc-400 hover:text-white px-2 py-0.5 rounded-full hover:bg-white/10 transition-colors border-l border-white/10 pl-2"
              >
                Switch
              </button>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  title="Sign Out of Dhaka Tesla"
                  className="text-[11px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-0.5 rounded-full transition-colors border-l border-white/10 pl-2 flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          ) : (
            /* Sign In / Register Trigger when logged out */
            <button
              onClick={onOpenAuth}
              className="bg-white/10 hover:bg-white/15 active:scale-95 text-white border border-white/10 font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-sm"
              title="Sign in or register an account"
            >
              <UserCircle className="w-3.5 h-3.5 text-[#D2F832]" />
              <span>Sign In / Register</span>
            </button>
          )}

          {/* TeslaPay Wallet Button */}
          {currentUser && (
            <button
              onClick={onTopup}
              className="bg-[#D2F832] hover:bg-[#c2e825] active:scale-95 text-black font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-md shadow-[#D2F832]/25"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono">৳{currentUser.wallet_bdt.toFixed(0)}</span>
              <span className="sm:hidden">Pay</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
