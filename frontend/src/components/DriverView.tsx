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
  TrendingUp,
  Zap
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
      await ApiService.completeTrip(rideId);
      setActionMessage('Trip completed! Fare collected in integer Poysha.');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      await loadDriverData();
      if (onRefreshUser) onRefreshUser();
    } catch (err: any) {
      setActionMessage(`Completion Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const passengers = activePool?.passengers || [];

  return (
    <div className="space-y-8">
      
      {/* Driver Identity & Status Bar */}
      <div className="bg-[#121216] border border-white/10 rounded-[32px] p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border-2 border-[#D2F832] flex items-center justify-center text-xl font-black text-[#D2F832] shadow-lg">
            JU
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">{currentUser.name}</h2>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#D2F832] text-black font-extrabold">
                PILOT
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Bullet (DHK-METRO-E-11) • Banani Road 11 Staging Hub
            </p>
          </div>
        </div>

        {/* Status Toggle & Balance */}
        <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="bg-black/60 px-4 py-2 rounded-2xl border border-white/10 font-mono text-xs">
            <span className="text-zinc-400 block text-[10px]">TOTAL EARNED</span>
            <span className="text-base font-extrabold text-[#D2F832]">
              ৳{currentUser.wallet_bdt.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleStatusToggle}
            className={`px-5 py-3 rounded-full text-xs font-mono font-extrabold transition-all flex items-center gap-2 ${
              status === 'ONLINE'
                ? 'bg-[#D2F832] text-black shadow-lg shadow-[#D2F832]/25'
                : 'bg-zinc-800 text-zinc-400 border border-white/10'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${status === 'ONLINE' ? 'bg-black animate-ping' : 'bg-zinc-500'}`} />
            <span>{status === 'ONLINE' ? 'READY FOR COMMUTERS' : 'OFFLINE'}</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-[#D2F832]/10 border border-[#D2F832]/30 text-white text-xs font-mono flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#D2F832]" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-zinc-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* 3-SEAT COCKPIT HUD (PRD Core Section 3) */}
      <BulletSeatHUD activePool={activePool} />

      {/* ACTIVE POOL COMMUTER CONTROLS */}
      {passengers.length > 0 && (
        <div className="bg-[#121216] border border-white/10 rounded-[32px] p-6 md:p-8 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#D2F832]" />
              <span>Assigned Commuters in Bullet ({passengers.length}/3)</span>
            </h3>
            <span className="text-xs font-mono text-[#D2F832] bg-[#D2F832]/10 px-3 py-1 rounded-full border border-[#D2F832]/20 font-bold">
              CAPACITY LOCKED
            </span>
          </div>

          <div className="space-y-4">
            {passengers.map((p, idx) => (
              <div
                key={p.ride_id}
                className="bg-black/50 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs hover:border-white/20 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#D2F832] font-extrabold">Seat #{idx + 1}</span>
                    <span className="text-white font-bold text-sm">{p.passenger_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-zinc-300">
                      {p.status}
                    </span>
                  </div>
                  <div className="text-zinc-400 text-xs">
                    {p.pickup_zone} → {p.destination_zone} • Fare: ৳{p.final_fare_bdt.toFixed(2)} ({Math.round(p.final_fare_bdt * 100).toLocaleString()} Poysha)
                  </div>
                </div>

                {/* State Machine Transition Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  {p.status === 'MATCHED' && (
                    <button
                      onClick={() => handleMarkArrived(p.ride_id)}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D2F832] text-black hover:bg-[#c2e825] transition-all flex items-center gap-1.5 shadow-md shadow-[#D2F832]/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Arrival</span>
                    </button>
                  )}

                  {p.status === 'DRIVER_ARRIVED' && (
                    <button
                      onClick={() => handleStartTrip(p.ride_id)}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D2F832] text-black hover:bg-[#c2e825] transition-all flex items-center gap-1.5 shadow-md shadow-[#D2F832]/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Trip</span>
                    </button>
                  )}

                  {p.status === 'STARTED' && (
                    <button
                      onClick={() => handleCompleteTrip(p.ride_id)}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-1.5 shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete & Settle</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENDING COMMUTER REQUESTS */}
      <div className="bg-[#121216] border border-white/10 rounded-[32px] p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#D2F832] animate-pulse" />
            <span>Banani Live Ride Queue ({pendingRequests.length} Waiting)</span>
          </h3>
          <span className="text-[11px] font-mono text-zinc-400">
            Auto-matched by Corridor Compatibility
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-10 font-mono text-xs text-zinc-500">
            No unassigned commuter requests in queue. Ready for next rush-hour hail!
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-black/50 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs hover:border-[#D2F832]/30 transition-all"
              >
                <div>
                  <div className="text-white font-bold text-sm flex items-center gap-2">
                    <span>{req.pickup_zone} → {req.destination_zone}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D2F832]/10 text-[#D2F832] border border-[#D2F832]/20">
                      {req.requested_seats} {req.requested_seats === 1 ? 'Seat' : 'Seats'}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Commuter ID: #{req.passenger_id.slice(0, 8)} • Fare: ৳{req.final_fare_bdt.toFixed(2)} ({req.final_fare_poysha.toLocaleString()} Poysha)
                  </div>
                </div>

                <button
                  onClick={() => handleAcceptRide(req.id)}
                  disabled={loading || (activePool?.pool.occupied_seats || 0) >= 3}
                  className={`px-4 py-2 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 ${
                    (activePool?.pool.occupied_seats || 0) >= 3
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-[#D2F832] hover:bg-[#c2e825] text-black shadow-md shadow-[#D2F832]/20'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {(activePool?.pool.occupied_seats || 0) >= 3 ? 'Bullet Full (C=3)' : 'Accept into Pool'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
