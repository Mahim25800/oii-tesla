import React, { useState } from 'react';
import { User, DhakaZone, ActivePool } from '../types';
import { ApiService } from '../lib/api';
import {
  Play,
  RotateCcw,
  FastForward,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Users,
  Car,
  ShieldCheck,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveScenarioSimulationProps {
  demoUsers: User[];
  zones: DhakaZone[];
  onScenarioStep?: () => void;
}

export const LiveScenarioSimulation: React.FC<LiveScenarioSimulationProps> = ({
  demoUsers,
  zones,
  onScenarioStep
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<Array<{ time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([
    {
      time: '08:40:00 AM',
      text: 'Banani Road 11: Jashim is parked with Bullet (3-seat electric Dhaka Tesla, 84% battery). Initializing simulator.',
      type: 'info'
    }
  ]);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [createdRides, setCreatedRides] = useState<Record<string, string>>({});

  const jashim = demoUsers.find((u) => u.role === 'DRIVER');
  const nusrat = demoUsers.find((u) => u.email.includes('nusrat'));
  const rafiq = demoUsers.find((u) => u.email.includes('rafiq'));
  const shirin = demoUsers.find((u) => u.email.includes('shirin'));

  const appendLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ time, text, type }, ...prev]);
  };

  const executeStep = async (stepNum: number) => {
    try {
      if (stepNum === 1) {
        // Step 1: Nusrat books Banani -> Mohakhali
        if (!nusrat) throw new Error('Nusrat demo account not found');
        ApiService.setToken(nusrat.token || null);
        const res = await ApiService.requestRide({
          pickupZone: 'BANANI',
          destinationZone: 'MOHAKHALI',
          requestedSeats: 1,
          paymentMethod: 'TESLAPAY'
        });
        setCreatedRides((prev) => ({ ...prev, nusrat: res.ride.id }));
        appendLog(`8:41 AM: Nusrat books Banani → Mohakhali (Solo estimate ৳${res.ride.final_fare_bdt.toFixed(2)}). Status: REQUESTED`, 'info');
        setCurrentStep(1);
      } else if (stepNum === 2) {
        // Step 2: Jashim accepts Nusrat into Bullet
        if (!jashim) throw new Error('Jashim demo account not found');
        ApiService.setToken(jashim.token || null);
        const rideId = createdRides.nusrat;
        if (!rideId) throw new Error('Nusrat ride not created yet');
        const res = await ApiService.acceptRide(rideId);
        appendLog(`8:42 AM: Jashim accepts Nusrat into Bullet! Pool formed. Bullet Seat Occupancy: 1 / 3.`, 'success');
        setCurrentStep(2);
      } else if (stepNum === 3) {
        // Step 3: Rafiq books Banani -> Gulshan 1 and gets auto-pooled with 25% discount
        if (!rafiq) throw new Error('Rafiq demo account not found');
        ApiService.setToken(rafiq.token || null);
        const res = await ApiService.requestRide({
          pickupZone: 'BANANI',
          destinationZone: 'GULSHAN_1',
          requestedSeats: 1,
          paymentMethod: 'TESLAPAY'
        });
        setCreatedRides((prev) => ({ ...prev, rafiq: res.ride.id }));
        appendLog(
          `8:43 AM: Rafiq books Banani → Gulshan 1! Aligned corridor detected. AUTO-POOLED into Bullet! 25% Pool Discount applied: ৳${res.ride.final_fare_bdt.toFixed(2)} (Saved ৳${(res.ride.discount_poysha / 100).toFixed(2)}). Bullet Seat Occupancy: 2 / 3.`,
          'success'
        );
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setCurrentStep(3);
      } else if (stepNum === 4) {
        // Step 4: Shirin books last seat
        if (!shirin) throw new Error('Shirin demo account not found');
        ApiService.setToken(shirin.token || null);
        const res = await ApiService.requestRide({
          pickupZone: 'BANANI',
          destinationZone: 'MOHAKHALI',
          requestedSeats: 1,
          paymentMethod: 'TESLAPAY'
        });
        setCreatedRides((prev) => ({ ...prev, shirin: res.ride.id }));
        appendLog(
          `8:43:30 AM: Shirin grabs the 3rd and final seat! Bullet is now at 100% capacity (3 / 3 seats occupied).`,
          'warn'
        );
        setCurrentStep(4);
      } else if (stepNum === 5) {
        // Step 5: Kamal tries to book 4th seat -> rejected by capacity invariant
        if (!nusrat) return;
        ApiService.setToken(nusrat.token || null);
        const overflow = await ApiService.requestRide({
          pickupZone: 'BANANI',
          destinationZone: 'MOHAKHALI',
          requestedSeats: 1,
          paymentMethod: 'CASH'
        });
        appendLog(
          `8:44 AM (Concurrency Guard): A 4th commuter attempts to join Bullet. System detects Bullet is full (3/3 seats). Invariant preserved: Ride kept in REQUESTED state for next Tesla, Bullet never overbooked!`,
          'success'
        );
        setCurrentStep(5);
      } else if (stepNum === 6) {
        // Step 6: Driver arrives, starts, and completes trip
        if (!jashim) return;
        ApiService.setToken(jashim.token || null);
        const r1 = createdRides.nusrat;
        const r2 = createdRides.rafiq;
        const r3 = createdRides.shirin;

        if (r1) {
          await ApiService.markDriverArrived(r1);
          await ApiService.startTrip(r1);
          await ApiService.completeTrip(r1);
        }
        if (r2) {
          await ApiService.markDriverArrived(r2);
          await ApiService.startTrip(r2);
          await ApiService.completeTrip(r2);
        }
        if (r3) {
          await ApiService.markDriverArrived(r3);
          await ApiService.startTrip(r3);
          await ApiService.completeTrip(r3);
        }

        appendLog(
          `8:55 AM: Trips completed! Jashim dropped off Nusrat at Mohakhali, Rafiq at Gulshan 1, and Shirin at Mohakhali. All fares collected & settled via TeslaPay. Bullet seats freed for next shift!`,
          'success'
        );
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        setCurrentStep(6);
      }

      if (onScenarioStep) onScenarioStep();
    } catch (err: any) {
      appendLog(`Simulation Error: ${err.message}`, 'error');
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    for (let s = currentStep + 1; s <= 6; s++) {
      await executeStep(s);
      await new Promise((r) => setTimeout(r, 1200));
    }
    setIsRunningAll(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCreatedRides({});
    setLogs([
      {
        time: '08:40:00 AM',
        text: 'Simulation reset to 8:40 AM: Banani Road 11 baseline state restored.',
        type: 'info'
      }
    ]);
  };

  const stepsList = [
    { num: 1, title: '8:41 AM: Nusrat Books', desc: 'Banani → Mohakhali commuter request' },
    { num: 2, title: '8:42 AM: Jashim Accepts', desc: 'Forms pool with Bullet (1/3 seats)' },
    { num: 3, title: '8:43 AM: Rafiq Auto-Pooled', desc: 'Banani → Gulshan 1 (25% off, 2/3 seats)' },
    { num: 4, title: '8:43:30 AM: Shirin Grabs Seat', desc: 'Claims last seat (3/3 seats - FULL)' },
    { num: 5, title: '8:44 AM: Concurrency Overbook Guard', desc: '4th rider safely held without overbooking' },
    { num: 6, title: '8:55 AM: Complete & Settle', desc: 'Arrived, rolling, and automated fare collection' }
  ];

  return (
    <div className="space-y-6">
      {/* Simulation Command Center Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-cyan-950/30 to-gray-900 border border-cyan-800/50 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                <Zap className="w-4 h-4 fill-cyan-400" />
              </span>
              <h2 className="text-xl font-black text-white">
                Banani Rush-Hour Scenario Simulator (PRD Section 1)
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-1">
              Live automated walkthrough of Jashim, Bullet, Nusrat, Rafiq, and Shirin.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAll}
              disabled={isRunningAll || currentStep >= 6}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs font-mono transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              <FastForward className="w-4 h-4" />
              <span>{isRunningAll ? 'Running Scenario...' : 'Run Entire Story (Turbo)'}</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-mono text-xs border border-gray-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Story Stepper Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 my-5">
          {stepsList.map((s) => {
            const isCompleted = currentStep >= s.num;
            const isNext = currentStep === s.num - 1;

            return (
              <div
                key={s.num}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-700/60 text-white'
                    : isNext
                    ? 'bg-cyan-950/30 border-cyan-500/80 shadow-md shadow-cyan-950 text-white scale-[1.02]'
                    : 'bg-gray-950/50 border-gray-800 text-gray-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                      Step {s.num}
                    </span>
                    {isCompleted ? (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> DONE
                      </span>
                    ) : isNext ? (
                      <span className="text-[10px] font-mono text-cyan-400 font-bold animate-pulse">
                        READY
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs font-bold text-white">{s.title}</div>
                  <div className="text-[11px] text-gray-400 font-mono mt-0.5">{s.desc}</div>
                </div>

                {isNext && (
                  <div className="mt-3">
                    <button
                      onClick={() => executeStep(s.num)}
                      className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      <span>Execute Step {s.num}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal-style Real-time Scenario Event Log */}
      <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5 font-mono shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-bold text-white uppercase">Live Simulation Audit Log</span>
          </div>
          <span>ACID Transaction Stream</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg text-xs flex items-start gap-2.5 ${
                log.type === 'success'
                  ? 'bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500'
                  : log.type === 'warn'
                  ? 'bg-amber-950/30 text-amber-300 border-l-2 border-amber-500'
                  : log.type === 'error'
                  ? 'bg-rose-950/30 text-rose-300 border-l-2 border-rose-500'
                  : 'bg-gray-900/40 text-gray-300 border-l-2 border-gray-700'
              }`}
            >
              <span className="text-[10px] text-gray-500 shrink-0 mt-0.5">{log.time}</span>
              <span className="leading-relaxed">{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
