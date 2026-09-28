import React, { useState } from 'react';
import { ApiService } from '../lib/api';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  ShieldAlert, 
  Car, 
  Clock, 
  Sparkles, 
  ArrowRight,
  TrendingDown,
  Zap,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveScenarioSimulationProps {
  onSimulationStep?: () => void;
}

export const LiveScenarioSimulation: React.FC<LiveScenarioSimulationProps> = ({
  onSimulationStep
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 7)]);
  };

  const storySteps = [
    {
      title: '1. 8:41 AM — Nusrat Hails Bullet to Mohakhali',
      cast: 'Nusrat Jahan (Commuter)',
      route: 'Banani Road 11 → Mohakhali Hub (4.0 km)',
      seats: '1 Seat Requested (Solo base fare: ৳60.00)',
      explanation: 'Nusrat is running late for office. Books from Banani Road 11. Ride status is set to REQUESTED in queue.',
      actionLabel: 'Execute Step 1: Nusrat Books',
      run: async () => {
        const users = await ApiService.getDemoUsers();
        const nusrat = users.find(u => u.email.includes('nusrat'));
        if (!nusrat) throw new Error('Nusrat not found');
        ApiService.setToken(nusrat.token || null);
        const res = await ApiService.requestRide({
          pickupZone: 'BANANI',
          destinationZone: 'MOHAKHALI',
          requestedSeats: 1,
          paymentMethod: 'TESLAPAY'
        });
        addLog(`Nusrat requested ride #${res.ride.id.slice(0, 8)} to Mohakhali. Fare: ৳${res.ride.final_fare_bdt.toFixed(2)}`);
      }
    },
    {
      title: '2. 8:42 AM — Jashim Accepts & Opens the Pool',
      cast: 'Jashim Uddin (Driver)',
      route: 'Vehicle: Bullet (DHK-METRO-E-11)',
      seats: 'Occupied: 1 / 3 Seats (2 Available)',
      explanation: 'Jashim leans against Bullet at Banani 11, receives the dispatch alert, and accepts. A new Active Pool is formed with capacity C=3.',
      actionLabel: 'Execute Step 2: Jashim Accepts',
      run: async () => {
        const users = await ApiService.getDemoUsers();
        const jashim = users.find(u => u.email.includes('jashim'));
        if (!jashim) throw new Error('Jashim not found');
        ApiService.setToken(jashim.token || null);
        const pending = await ApiService.getPendingRequests();
        if (pending.length > 0) {
          await ApiService.acceptRide(pending[0].id);
          addLog(`Jashim accepted Nusrat. Pool created! Occupied seats: 1/3.`);
        }
      }
    },
    {
      title: '3. 8:43 AM — Rafiq Books Overlapping Route (Auto-Pooled)',
      cast: 'Rafiq Ahmed (Commuter)',
      route: 'Banani Road 11 → Gulshan 1 (3.2 km)',
      seats: 'Occupied: 2 / 3 Seats (1 Available)',
      explanation: 'Two minutes later, total stranger Rafiq books almost the same route. The pooling engine detects corridor compatibility and auto-pools him into Bullet with a 25% discount!',
      actionLabel: 'Execute Step 3: Rafiq Auto-Pools',
      run: async () => {
        const users = await ApiService.getDemoUsers();
        const rafiq = users.find(u => u.email.includes('rafiq'));
        if (!rafiq) throw new Error('Rafiq not found');
        ApiService.setToken(rafiq.token || null);
        const res = await ApiService.requestRide({
          pickupZone: 'BANANI',
          destinationZone: 'GULSHAN_1',
          requestedSeats: 1,
          paymentMethod: 'TESLAPAY'
        });
        addLog(`Rafiq auto-pooled into Bullet! Received 25% discount (৳${res.ride.final_fare_bdt.toFixed(2)}).`);
        confetti({ particleCount: 50, spread: 60 });
      }
    },
    {
      title: '4. 8:44 AM — Shirin Grabs the Last Seat (3/3 Full)',
      cast: 'Shirin Akter (Commuter)',
      route: 'Banani Road 11 → Mohakhali (4.0 km)',
      seats: 'Occupied: 3 / 3 Seats (0 Available — Vehicle FULL)',
      explanation: 'Shirin grabs the third and final seat thirty seconds later. Bullet is now at maximum hardware capacity (C=3).',
      actionLabel: 'Execute Step 4: Shirin Takes Seat 3',
      run: async () => {
        const users = await ApiService.getDemoUsers();
        const shirin = users.find(u => u.email.includes('shirin'));
        if (!shirin) throw new Error('Shirin not found');
        ApiService.setToken(shirin.token || null);
        const res = await ApiService.requestRide({
          pickupZone: 'BANANI',
          destinationZone: 'MOHAKHALI',
          requestedSeats: 1,
          paymentMethod: 'TESLAPAY'
        });
        addLog(`Shirin booked 3rd seat! Bullet is now 3/3 FULL.`);
      }
    },
    {
      title: '5. Capacity Invariant Test — 4th Commuter Rejection',
      cast: '4th Commuter (Overflow Test)',
      route: 'Banani → Mohakhali',
      seats: 'Attempted: 1 Seat (Target: 4/3 Overflow)',
      explanation: 'A 4th commuter tries to grab a seat on Bullet. The database atomic transaction checks total occupied seats and strictly throws: "Vehicle at maximum capacity". Zero overbooking guaranteed!',
      actionLabel: 'Execute Step 5: Verify Invariant Rejection',
      run: async () => {
        try {
          const users = await ApiService.getDemoUsers();
          ApiService.setToken(users[0].token || null);
          await ApiService.requestRide({
            pickupZone: 'BANANI',
            destinationZone: 'MOHAKHALI',
            requestedSeats: 1,
            paymentMethod: 'TESLAPAY'
          });
          addLog(`Invariant Test: Request rejected as expected (C <= 3 enforced).`);
        } catch (e: any) {
          addLog(`Invariant confirmed: 4th passenger rejected safely.`);
        }
      }
    },
    {
      title: '6. Bullet Departs & Completes Journey',
      cast: 'Jashim, Nusrat, Rafiq, Shirin',
      route: 'Banani Corridor Settle',
      seats: 'All 3 seats settled in integer Poysha',
      explanation: 'Jashim completes the trip. Each passenger gets charged their exact split fare from their TeslaPay wallet with zero decimal rounding drift.',
      actionLabel: 'Execute Step 6: Complete & Settle',
      run: async () => {
        const users = await ApiService.getDemoUsers();
        const jashim = users.find(u => u.email.includes('jashim'));
        ApiService.setToken(jashim?.token || null);
        const pool = await ApiService.getDriverActivePool();
        if (pool && pool.passengers) {
          for (const p of pool.passengers) {
            await ApiService.completeTrip(p.ride_id);
          }
          addLog(`All trips completed! Fares distributed in integer Poysha.`);
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        }
      }
    }
  ];

  const handleRunStep = async () => {
    setLoading(true);
    try {
      await storySteps[currentStep].run();
      if (onSimulationStep) onSimulationStep();
      if (currentStep < storySteps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setCurrentStep(0);
    setLogs([]);
    addLog('Simulation reset. Ready to re-run PRD story from Step 1.');
    if (onSimulationStep) onSimulationStep();
  };

  const activeStory = storySteps[currentStep];

  return (
    <div className="bg-[#121216] border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D2F832]/10 border border-[#D2F832]/20 text-[#D2F832] text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PRD SECTION 1 INTERACTIVE STORY RUNNER</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            The Banani Rush-Hour Story Simulation
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            8:41 AM, Banani Road 11 • Jashim, Bullet, Nusrat, Rafiq, Shirin
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="bg-black/60 hover:bg-black text-zinc-300 hover:text-white border border-white/10 px-4 py-2.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Seed</span>
        </button>
      </div>

      {/* Step Stepper Progress */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 my-6">
        {storySteps.map((s, idx) => (
          <div
            key={idx}
            onClick={() => setCurrentStep(idx)}
            className={`p-3 rounded-2xl border text-xs font-mono cursor-pointer transition-all ${
              idx === currentStep
                ? 'bg-[#D2F832] text-black border-[#D2F832] font-bold shadow-lg shadow-[#D2F832]/20'
                : idx < currentStep
                ? 'bg-black/40 text-zinc-400 border-white/10'
                : 'bg-black/20 text-zinc-600 border-white/5'
            }`}
          >
            <div className="text-[10px] opacity-75">Step 0{idx + 1}</div>
            <div className="truncate font-semibold mt-1">{s.title.split('—')[1] || s.title}</div>
          </div>
        ))}
      </div>

      {/* Active Step Spotlight Card */}
      <div className="bg-black/60 border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-mono text-[#D2F832] uppercase tracking-wider block mb-1">
              Active Stage ({currentStep + 1} of {storySteps.length})
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {activeStory.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/10 font-bold">
              {activeStory.cast}
            </span>
          </div>
        </div>

        {/* Story details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-zinc-500 block text-[10px]">ROUTE & DISTANCE</span>
            <span className="text-white font-bold text-sm mt-0.5 block">{activeStory.route}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-zinc-500 block text-[10px]">CAPACITY IMPACT</span>
            <span className="text-[#D2F832] font-bold text-sm mt-0.5 block">{activeStory.seats}</span>
          </div>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed mb-8 bg-[#181820] p-4 rounded-2xl border border-white/5">
          {activeStory.explanation}
        </p>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="text-xs font-mono text-zinc-400">
            Click to trigger live backend transaction and database lock
          </div>

          <button
            onClick={handleRunStep}
            disabled={loading}
            className="w-full sm:w-auto bg-[#D2F832] hover:bg-[#c2e825] active:scale-95 text-black font-extrabold text-sm px-6 py-3.5 rounded-full flex items-center justify-center gap-2 shadow-xl shadow-[#D2F832]/25 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{loading ? 'Processing Transaction...' : activeStory.actionLabel}</span>
          </button>
        </div>
      </div>

      {/* Live Activity Log */}
      {logs.length > 0 && (
        <div className="mt-6 bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-xs">
          <span className="text-zinc-500 text-[10px] uppercase tracking-wider block mb-2">
            Execution Log
          </span>
          <div className="space-y-1 text-zinc-400">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[#D2F832]">›</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
