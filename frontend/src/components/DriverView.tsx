import React, { useState, useEffect } from 'react';
import { User, ActivePool, RideRequest } from '../types';
import { ApiService } from '../lib/api';
import { BulletSeatHUD } from './BulletSeatHUD';
import {
  Car,
  CheckCircle2,
  Clock,
  Play,
  Check,
  Radio,
  Users,
  Wallet,
  AlertTriangle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DriverViewProps {
  currentUser: User;
  onRefreshUser?: () => void;
}

export const DriverView: React.FC<DriverViewProps> = ({ currentUser, onRefreshUser }) => {
  const [activePool, setActivePool] = useState<ActivePool | null>(null);
  const [pendingRequests, setPendingRequests] = useState<RideRequest[]>([]);
  const [driverHistory, setDriverHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadDriverData = async () => {
    try {
      const [pool, pending, history] = await Promise.all([
        ApiService.getDriverActivePool(),
        ApiService.getPendingRequests(),
        ApiService.getDriverHistory()
      ]);

      setActivePool(pool);
      setPendingRequests(pending);
      setDriverHistory(history);
    } catch (err) {
      console.error('Error fetching driver data:', err);
    }
  };

  useEffect(() => {
    loadDriverData();
    const interval = setInterval(loadDriverData, 3000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const handleStatusToggle = async () => {
    const newStatus = status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    try {
      await ApiService.setVehicleStatus(newStatus);
      setStatus(newStatus);
      setActionMessage(`Vehicle is now ${newStatus}`);
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    setLoading(true);
    setActionMessage(null);
    try {
      await ApiService.acceptRide(rideId);
      setActionMessage('Passenger matched into Bullet!');
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      await loadDriverData();
      if (onRefreshUser) onRefreshUser();
    } catch (err: any) {
      setActionMessage(`Accept Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkArrived = async (rideId: string) => {
    setLoading(true);
    try {
      await ApiService.markDriverArrived(rideId);
      setActionMessage('Arrival confirmed at passenger pickup zone!');
      await loadDriverData();
    } catch (err: any) {
      setActionMessage(`Arrival Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async (rideId: string) => {
    setLoading(true);
    try {
      await ApiService.startTrip(rideId);
      setActionMessage('Trip started! Bullet is rolling through Dhaka traffic.');
      await loadDriverData();
    } catch (err: any) {
      setActionMessage(`Start Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTrip = async (rideId: string) => {
    setLoading(true);
    try {
      const res = await ApiService.completeTrip(rideId);
      setActionMessage(`Trip completed! Collected ৳${res.final_fare_bdt.toFixed(2)}.`);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      await loadDriverData();
      if (onRefreshUser) onRefreshUser();
    } catch (err: any) {
      setActionMessage(`Complete Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const availableSeats = activePool
    ? activePool.pool.total_capacity - activePool.pool.occupied_seats
    : 3;

  return (
    <div className="space-y-6">
      {/* Jashim's Cockpit Header */}
      <div className="bg-gradient-to-r from-gray-900 via-amber-950/20 to-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg font-mono">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">{currentUser.name}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/40">
                CHIEF TESLA PILOT
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Operating: Bullet • Plate: DHK-METRO-E-11-2026 • Banani Road 11 Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Online/Offline switch */}
          <button
            onClick={handleStatusToggle}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              status === 'ONLINE'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-700/60 shadow-md shadow-emerald-950'
                : 'bg-gray-900 text-gray-400 border-gray-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${status === 'ONLINE' ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
            <span>{status === 'ONLINE' ? 'ONLINE (Accepting)' : 'OFFLINE'}</span>
          </button>

          {/* Earnings card */}
          <div className="text-right font-mono bg-gray-950 px-4 py-2 rounded-xl border border-gray-800">
            <span className="text-[10px] uppercase text-gray-400 block">Total Earnings</span>
            <span className="text-base font-bold text-amber-400">
              ৳{currentUser.wallet_bdt.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-gray-900 border border-amber-800/60 text-amber-400 text-xs font-mono flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 3-SEAT COCKPIT HUD */}
      <BulletSeatHUD activePool={activePool} />

      {/* ACTIVE POOL PASSENGER MANIFEST & CONTROLS */}
      {activePool && activePool.passengers.length > 0 && (
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Active Passengers in Bullet ({activePool.passengers.length} on board)
            </h3>
            <span className="text-xs font-mono text-gray-400">
              Corridor: {activePool.pool.corridor_direction}
            </span>
          </div>

          <div className="space-y-3">
            {activePool.passengers.map((passenger) => (
              <div
                key={passenger.ride_id}
                className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {passenger.passenger_name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      ({passenger.passenger_phone})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        passenger.status === 'MATCHED'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                          : passenger.status === 'DRIVER_ARRIVED'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                          : passenger.status === 'STARTED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {passenger.status}
                    </span>
                  </div>

                  <div className="text-gray-400 text-[11px] mt-1 flex items-center gap-1.5">
                    <span>Pickup: <strong className="text-gray-200">{passenger.pickup_zone}</strong></span>
                    <ArrowRight className="w-3 h-3 text-gray-500" />
                    <span>Dropoff: <strong className="text-gray-200">{passenger.destination_zone}</strong></span>
                  </div>

                  <div className="mt-1 text-emerald-400 font-bold">
                    Fare: ৳{passenger.final_fare_bdt.toFixed(2)} ({passenger.payment_method})
                  </div>
                </div>

                {/* Driver Action Stepper for this Passenger */}
                <div className="flex items-center gap-2">
                  {passenger.status === 'MATCHED' && (
                    <button
                      onClick={() => handleMarkArrived(passenger.ride_id)}
                      disabled={loading}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Arrival</span>
                    </button>
                  )}

                  {(passenger.status === 'MATCHED' || passenger.status === 'DRIVER_ARRIVED') && (
                    <button
                      onClick={() => handleStartTrip(passenger.ride_id)}
                      disabled={loading}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Start Trip</span>
                    </button>
                  )}

                  {passenger.status === 'STARTED' && (
                    <button
                      onClick={() => handleCompleteTrip(passenger.ride_id)}
                      disabled={loading}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-black font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/30"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Complete & Collect Fare</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENDING COMMUTER REQUESTS QUEUE */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-black text-white font-mono uppercase">
              Commuters Awaiting Pickup ({pendingRequests.length} Waiting in Banani Corridor)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-gray-400">
            Auto-refreshed via WebSocket
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-mono text-xs">
            No commuters currently waiting in this sector.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => {
              const canFit = availableSeats >= req.requested_seats;

              return (
                <div
                  key={req.id}
                  className="bg-gray-950 p-4 rounded-xl border border-gray-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs"
                >
                  <div>
                    <div className="text-white font-bold flex items-center gap-2">
                      <span>{req.passenger_name}</span>
                      <span className="text-[10px] text-gray-400">({req.passenger_phone})</span>
                    </div>
                    <div className="text-gray-400 text-[11px] mt-0.5">
                      {req.pickup_zone} → {req.destination_zone} ({req.requested_seats} seat)
                    </div>
                    <div className="text-emerald-400 font-bold mt-1">
                      Fare: ৳{req.final_fare_bdt.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => handleAcceptRide(req.id)}
                      disabled={loading || !canFit}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        canFit
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20'
                          : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                      }`}
                    >
                      <Car className="w-3.5 h-3.5" />
                      <span>{canFit ? 'Accept into Bullet' : 'Bullet Full (3/3)'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COMPLETED TRIPS EARNINGS LOG */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4 font-mono">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          Completed Trip History & Earnings
        </h3>

        {driverHistory.length === 0 ? (
          <div className="text-center py-6 text-gray-500 font-mono text-xs">
            No completed trip batches recorded today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="pb-2">Pool ID</th>
                  <th className="pb-2">Direction Corridor</th>
                  <th className="pb-2">Passengers</th>
                  <th className="pb-2">Total Fare (BDT)</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {driverHistory.map((h, i) => (
                  <tr key={i} className="text-gray-300">
                    <td className="py-2.5 text-gray-400">#{h.pool_id.slice(0, 8)}</td>
                    <td className="py-2.5 text-white font-bold">{h.corridor_direction}</td>
                    <td className="py-2.5">{h.total_passengers} rider(s)</td>
                    <td className="py-2.5 font-bold text-amber-400">৳{h.total_earnings_bdt.toFixed(2)}</td>
                    <td className="py-2.5 text-gray-400">{h.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
