import React from 'react';
import { BatteryCharging, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
    <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-5 shadow-xl">
      {/* Header with Vehicle name, Plate, and Battery */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white tracking-wide">
              {activePool?.pool.vehicle_name || 'Bullet'}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
              {activePool?.pool.license_plate || 'DHK-METRO-E-11-2026'}
            </span>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Three-Seat Battery-Powered Electric Trike
          </p>
        </div>

        {/* Battery gauge */}
        <div className="flex items-center gap-2 bg-gray-950 px-3 py-1.5 rounded-xl border border-gray-800 font-mono">
          <BatteryCharging className="w-5 h-5 text-emerald-400" />
          <div className="text-right">
            <div className="text-xs font-bold text-emerald-400">{batteryPercent}% CHARGED</div>
            <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${batteryPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seat Occupancy Meter */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3 font-mono text-xs">
          <span className="text-gray-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            Bullet Seat Capacity Invariant
          </span>
          <span
            className={`font-bold px-2 py-0.5 rounded ${
              isFull
                ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
            }`}
          >
            {occupiedSeats} / {totalCapacity} SEATS OCCUPIED ({availableSeats} Available)
          </span>
        </div>

        {/* Physical 3-Seat Cockpit Graphic */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((seatNum) => {
            const passenger = passengers[seatNum - 1];
            const isOccupied = Boolean(passenger);

            return (
              <div
                key={seatNum}
                className={`relative rounded-xl p-3.5 border transition-all duration-300 flex flex-col justify-between min-h-[110px] ${
                  isOccupied
                    ? 'bg-emerald-950/30 border-emerald-700/60 shadow-md shadow-emerald-950'
                    : 'bg-gray-900/40 border-dashed border-gray-700/60 hover:border-cyan-500/50'
                }`}
              >
                {/* Seat badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase font-semibold">
                    Seat #{seatNum}
                  </span>
                  {isOccupied ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-900/60 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" /> OCCUPIED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      OPEN
                    </span>
                  )}
                </div>

                {/* Passenger details or available prompt */}
                {isOccupied ? (
                  <div>
                    <div className="text-sm font-bold text-white truncate">
                      {passenger.passenger_name}
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">
                      {passenger.pickup_zone} → {passenger.destination_zone}
                    </div>
                    <div className="mt-1 text-[11px] font-mono font-bold text-emerald-400">
                      Fare: ৳{passenger.final_fare_bdt.toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-xs text-gray-500 font-mono">
                      Empty Seat
                    </span>
                    <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                      Ready for commuter
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invariant guarantee banner */}
      <div className="mt-4 p-2.5 rounded-xl bg-gray-950 border border-gray-800/80 flex items-center gap-2 text-xs font-mono text-gray-400">
        <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong className="text-gray-200">ACID Invariant:</strong> Bullet capacity limit ($C=3$) is strictly enforced via database atomic locks. Zero overbooking guaranteed.
        </span>
      </div>
    </div>
  );
};
