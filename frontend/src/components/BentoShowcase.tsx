import React from 'react';
import { ShieldCheck, MapPin, Zap, Users, ArrowUpRight, TrendingDown, CheckCircle2 } from 'lucide-react';

interface BentoShowcaseProps {
  onOpenSimulator: () => void;
  onOpenPassenger: () => void;
}

export const BentoShowcase: React.FC<BentoShowcaseProps> = ({
  onOpenSimulator,
  onOpenPassenger
}) => {
  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
      
      {/* Top Tag & Title */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#D2F832] mb-3">
          <span>● Engineering Invariants</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Ride the future <br />
          <span className="text-zinc-500">of Dhaka mobility.</span>
        </h2>
      </div>

      {/* Grid Layout (Directly from Reference Image 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Large Feature Banner Card in Electric Volt Lime (spans 2 cols) */}
        <div className="md:col-span-2 bg-[#D2F832] text-black rounded-[36px] p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
          {/* Subtle Dhaka Road Network watermark background */}
          <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none bg-dhaka-grid" />

          <div>
            <div className="inline-flex items-center gap-1.5 bg-black text-[#D2F832] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-6">
              <span>● Fixed Corridor Pooling</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight max-w-md mb-4">
              Shared rides anywhere in the Banani corridor.
            </h3>

            <p className="text-sm font-medium text-black/75 max-w-lg leading-relaxed mb-8">
              Experience the freedom of emission-free electric trike commuting. Banani Road 11 to Mohakhali or Gulshan 1 with instant 25% pool fare discount and zero Dhaka traffic friction.
            </p>
          </div>

          {/* Dotted Dhaka Transit Route Visualization (as seen on Image 2) */}
          <div className="pt-6 border-t border-black/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold bg-black/10 px-3 py-1.5 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-black" />
                <span>Banani 11</span>
                <span className="text-black/40">┈┈►</span>
                <span>Gulshan 1</span>
                <span className="text-black/40">┈┈►</span>
                <span>Mohakhali</span>
              </div>
            </div>

            <button
              onClick={onOpenPassenger}
              className="bg-black hover:bg-zinc-800 active:scale-95 text-[#D2F832] font-extrabold text-xs px-5 py-3 rounded-full flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span>Book a Bullet Seat</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Driver Trust Card with Jashim Uddin (Reference Helmet/Driver Portrait Card) */}
        <div className="bg-[#121216] border border-white/10 rounded-[36px] p-8 flex flex-col justify-between relative overflow-hidden group hover:border-[#D2F832]/40 transition-all">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-semibold px-3 py-1 rounded-full mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D2F832]" />
              <span>Safe & Verified Driver</span>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-[#D2F832] flex items-center justify-center text-xl font-bold text-white shadow-lg overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-black to-zinc-700 opacity-70" />
                <span className="relative z-10 text-[#D2F832]">JU</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white leading-tight">Jashim Uddin</h4>
                <p className="text-xs text-zinc-400 font-mono">Owner of "Bullet" (DHK-METRO-E-11)</p>
                <div className="flex items-center gap-1 text-[#D2F832] text-xs font-bold mt-1">
                  <span>★★★★★</span>
                  <span className="text-zinc-400 text-[11px]">(4.97 rating)</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed italic bg-black/40 p-4 rounded-2xl border border-white/5">
              "I just want to know who's actually riding and when I can go. Bullet gives Banani commuters a smooth ride without the surge drama."
            </p>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Battery: 84% Charged</span>
            <span className="text-[#D2F832] font-bold">ONLINE</span>
          </div>
        </div>

        {/* Stat Card 1: 3-Seat Capacity Invariant */}
        <div className="bg-[#121216] border border-white/10 rounded-[36px] p-8 flex flex-col justify-between hover:border-[#D2F832]/40 transition-all">
          <div>
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-4">
              Fixed Hardware Capacity
            </span>
            <div className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-2">
              3 Seats
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bullet has strictly 3 seats. The capacity invariant is enforced at the database transaction level with row-locking.
            </p>
          </div>
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-500">PRD Section 3</span>
            <span className="text-[#D2F832] font-bold">C = 3 Invariant</span>
          </div>
        </div>

        {/* Stat Card 2: 100% Integer Poysha Currency Math */}
        <div className="bg-[#121216] border border-white/10 rounded-[36px] p-8 flex flex-col justify-between hover:border-[#D2F832]/40 transition-all">
          <div>
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-4">
              Transparent Financial Engine
            </span>
            <div className="text-5xl sm:text-6xl font-black text-[#D2F832] tracking-tight mb-2">
              100% Poysha
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Hand-calculable integer arithmetic (1 BDT = 100 Poysha). Zero IEEE-754 decimal rounding drift or hidden charges.
            </p>
          </div>
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-500">PRD Section 5</span>
            <span className="text-white font-bold">Integer Math</span>
          </div>
        </div>

        {/* Stat Card 3: 0 Overbooking Concurrency Guarantee */}
        <div className="bg-[#121216] border border-white/10 rounded-[36px] p-8 flex flex-col justify-between hover:border-[#D2F832]/40 transition-all">
          <div>
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-4">
              Concurrency & Race Conditions
            </span>
            <div className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-2">
              0 Overbook
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              When 1 seat remains and multiple commuters hit 'Book' simultaneously, atomic isolation guarantees only 1 wins and others are cleanly rejected.
            </p>
          </div>
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-500">PRD Section 12</span>
            <span className="text-[#D2F832] font-bold">15/15 Tests Passed</span>
          </div>
        </div>

      </div>

    </section>
  );
};
