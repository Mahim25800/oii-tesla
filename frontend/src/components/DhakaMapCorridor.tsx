import React from 'react';
import { DhakaZone, RideRequest } from '../types';
import { MapPin, Navigation } from 'lucide-react';

interface DhakaMapCorridorProps {
  zones: DhakaZone[];
  selectedPickup?: string;
  selectedDropoff?: string;
  activeRides?: RideRequest[];
  onSelectZone?: (zoneId: string) => void;
}

export const DhakaMapCorridor: React.FC<DhakaMapCorridorProps> = ({
  zones,
  selectedPickup,
  selectedDropoff,
  activeRides = [],
  onSelectZone
}) => {
  // Pre-calculated relative layout coordinates (percentage x, y) for Dhaka zones
  const zoneCoords: Record<string, { x: number; y: number }> = {
    UTTARA_3: { x: 50, y: 12 },
    MIRPUR_10: { x: 26, y: 28 },
    BANANI: { x: 52, y: 32 },
    GULSHAN_2: { x: 68, y: 30 },
    GULSHAN_1: { x: 70, y: 48 },
    MOHAKHALI: { x: 50, y: 52 },
    BADDA: { x: 80, y: 44 },
    TEJGAON: { x: 48, y: 66 },
    FARMGATE: { x: 34, y: 74 },
    DHANMONDI: { x: 22, y: 84 }
  };

  // Canonical Banani Commuter Corridor lines
  const corridors = [
    { from: 'BANANI', to: 'MOHAKHALI', label: 'Nusrat Corridor (4.0 km)' },
    { from: 'BANANI', to: 'GULSHAN_1', label: 'Rafiq Corridor (3.2 km)' },
    { from: 'BANANI', to: 'GULSHAN_2', label: 'Diplomatic Link (1.2 km)' },
    { from: 'MOHAKHALI', to: 'FARMGATE', label: 'Flyover Arterial' },
    { from: 'FARMGATE', to: 'DHANMONDI', label: 'Mirpur Road Corridor' }
  ];

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Dhaka Metro Map Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Dhaka Electric Corridor Radar
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                LIVE GEO CORRIDOR
              </span>
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Banani 11 Commuter Hub → Mohakhali & Gulshan Shared Lanes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span className="text-gray-400">Pickup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            <span className="text-gray-400">Dropoff</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="text-gray-400">Bullet Live</span>
          </div>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative w-full h-80 bg-gray-950/90 rounded-xl border border-gray-800/80 bg-dhaka-grid flex items-center justify-center">
        <svg className="w-full h-full absolute inset-0 pointer-events-none">
          {/* Corridors road network lines */}
          {corridors.map((c, i) => {
            const p1 = zoneCoords[c.from];
            const p2 = zoneCoords[c.to];
            if (!p1 || !p2) return null;

            const isBananiMohakhali = (c.from === 'BANANI' && c.to === 'MOHAKHALI') || (c.from === 'BANANI' && c.to === 'GULSHAN_1');

            return (
              <g key={i}>
                <line
                  x1={`${p1.x}%`}
                  y1={`${p1.y}%`}
                  x2={`${p2.x}%`}
                  y2={`${p2.y}%`}
                  stroke={isBananiMohakhali ? '#10b981' : '#374151'}
                  strokeWidth={isBananiMohakhali ? '3' : '1.5'}
                  strokeDasharray={isBananiMohakhali ? '4 2' : 'none'}
                  className={isBananiMohakhali ? 'animate-pulse' : ''}
                  opacity={isBananiMohakhali ? 0.9 : 0.4}
                />
              </g>
            );
          })}

          {/* Active Ride Corridors */}
          {activeRides.map((ride, idx) => {
            const from = zoneCoords[ride.pickup_zone];
            const to = zoneCoords[ride.destination_zone];
            if (!from || !to) return null;

            return (
              <line
                key={`active-${idx}`}
                x1={`${from.x}%`}
                y1={`${from.y}%`}
                x2={`${to.x}%`}
                y2={`${to.y}%`}
                stroke="#06b6d4"
                strokeWidth="4"
                strokeDasharray="6 3"
                className="animate-pulse"
                opacity={0.8}
              />
            );
          })}
        </svg>

        {/* Interactive Zone Pins */}
        {zones.map((zone) => {
          const coords = zoneCoords[zone.id] || { x: 50, y: 50 };
          const isPickup = selectedPickup === zone.id;
          const isDropoff = selectedDropoff === zone.id;
          const isBanani = zone.id === 'BANANI';
          const isMohakhali = zone.id === 'MOHAKHALI';
          const isGulshan1 = zone.id === 'GULSHAN_1';

          let pinColor = 'bg-gray-800 border-gray-600 text-gray-300';
          if (isPickup) pinColor = 'bg-emerald-500 border-emerald-300 text-black font-bold scale-110 shadow-lg shadow-emerald-500/50';
          else if (isDropoff) pinColor = 'bg-cyan-500 border-cyan-300 text-black font-bold scale-110 shadow-lg shadow-cyan-500/50';
          else if (isBanani) pinColor = 'bg-emerald-950 border-emerald-500 text-emerald-400 font-bold';
          else if (isMohakhali || isGulshan1) pinColor = 'bg-cyan-950 border-cyan-500 text-cyan-400';

          return (
            <div
              key={zone.id}
              onClick={() => onSelectZone && onSelectZone(zone.id)}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 group z-10`}
            >
              <div
                className={`px-2 py-1 rounded-lg border text-[11px] font-mono whitespace-nowrap flex items-center gap-1.5 shadow-md ${pinColor}`}
              >
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{zone.name.split(' ')[0]}</span>
                <span className="text-[9px] opacity-75 hidden sm:inline">{zone.bnName}</span>
              </div>
            </div>
          );
        })}

        {/* Animated Tesla Bullet Position on Banani Hub */}
        <div
          style={{ left: `${zoneCoords['BANANI'].x}%`, top: `${zoneCoords['BANANI'].y + 7}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex items-center gap-1 bg-amber-500 text-black px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-lg shadow-amber-500/30 animate-bounce"
        >
          <span>⚡ Bullet (Jashim)</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-gray-400">
        <span>📍 Dhaka Coordinates: 23.79° N, 90.40° E</span>
        <span>Route Curvature Scale: 1.35x Dhaka Street Tortuosity</span>
      </div>
    </div>
  );
};
