import React, { useState, useEffect } from 'react';
import { User, DhakaZone, RideRequest, FareBreakdown } from '../types';
import { ApiService } from '../lib/api';
import {
  Car,
  MapPin,
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Ban,
  RotateCcw,
  Zap,
  TrendingDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PassengerViewProps {
  currentUser: User;
  zones: DhakaZone[];
  onRideBooked?: (ride: RideRequest) => void;
  onRefreshUser?: () => void;
  onTopup?: () => void;
}

export const PassengerView: React.FC<PassengerViewProps> = ({
  currentUser,
  zones,
  onRideBooked,
  onRefreshUser,
  onTopup
}) => {
  const defaultDest = currentUser.email.includes('rafiq') ? 'GULSHAN_1' : 'MOHAKHALI';

  const [pickupZone, setPickupZone] = useState('BANANI');
  const [destinationZone, setDestinationZone] = useState(defaultDest);
  const [requestedSeats, setRequestedSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'TESLAPAY' | 'CASH'>('TESLAPAY');

  const [estimate, setEstimate] = useState<{
    distanceKm: number;
    soloFare: FareBreakdown;
    pooledFare: FareBreakdown;
    potentialSavingsBdt: number;
  } | null>(null);

  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [myHistory, setMyHistory] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser.email.includes('rafiq')) {
      setDestinationZone('GULSHAN_1');
    } else {
      setDestinationZone('MOHAKHALI');
    }
  }, [currentUser.id]);

  /* --- Deterministic Haversine & Integer Poysha Local Estimator --- */
  const computeLocalEstimate = (pickupId: string, destId: string, seats: number) => {
    const pZone = zones.find((z) => z.id === pickupId);
    const dZone = zones.find((z) => z.id === destId);
    let distanceKm = 3.2;

    if (pZone && dZone) {
      const R = 6371;
      const dLat = ((dZone.latitude - pZone.latitude) * Math.PI) / 180;
      const dLng = ((dZone.longitude - pZone.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((pZone.latitude * Math.PI) / 180) *
          Math.cos((dZone.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceKm = Math.max(1.0, Math.round(R * c * 1.35 * 10) / 10);
    }

    const baseFarePoysha = 3000;
    const distanceFarePoysha = Math.round(distanceKm * 1500);
    let subtotalPoysha = baseFarePoysha + distanceFarePoysha;
    if (seats > 1) {
      subtotalPoysha = Math.round(subtotalPoysha * (1 + (seats - 1) * 0.7));
    }
    const discountPoysha = Math.round(subtotalPoysha * 0.25);
    const finalFarePoysha = Math.max(2500, subtotalPoysha - discountPoysha);

    return {
      distanceKm,
      soloFare: {
        pickupZoneId: pickupId,
        destinationZoneId: destId,
        distanceKm,
        requestedSeats: seats,
        baseFareBdt: baseFarePoysha / 100,
        distanceFareBdt: distanceFarePoysha / 100,
        subtotalBdt: subtotalPoysha / 100,
        discountBdt: 0,
        discountPercent: 0,
        finalFareBdt: subtotalPoysha / 100,
        isPooled: false,
        currency: 'BDT' as const,
        explanation: 'Solo Ride'
      },
      pooledFare: {
        pickupZoneId: pickupId,
        destinationZoneId: destId,
        distanceKm,
        requestedSeats: seats,
        baseFareBdt: baseFarePoysha / 100,
        distanceFareBdt: distanceFarePoysha / 100,
        subtotalBdt: subtotalPoysha / 100,
        discountBdt: discountPoysha / 100,
        discountPercent: 25,
        finalFareBdt: finalFarePoysha / 100,
        isPooled: true,
        currency: 'BDT' as const,
        explanation: 'Pooled Ride (25% Discount)'
      },
      potentialSavingsBdt: (subtotalPoysha - finalFarePoysha) / 100
    };
  };

  useEffect(() => {
    if (pickupZone === destinationZone) {
      setEstimate(null);
      return;
    }

    const instantEstimate = computeLocalEstimate(pickupZone, destinationZone, requestedSeats);
    setEstimate(instantEstimate);

    ApiService.estimateFare(pickupZone, destinationZone, requestedSeats)
      .then((serverEst) => {
        if (serverEst) setEstimate(serverEst);
      })
      .catch(() => {});
  }, [pickupZone, destinationZone, requestedSeats, zones]);

  /* --- Active Ride Telemetry & Commuter History --- */
  const loadPassengerData = async () => {
    if (!ApiService.getToken() && currentUser?.token) {
      ApiService.setToken(currentUser.token);
    }
    if (!ApiService.getToken()) return;

    try {
      const history = await ApiService.getMyHistory();
      setMyHistory(history);

      const active = history.find(
        (r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED'
      );
      setActiveRide(active || null);
    } catch (err) {
      console.error('Error loading passenger history:', err);
    }
  };

  useEffect(() => {
    loadPassengerData();
    const interval = setInterval(loadPassengerData, 3000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const handleBookRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pickupZone === destinationZone) {
      setMessage('Pickup and destination must be different zones.');
      return;
    }

    if (currentUser?.token && !ApiService.getToken()) {
      ApiService.setToken(currentUser.token);
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await ApiService.requestRide({
        pickupZone,
        destinationZone,
        requestedSeats,
        paymentMethod
      });

      setActiveRide(res.ride);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      if (onRideBooked) onRideBooked(res.ride);
      if (onRefreshUser) onRefreshUser();

      setMessage('Ride request dispatched to Banani electric corridor!');
      await loadPassengerData();
    } catch (err: any) {
      setMessage(err.message || 'Failed to request ride.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRide) return;
    setCancelling(true);
    try {
      await ApiService.cancelRide(activeRide.id);
      setActiveRide(null);
      setMessage('Ride cancelled. Seat released back to Bullet fleet.');
      await loadPassengerData();
      if (onRefreshUser) onRefreshUser();
    } catch (err: any) {
      setMessage(err.message || 'Cannot cancel ride at this stage.');
    } finally {
      setCancelling(false);
    }
  };

  const lifecycleSteps = [
    { key: 'REQUESTED', label: 'Requested', desc: 'Searching for Bullet' },
    { key: 'MATCHED', label: 'Matched', desc: 'Driver Assigned' },
    { key: 'DRIVER_ARRIVED', label: 'Arrived', desc: 'Boarding Trike' },
    { key: 'STARTED', label: 'In Transit', desc: 'Rolling to Destination' },
    { key: 'COMPLETED', label: 'Completed', desc: 'Fare Settled' }
  ];

  const currentStepIdx = activeRide
    ? lifecycleSteps.findIndex((s) => s.key === activeRide.status)
    : -1;

  return (
    <div className="space-y-8">
      
      {/* Alert banner if message exists */}
      {message && (
        <div className="p-4 rounded-2xl bg-[#D2F832]/10 border border-[#D2F832]/30 text-white text-xs font-mono flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D2F832]" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-zinc-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* ACTIVE RIDE CARD (If commuter currently has a live ride) */}
      {activeRide && (
        <div className="bg-[#121216] border border-[#D2F832]/40 rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D2F832]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D2F832] animate-ping" />
                <span className="text-xs font-mono uppercase font-extrabold text-[#D2F832]">
                  LIVE COMMUTE STATUS
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                  Ride #{activeRide.id.slice(0, 8)}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {activeRide.pickup_zone} → {activeRide.destination_zone}
              </h3>
            </div>

            <div className="text-left md:text-right font-mono">
              <div className="text-xs text-zinc-400 uppercase">Your Split Fare</div>
              <div className="text-3xl font-black text-[#D2F832] tracking-tight">
                ৳{activeRide.final_fare_bdt.toFixed(2)}
              </div>
              {activeRide.discount_poysha > 0 && (
                <div className="text-xs text-zinc-300 flex items-center md:justify-end gap-1 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D2F832]" /> 
                  <span className="text-[#D2F832] font-bold">25% Pool Split Applied</span>
                </div>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="my-8">
            <div className="grid grid-cols-5 gap-2 relative">
              {lifecycleSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="text-center relative">
                    <div
                      className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#D2F832] text-black shadow-lg shadow-[#D2F832]/40 scale-110'
                          : isPassed
                          ? 'bg-black text-[#D2F832] border border-[#D2F832]/60'
                          : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="text-xs font-bold text-white mt-2.5">{step.label}</div>
                    <div className="text-[10px] text-zinc-400 font-mono hidden sm:block mt-0.5">{step.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Driver & Tesla Info */}
          {activeRide.driver ? (
            <div className="bg-black/60 p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#D2F832]/10 border border-[#D2F832]/30 flex items-center justify-center text-[#D2F832]">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-white font-extrabold text-sm">
                    Driver: {activeRide.driver.name} ({activeRide.driver.vehicle_name})
                  </div>
                  <div className="text-zinc-400 text-xs mt-0.5">
                    Plate: {activeRide.driver.license_plate} • Phone: {activeRide.driver.phone}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#D2F832] text-black font-extrabold text-xs shadow-sm">
                  Bullet Assigned
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-black/60 p-5 rounded-2xl border border-white/10 flex items-center gap-3 font-mono text-xs text-zinc-400">
              <Clock className="w-5 h-5 text-[#D2F832] animate-spin" />
              <span>Matching with nearest Dhaka Tesla Bullet in Banani 11 corridor...</span>
            </div>
          )}

          {/* Cancellation button (if still valid to cancel) */}
          {(activeRide.status === 'REQUESTED' || activeRide.status === 'MATCHED') && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-5 py-2.5 rounded-full text-xs font-mono font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{cancelling ? 'Cancelling...' : 'Cancel Ride (Free Seats)'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOOKING & FARE ENGINE CARD */}
      {!activeRide && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Booking Form (7 Cols) */}
          <div className="lg:col-span-7 bg-[#121216] border border-white/10 rounded-[32px] p-6 md:p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-white/10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#D2F832]/10 border border-[#D2F832]/30 flex items-center justify-center text-[#D2F832] shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    Book a Seat in Dhaka Tesla Pool
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#D2F832] bg-[#D2F832]/10 px-2.5 py-1 rounded-full border border-[#D2F832]/25 font-bold shrink-0 self-start sm:self-auto whitespace-nowrap">
                  25% POOL DISCOUNT
                </span>
              </div>

              <form onSubmit={handleBookRide} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-zinc-300 block mb-1.5 font-medium">
                      Pickup Zone (Dhaka)
                    </label>
                    <select
                      value={pickupZone}
                      onChange={(e) => setPickupZone(e.target.value)}
                      className="w-full bg-[#0A0A0E] border border-white/15 rounded-2xl px-3.5 py-3 text-xs font-mono text-white focus:outline-none focus:border-[#D2F832] cursor-pointer"
                    >
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.bnName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-zinc-300 block mb-1.5 font-medium">
                      Destination Zone
                    </label>
                    <select
                      value={destinationZone}
                      onChange={(e) => setDestinationZone(e.target.value)}
                      className="w-full bg-[#0A0A0E] border border-white/15 rounded-2xl px-3.5 py-3 text-xs font-mono text-white focus:outline-none focus:border-[#D2F832] cursor-pointer"
                    >
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.bnName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Seats and Payment selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-xs font-mono text-zinc-300 block mb-1.5 font-medium">
                      Number of Seats
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setRequestedSeats(s)}
                          className={`py-2.5 rounded-xl text-xs font-mono font-bold transition-colors border ${
                            requestedSeats === s
                              ? 'bg-[#D2F832] text-black border-[#D2F832] shadow-sm'
                              : 'bg-black/50 text-zinc-400 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {s} {s === 1 ? 'Seat' : 'Seats'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-zinc-300 block mb-1.5 font-medium">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('TESLAPAY')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors border ${
                          paymentMethod === 'TESLAPAY'
                            ? 'bg-[#D2F832] text-black border-[#D2F832] shadow-sm'
                            : 'bg-black/50 text-zinc-400 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>TeslaPay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors border ${
                          paymentMethod === 'CASH'
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-black/50 text-zinc-400 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span>Cash</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D2F832] hover:bg-[#c2e825] active:scale-[0.98] text-black font-extrabold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-xl shadow-[#D2F832]/20 transition-all cursor-pointer mt-4"
                >
                  <span>{loading ? 'Dispatched to Bullet...' : `Confirm & Request Pool Seat`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Fare Calculator & Savings Breakdown (5 Cols) */}
          <div className="lg:col-span-5 bg-[#121216] border border-white/10 rounded-[32px] p-6 md:p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <span className="text-xs font-mono uppercase font-bold text-zinc-300">
                  Fare Calculation Model
                </span>
                <span className="text-[10px] font-mono text-[#D2F832] bg-[#D2F832]/10 border border-[#D2F832]/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D2F832] animate-pulse" />
                  <span>LIVE ESTIMATE</span>
                </span>
              </div>

              {estimate ? (
                <div className="space-y-3.5">
                  <div className="bg-black/60 rounded-2xl p-4 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                      <span>Corridor Distance</span>
                      <span className="text-white font-bold">{estimate.distanceKm.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                      <span>Base Flag-drop</span>
                      <span className="text-white font-bold">৳{estimate.pooledFare.baseFareBdt.toFixed(2)} (3,000p)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                      <span>Distance Charge</span>
                      <span className="text-white font-bold">৳{estimate.pooledFare.distanceFareBdt.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#D2F832] font-mono font-bold pt-2 border-t border-white/10">
                      <span>25% Pool Discount</span>
                      <span>-৳{estimate.pooledFare.discountBdt.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Highlight Final Fare Card */}
                  <div className="bg-[#D2F832] text-black rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs font-bold text-black/80 mb-1">
                      <span>POOLED PASSENGER FARE</span>
                      <span className="text-[10px] font-mono bg-black/15 px-2 py-0.5 rounded-full font-bold">
                        Integer Poysha
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl sm:text-4xl font-black tracking-tight">
                        ৳{estimate.pooledFare.finalFareBdt.toFixed(2)}
                      </div>
                      <div className="text-xs font-mono font-bold text-black/70">
                        ({Math.round(estimate.pooledFare.finalFareBdt * 100).toLocaleString()} Poysha)
                      </div>
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-black/80 mt-1.5 flex items-center justify-between pt-2 border-t border-black/10">
                      <span>Solo Fare: ৳{estimate.soloFare.finalFareBdt.toFixed(2)}</span>
                      <span className="font-bold text-emerald-950 bg-black/10 px-2 py-0.5 rounded">
                        Save ৳{estimate.potentialSavingsBdt.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500 font-mono text-xs">
                  Select pickup and destination to calculate transparent Poysha fare split.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] font-mono text-zinc-400">
              <span>Formula: Base (৳30) + Dist (৳15/km) − 25%</span>
              <span className="text-[#D2F832] font-bold">৳1 = 100 Poysha</span>
            </div>
          </div>

        </div>
      )}

      {/* Commuter Ride History */}
      <div className="bg-[#121216] border border-white/10 rounded-[32px] p-6 md:p-8 shadow-xl">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-[#D2F832]" />
          <span>My Banani Ride History</span>
        </h3>

        {myHistory.length === 0 ? (
          <p className="text-xs text-zinc-500 font-mono py-8 text-center">
            No previous ride records found for this commuter profile.
          </p>
        ) : (
          <div className="space-y-3">
            {myHistory.map((ride) => (
              <div
                key={ride.id}
                className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs hover:border-white/10 transition-colors"
              >
                <div>
                  <div className="text-white font-bold text-sm">
                    {ride.pickup_zone} → {ride.destination_zone}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {new Date(ride.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ride.requested_seats} Seat • {ride.payment_method}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-[#D2F832]">
                      ৳{ride.final_fare_bdt.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {ride.final_fare_poysha.toLocaleString()} Poysha
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    ride.status === 'COMPLETED'
                      ? 'bg-[#D2F832]/15 text-[#D2F832] border border-[#D2F832]/30'
                      : ride.status === 'CANCELLED'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'bg-white/15 text-white'
                  }`}>
                    {ride.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
