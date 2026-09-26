import React from 'react';
import { User } from '../types';
import { Zap, Wallet, Users, Radio, Car } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  demoUsers: User[];
  onSelectUser: (user: User) => void;
  activeTab: 'PASSENGER' | 'DRIVER' | 'SIMULATION';
  onSelectTab: (tab: 'PASSENGER' | 'DRIVER' | 'SIMULATION') => void;
  onTopup: () => void;
  isWsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  demoUsers,
  onSelectUser,
  activeTab,
  onSelectTab,
  onTopup,
  isWsConnected
}) => {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 text-black fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">DHAKA TESLA POOL</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                OI TESLA v1.0
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Share a seat. Split the fare. Survive Dhaka traffic.
            </p>
          </div>
        </div>

        {/* Story Cast Persona Switcher */}
        <div className="flex items-center gap-1.5 bg-gray-900/90 border border-gray-800 p-1 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-gray-400 px-2 flex items-center gap-1">
            <Users className="w-3 h-3 text-cyan-400" /> Story Cast:
          </span>
          {demoUsers.map((u) => {
            const isSelected = currentUser?.id === u.id;
            const firstName = u.name.split(' ')[0];
            const isDriver = u.role === 'DRIVER';

            return (
              <button
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  if (isDriver) onSelectTab('DRIVER');
                  else onSelectTab('PASSENGER');
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? isDriver
                      ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                      : 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {isDriver ? <Car className="w-3.5 h-3.5" /> : null}
                <span>{firstName}</span>
                {isDriver && <span className="text-[10px] opacity-80">(Bullet)</span>}
              </button>
            );
          })}

          <div className="h-4 w-px bg-gray-700 mx-1" />

          {/* Simulation God-View */}
          <button
            onClick={() => onSelectTab('SIMULATION')}
            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'SIMULATION'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-cyan-400 hover:bg-cyan-950/40 border border-cyan-800/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Rush-Hour Simulator</span>
          </button>
        </div>

        {/* User Status, Wallet & Live Connection */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <button
              onClick={onTopup}
              title="Click to recharge TeslaPay wallet"
              className="flex items-center gap-2 bg-gray-900 border border-emerald-900/60 hover:border-emerald-500 px-3 py-1.5 rounded-xl transition-all cursor-pointer group"
            >
              <Wallet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-left font-mono">
                <div className="text-[10px] text-gray-400 uppercase leading-none">TeslaPay Balance</div>
                <div className="text-xs font-bold text-emerald-400 leading-tight">
                  ৳{currentUser.wallet_bdt?.toFixed(2) || '0.00'}
                </div>
              </div>
            </button>
          )}

          {/* WebSocket Live Stream status badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-gray-900 border border-gray-800"
            title={isWsConnected ? 'WebSocket live stream active' : 'Connecting to WebSocket'}
          >
            <div className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="text-[11px] text-gray-400">{isWsConnected ? 'LIVE WS' : 'CONNECTING'}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
