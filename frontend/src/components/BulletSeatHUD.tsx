import React from 'react';
import { BatteryCharging, Users, ShieldAlert, CheckCircle2, Zap } from 'lucide-react';
import { ActivePool } from '../types';

interface BulletSeatHUDProps {
  activePool: ActivePool | null;
  onSeatClick?: (seatNumber: number) => void;
}

export const BulletSeatHUD: React.FC<BulletSeatHUDProps> = ({ activePool }) => {
  const totalCapacity = activePool?.pool.total_capacity || 3;
  const occupiedSeats = activePool?.pool.occupied_seats || 0;
  const availableSeats = Math.max(0, totalCapacity - occupiedSeats);
  const batteryPercent = activePool?.pool.battery_percent || 84;
  const isFull = availableSeats === 0;

  const passengers = activePool?.passengers || [];

  return (
    <div className="bg-[#121216] border border-white/10 rounded-[32px] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      
      {/* Header: Vehicle Name, Plate & Battery with safe wrapping */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-[#D2F832] flex items-center justify-center text-black font-extrabold shrink-0 shadow-md shadow-[#D2F832]/20">
              <Zap className="w-4 h-4 fill-black" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight shrink-0">
              {activePool?.pool.vehicle_name || 'Bullet'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10 whitespace-nowrap shrink-0">
              {activePool?.pool.license_plate || 'DHK-METRO-E-11'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono mt-1">
            Three-Seat Electric Trike • Banani Fleet
          </p>
        </div>

        {/* Battery Telemetry Meter */}
        <div className="flex items-center gap-2.5 bg-black/60 px-3 py-1.5 rounded-2xl border border-white/10 font-mono shrink-0 self-start sm:self-auto">
          <BatteryCharging className="w-4 h-4 text-[#D2F832] shrink-0" />
          <div>
            <div className="text-[11px] font-extrabold text-[#D2F832] whitespace-nowrap">{batteryPercent}% CHARGED</div>
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-[#D2F832] transition-all duration-500"
                style={{ width: `${batteryPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seat Occupancy Meter */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3 font-mono text-xs flex-wrap gap-2">
          <span className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
            <Users className="w-3.5 h-3.5 text-[#D2F832]" />
            <span>Cockpit Seats</span>
          </span>
          <span
            className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] whitespace-nowrap ${
              isFull
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-[#D2F832]/15 text-[#D2F832] border border-[#D2F832]/30'
            }`}
          >
            {occupiedSeats} / {totalCapacity} OCCUPIED ({availableSeats} OPEN)
          </span>
        </div>

        {/* Physical 3-Seat Cockpit Graphic */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[1, 2, 3].map((seatNum) => {
            const passenger = passengers[seatNum - 1];
            const isOccupied = Boolean(passenger);

            return (
              <div
                key={seatNum}
                className={`relative rounded-2xl p-3 border transition-all duration-300 flex flex-col justify-between min-h-[105px] ${
                  isOccupied
                    ? 'bg-[#181820] border-[#D2F832]/60 shadow-lg shadow-black/60'
                    : 'bg-black/30 border-dashed border-white/10 hover:border-white/20'
                }`}
              >
                {/* Seat badge */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">
                    #{seatNum}
                  </span>
                  {isOccupied ? (
                    <span className="flex items-center gap-1 text-[9px] font-extrabold text-black bg-[#D2F832] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      <CheckCircle2 className="w-2.5 h-2.5" /> BUSY
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded-full border border-white/5 whitespace-nowrap">
                      OPEN
                    </span>
                  )}
                </div>

                {/* Passenger details or available prompt */}
                {isOccupied ? (
                  <div>
                    <div className="text-xs font-extrabold text-white truncate">
                      {passenger.passenger_name}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono truncate">
                      {passenger.pickup_zone} → {passenger.destination_zone}
                    </div>
                    <div className="mt-1 text-[11px] font-mono font-bold text-[#D2F832]">
                      ৳{passenger.final_fare_bdt.toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-1.5 my-auto">
                    <span className="text-[11px] text-zinc-500 font-mono block">
                      Empty Seat
                    </span>
                    <p className="text-[9px] text-zinc-600 font-mono">
                      Available
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invariant guarantee banner */}
      <div className="mt-4 p-3 rounded-2xl bg-black/60 border border-white/5 flex items-start sm:items-center gap-2.5 text-[11px] font-mono text-zinc-400">
        <ShieldAlert className="w-4 h-4 text-[#D2F832] shrink-0 mt-0.5 sm:mt-0" />
        <span>
          <strong className="text-zinc-200">Capacity Invariant (C ≤ 3 Seats):</strong> Database locks guarantee zero overbooking.
        </span>
      </div>

    </div>
  );
};
