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
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PassengerViewProps {
  currentUser: User;
  zones: DhakaZone[];
  onRideBooked?: (ride: RideRequest) => void;
  onRefreshUser?: () => void;
}

export const PassengerView: React.FC<PassengerViewProps> = ({
  currentUser,
  zones,
  onRideBooked,
  onRefreshUser
}) => {
  // Defaults customized to persona: Nusrat prefers Mohakhali, Rafiq prefers Gulshan 1
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

  // Sync destination if persona changes
  useEffect(() => {
    if (currentUser.email.includes('rafiq')) {
      setDestinationZone('GULSHAN_1');
    } else {
      setDestinationZone('MOHAKHALI');
    }
  }, [currentUser.id]);

  // Fetch estimate whenever zones or seats change
  useEffect(() => {
    async function fetchEstimate() {
      if (pickupZone === destinationZone) {
        setEstimate(null);
        return;
      }
      try {
        const est = await ApiService.estimateFare(pickupZone, destinationZone, requestedSeats);
        setEstimate(est);
      } catch (err) {
        console.error('Error getting fare estimate:', err);
      }
    }
    fetchEstimate();
  }, [pickupZone, destinationZone, requestedSeats]);

  // Load active ride & history
  const loadPassengerData = async () => {
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
      setMessage(res.message);

      if (res.ride.status === 'MATCHED') {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }

      if (onRideBooked) onRideBooked(res.ride);
      if (onRefreshUser) onRefreshUser();
      await loadPassengerData();
    } catch (err: any) {
      setMessage(`Booking Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRide) return;
    setCancelling(true);
    try {
      await ApiService.cancelRide(activeRide.id, 'Cancelled by passenger');
      setActiveRide(null);
      setMessage('Ride request cancelled successfully. Seats released back to pool.');
      await loadPassengerData();
      if (onRefreshUser) onRefreshUser();
    } catch (err: any) {
      setMessage(`Cancel Error: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const lifecycleSteps = [
    { key: 'REQUESTED', label: 'Requested', desc: 'Searching Tesla' },
    { key: 'MATCHED', label: 'Matched', desc: 'Assigned to Bullet' },
    { key: 'DRIVER_ARRIVED', label: 'Arrived', desc: 'At Banani 11' },
    { key: 'STARTED', label: 'In Progress', desc: 'Rolling in traffic' },
    { key: 'COMPLETED', label: 'Arrived', desc: 'Fare settled' }
  ];

  const currentStepIdx = activeRide
    ? lifecycleSteps.findIndex((s) => s.key === activeRide.status)
    : -1;

  return (
    <div className="space-y-6">
      {/* Commuter Persona Header Card */}
      <div className="bg-gradient-to-r from-gray-900 via-emerald-950/20 to-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg font-mono">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">{currentUser.name}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                PASSENGER
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {currentUser.email} • {currentUser.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono bg-gray-950 px-4 py-2 rounded-xl border border-gray-800">
            <span className="text-[10px] uppercase text-gray-400 block">TeslaPay Balance</span>
            <span className="text-base font-bold text-emerald-400">
              ৳{currentUser.wallet_bdt.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-gray-900 border border-emerald-800/60 text-emerald-400 text-xs font-mono flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ACTIVE RIDE CARD (If commuter currently has a live ride) */}
      {activeRide && (
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono uppercase font-bold text-emerald-400">
                  LIVE COMMUTE STATUS
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                  Ride #{activeRide.id.slice(0, 8)}
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">
                {activeRide.pickup_zone} → {activeRide.destination_zone}
              </h3>
            </div>

            <div className="text-right font-mono">
              <div className="text-[11px] text-gray-400 uppercase">Your Split Fare</div>
              <div className="text-2xl font-black text-emerald-400">
                ৳{activeRide.final_fare_bdt.toFixed(2)}
              </div>
              {activeRide.discount_poysha > 0 && (
                <div className="text-[10px] text-cyan-400 flex items-center justify-end gap-1">
                  <Sparkles className="w-3 h-3" /> 25% Pool Discount Applied
                </div>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="my-6">
            <div className="grid grid-cols-5 gap-2 relative">
              {lifecycleSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="text-center relative">
                    <div
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/50 scale-110'
                          : isPassed
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-gray-800 text-gray-500 border border-gray-700'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="text-xs font-bold text-white mt-2">{step.label}</div>
                    <div className="text-[10px] text-gray-400 font-mono hidden sm:block">{step.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Driver & Tesla Info */}
          {activeRide.driver ? (
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-3">
                <Car className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="text-white font-bold">
                    Driver: {activeRide.driver.name} ({activeRide.driver.vehicle_name})
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    Plate: {activeRide.driver.license_plate} • Phone: {activeRide.driver.phone}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold">
                  Tesla Assigned
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center gap-3 font-mono text-xs text-gray-400">
              <Clock className="w-5 h-5 text-amber-400 animate-spin" />
              <span>Matching with nearest Dhaka Tesla Bullet in Banani 11 corridor...</span>
            </div>
          )}

          {/* Cancellation button (if still valid to cancel) */}
          {(activeRide.status === 'REQUESTED' || activeRide.status === 'MATCHED') && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition-all flex items-center gap-1.5 cursor-pointer"
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
          {/* Booking Form */}
          <div className="lg:col-span-7 bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-black text-white flex items-center gap-2 mb-4 pb-2 border-b border-gray-800">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Book a Seat in Dhaka Tesla Pool
            </h3>

            <form onSubmit={handleBookRide} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-gray-300 block mb-1">
                    Pickup Zone (Dhaka)
                  </label>
                  <select
                    value={pickupZone}
                    onChange={(e) => setPickupZone(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.bnName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-gray-300 block mb-1">
                    Destination Zone
                  </label>
                  <select
                    value={destinationZone}
                    onChange={(e) => setDestinationZone(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.bnName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-gray-300 block mb-1">
                    Requested Seats (Bullet has 3 max)
                  </label>
                  <select
                    value={requestedSeats}
                    onChange={(e) => setRequestedSeats(Number(e.target.value))}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={1}>1 Seat (Standard Commute)</option>
                    <option value={2}>2 Seats (Pair)</option>
                    <option value={3}>3 Seats (Entire Tesla)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-gray-300 block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="TESLAPAY">TeslaPay Digital Wallet (Automated)</option>
                    <option value="CASH">Cash on Drop-off (হাতে হাতে)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || pickupZone === destinationZone}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Car className="w-4 h-4" />
                <span>{loading ? 'Finding Tesla...' : 'Request Ride & Match Pool'}</span>
              </button>
            </form>
          </div>

          {/* Live Hand-Calculable Fare Engine Breakdown */}
          <div className="lg:col-span-5 bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  Transparent Fare Engine
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                  POYSHA ACCURATE
                </span>
              </div>

              {estimate ? (
                <div className="mt-4 space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Direct Trip Distance:</span>
                    <span className="text-white font-bold">{estimate.distanceKm.toFixed(1)} km</span>
                  </div>

                  <div className="flex justify-between text-gray-400">
                    <span>Base Flag-drop Fee:</span>
                    <span className="text-white">৳{estimate.soloFare.baseFareBdt.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-400">
                    <span>Distance Charge (৳15/km):</span>
                    <span className="text-white">৳{estimate.soloFare.distanceFareBdt.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-400 pb-2 border-b border-gray-800">
                    <span>Solo Standard Price:</span>
                    <span className="line-through text-gray-500">৳{estimate.soloFare.finalFareBdt.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/60">
                    <span>Pooling Discount (25%):</span>
                    <span>-৳{estimate.pooledFare.discountBdt.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-sm font-bold text-white">Estimated Pooled Fare:</span>
                    <span className="text-2xl font-black text-emerald-400">
                      ৳{estimate.pooledFare.finalFareBdt.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-500 font-mono italic">
                    {estimate.pooledFare.explanation}
                  </p>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 font-mono text-xs">
                  Select pickup and destination to calculate fare
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Money stored as integer Poysha (1 BDT = 100 Poysha) for zero rounding loss.</span>
            </div>
          </div>
        </div>
      )}

      {/* RIDE HISTORY TABLE */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4 font-mono">
          <Clock className="w-4 h-4 text-cyan-400" />
          {currentUser.name.split(' ')[0]}'s Ride History
        </h3>

        {myHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-mono text-xs">
            No previous ride records found for this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="pb-2">Date / Time</th>
                  <th className="pb-2">Route Corridor</th>
                  <th className="pb-2">Seats</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Fare (BDT)</th>
                  <th className="pb-2">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {myHistory.map((ride) => (
                  <tr key={ride.id} className="text-gray-300">
                    <td className="py-2.5 text-gray-400">{ride.created_at}</td>
                    <td className="py-2.5 font-bold text-white">
                      {ride.pickup_zone} → {ride.destination_zone}
                    </td>
                    <td className="py-2.5">{ride.requested_seats}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ride.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : ride.status === 'CANCELLED'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                            : 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                        }`}
                      >
                        {ride.status}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-emerald-400">
                      ৳{ride.final_fare_bdt.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-gray-400">{ride.payment_method}</td>
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
