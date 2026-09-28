import React from 'react';
import { User, DhakaZone, ActivePool, RideRequest } from '../types';
import { 
  Zap, 
  MapPin, 
  Car, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  Radio, 
  Clock, 
  TrendingDown, 
  Sparkles,
  CheckCircle2,
  Navigation,
  Compass
} from 'lucide-react';

interface HeroShowcaseProps {
  currentUser: User | null;
  zones: DhakaZone[];
  activePool: ActivePool | null;
  activeRides: RideRequest[];
  onOpenApp: (tab: 'PASSENGER' | 'DRIVER' | 'SIMULATION') => void;
  onTopup: () => void;
}

export const HeroShowcase: React.FC<HeroShowcaseProps> = ({
  currentUser,
  zones,
  activePool,
  activeRides,
  onOpenApp,
  onTopup
}) => {
  const isDriver = currentUser?.role === 'DRIVER';
  const firstName = currentUser ? currentUser.name.split(' ')[0] : 'Commuter';

  return (
    <section className="relative pt-12 pb-20 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background Ambient Radial Glow (from Reference) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[450px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(circle 500px at 50% 30%, rgba(210, 248, 50, 0.08) 0%, transparent 70%)'
        }}
      />

      {/* Hero Headline Hierarchy */}
      <div className="text-center max-w-4xl mx-auto mb-14">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#D2F832] animate-ping" />
          <span>Banani Road 11 ⇄ Mohakhali Corridor</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
          Smart, safe, and <br />
          <span className="text-zinc-500">fast rides just a</span> <br />
          <span className="text-white drop-shadow-[0_0_35px_rgba(210,248,50,0.3)]">
            tap away.
          </span>
        </h1>
      </div>

      {/* 3-Phone Interactive 3D Perspective Showcase (Directly from Reference Image) */}
      <div className="relative max-w-5xl mx-auto perspective-1000 flex items-center justify-center pt-4 pb-12">
        
        {/* LEFT PHONE: Route Radar & GPS Telemetry */}
        <div className="hidden lg:block w-[280px] h-[560px] bg-[#0F0F13] border-[6px] border-[#222228] rounded-[44px] shadow-2xl phone-left-tilt overflow-hidden relative z-10 shrink-0 select-none">
          {/* Speaker / Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
          </div>

          <div className="p-4 pt-10 h-full flex flex-col justify-between bg-gradient-to-b from-[#18181F] to-[#0A0A0C]">
            <div>
              {/* Route status bar */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mb-3">
                <span>9:09</span>
                <span className="text-[#D2F832]">● LIVE RADAR</span>
                <span>5G</span>
              </div>

              {/* Driver Proximity Card */}
              <div className="bg-black/60 border border-white/10 rounded-2xl p-3 mb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D2F832]/20 border border-[#D2F832]/50 flex items-center justify-center text-sm font-bold text-[#D2F832]">
                  JU
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    Jashim Uddin
                    <span className="text-[#D2F832] text-[10px]">★ 4.9</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    "Bullet" Electric Trike
                  </div>
                </div>
              </div>

              {/* Transit Map Mockup Canvas */}
              <div className="w-full h-48 rounded-2xl bg-[#09090C] border border-white/10 relative p-3 overflow-hidden bg-dhaka-grid flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span className="bg-black/80 px-2 py-0.5 rounded text-white border border-white/10">Banani 11</span>
                  <span className="text-[#D2F832]">4.0 km (8m)</span>
                </div>

                {/* Animated vector corridor line */}
                <div className="relative my-auto flex items-center justify-between px-3">
                  <div className="w-3 h-3 rounded-full bg-white ring-4 ring-white/20 z-10" />
                  <div className="flex-1 h-1 bg-gradient-to-r from-white via-[#D2F832] to-[#D2F832] mx-2 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#D2F832] animate-ping" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-black border-2 border-[#D2F832]" />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[#D2F832] ring-4 ring-[#D2F832]/20 z-10" />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">Pick: 8:41 AM</span>
                  <span className="bg-black/80 px-2 py-0.5 rounded text-[#D2F832] border border-[#D2F832]/30">Mohakhali Hub</span>
                </div>
              </div>
            </div>

            {/* Bottom Instruction */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-400 font-mono">Next Stop</div>
                <div className="text-xs font-bold text-white">Gulshan 1 Roundabout</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#D2F832] text-black flex items-center justify-center font-bold text-xs">
                ↗
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PHONE: Main Interactive Commuter Cockpit (Raised & Prominent) */}
        <div className="w-[320px] sm:w-[340px] h-[640px] bg-[#0E0E12] border-[7px] border-[#2A2A32] rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(210,248,50,0.18)] overflow-hidden relative z-20 flex flex-col justify-between">
          
          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700" />
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D2F832] animate-pulse" />
              <span className="text-[9px] text-zinc-400 font-mono">Live</span>
            </div>
          </div>

          {/* Screen Content */}
          <div className="p-5 pt-12 h-full flex flex-col justify-between bg-gradient-to-b from-[#16161D] via-[#0E0E12] to-[#0A0A0C]">
            
            {/* Top Greeting & Avatar */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs text-zinc-400 block font-medium">Welcome to Dhaka Tesla</span>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">
                    Hello, {firstName}
                  </h2>
                </div>
                <div 
                  onClick={onTopup}
                  title="Click to recharge wallet"
                  className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-sm font-bold text-white shadow-inner cursor-pointer hover:border-[#D2F832] transition-colors"
                >
                  {firstName[0]}
                </div>
              </div>

              {/* Signature Electric Volt Lime Hero Card (Direct from Reference) */}
              <div className="bg-[#D2F832] rounded-[28px] p-5 text-black shadow-xl shadow-[#D2F832]/20 relative overflow-hidden group">
                {/* Background decorative curve */}
                <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-black/5 pointer-events-none" />

                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 bg-black text-[#D2F832] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-4">
                  <span>● 25% Pool Split</span>
                </div>

                <div className="text-xs font-semibold text-black/70 mb-1">
                  Estimated Trip Fare
                </div>
                
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-extrabold tracking-tight">
                    ৳45.00
                  </span>
                  <span className="text-xs font-mono font-bold text-black/60">
                    (4,500 Poysha)
                  </span>
                </div>

                <div className="pt-3 border-t border-black/10 flex items-center justify-between text-xs font-medium text-black/80">
                  <div className="flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5" />
                    <span>Seat 1 of 3</span>
                  </div>
                  <span className="font-mono text-[11px] bg-black/10 px-2 py-0.5 rounded-full">
                    Banani → Mohakhali
                  </span>
                </div>
              </div>

              {/* Live Vehicle Telemetry Card */}
              <div className="mt-4 bg-black/50 border border-white/10 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#D2F832]" />
                    Bullet Capacity
                  </span>
                  <span className="text-white font-mono font-bold">
                    {activePool?.pool.occupied_seats || 1} / 3 Seats Full
                  </span>
                </div>
                {/* 3-seat mini indicator */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((seat) => {
                    const isOccupied = seat <= (activePool?.pool.occupied_seats || 1);
                    return (
                      <div 
                        key={seat}
                        className={`h-2 rounded-full transition-all ${
                          isOccupied ? 'bg-[#D2F832]' : 'bg-white/15'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions inside Phone */}
            <div className="space-y-2 mt-4">
              <button
                onClick={() => onOpenApp(isDriver ? 'DRIVER' : 'PASSENGER')}
                className="w-full bg-white hover:bg-zinc-200 active:scale-95 text-black font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-lg transition-all"
              >
                <span>{isDriver ? 'Open Driver Cockpit' : 'Request Pool Ride'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenApp('SIMULATION')}
                className="w-full bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs border border-white/10 transition-all"
              >
                <Radio className="w-3.5 h-3.5 text-[#D2F832] animate-pulse" />
                <span>Run Banani Rush-Hour Story</span>
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT PHONE: Driver Dispatch & Seat Assignment (Tilted Right) */}
        <div className="hidden lg:block w-[280px] h-[560px] bg-[#0F0F13] border-[6px] border-[#222228] rounded-[44px] shadow-2xl phone-right-tilt overflow-hidden relative z-10 shrink-0 select-none">
          {/* Speaker Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
          </div>

          <div className="p-4 pt-10 h-full flex flex-col justify-between bg-gradient-to-b from-[#18181F] to-[#0A0A0C]">
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mb-3">
                <span>9:09</span>
                <span className="text-[#D2F832]">● DRIVER ONLINE</span>
                <span>84% ⚡</span>
              </div>

              {/* Received New Request Banner (Direct from Reference Image 1) */}
              <div className="bg-[#1C1C24] border border-white/10 rounded-2xl p-3.5 mb-3">
                <span className="text-[10px] font-bold text-[#D2F832] uppercase tracking-wider block mb-1">
                  New Ride Request
                </span>
                <div className="text-sm font-extrabold text-white leading-tight">
                  Received a new ride request
                </div>
                <div className="text-[11px] text-zinc-400 font-mono mt-1">
                  Nusrat Jahan • 1 Seat
                </div>
              </div>

              {/* Driver Invariant Card */}
              <div className="bg-black/60 border border-white/10 rounded-2xl p-3 space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Fixed Capacity</span>
                  <span className="font-mono font-bold text-white">3 Seats Max</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Current Fare Total</span>
                  <span className="font-mono font-bold text-[#D2F832]">৳112.50</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Surge Pricing</span>
                  <span className="text-zinc-300 font-mono">1.0x (Normal)</span>
                </div>
              </div>

              {/* Pool Manifest */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Passenger Manifest
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-200">1. Nusrat J.</span>
                  <span className="text-[#D2F832] font-mono">Mohakhali</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-200">2. Rafiq A.</span>
                  <span className="text-[#D2F832] font-mono">Gulshan 1</span>
                </div>
              </div>
            </div>

            {/* Accept Button */}
            <div className="bg-[#D2F832] text-black font-extrabold py-2.5 px-3 rounded-2xl text-center text-xs shadow-md shadow-[#D2F832]/20">
              Ready to Depart (2/3 Full)
            </div>
          </div>
        </div>

      </div>

      {/* Sub-Hero Editorial Section (Direct from Reference: "Smarter rides start here.") */}
      <div className="pt-16 border-t border-white/10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Smarter rides <br />
              <span className="text-zinc-500">start here.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-zinc-400 leading-relaxed">
            Our electric 3-wheeler ride-pooling platform makes every Banani-Mohakhali journey smooth, safe, and transparent. Split fares with fellow commuters in integer Poysha precision.
          </p>
        </div>

        {/* 3 Editorial Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121216]/60 border border-white/5 rounded-3xl p-6 hover:border-[#D2F832]/30 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-[#D2F832]/10 border border-[#D2F832]/20 flex items-center justify-center text-[#D2F832] mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Instant Booking</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Book a seat in Jashim's Bullet in under 2 seconds. Automated corridor pairing across Banani 11, Gulshan 1, and Mohakhali.
            </p>
          </div>

          <div className="bg-[#121216]/60 border border-white/5 rounded-3xl p-6 hover:border-[#D2F832]/30 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-[#D2F832]/10 border border-[#D2F832]/20 flex items-center justify-center text-[#D2F832] mb-4">
              <Navigation className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Live Corridor Map</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Interactive Dhaka street network GIS powered by CartoDB dark tiles. Real-time telemetry tracking electric trikes and transit choke points.
            </p>
          </div>

          <div className="bg-[#121216]/60 border border-white/5 rounded-3xl p-6 hover:border-[#D2F832]/30 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-[#D2F832]/10 border border-[#D2F832]/20 flex items-center justify-center text-[#D2F832] mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Safe & Invariant</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bullet capacity of 3 seats is enforced at the database transaction level. No overbooking, no awkward Dhaka friend-making.
            </p>
          </div>
        </div>
      </div>

    </section>
  );
};
