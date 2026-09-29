import React, { useState, useEffect } from 'react';
import { User, DhakaZone, ActivePool, RideRequest } from './types';
import { ApiService } from './lib/api';
import { Navbar } from './components/Navbar';
import { HeroShowcase } from './components/HeroShowcase';
import { BentoShowcase } from './components/BentoShowcase';
import { DhakaMapCorridor } from './components/DhakaMapCorridor';
import { PassengerView } from './components/PassengerView';
import { DriverView } from './components/DriverView';
import { LiveScenarioSimulation } from './components/LiveScenarioSimulation';
import { TopupModal } from './components/TopupModal';
import { AuthModal } from './components/AuthModal';
import { BulletSeatHUD } from './components/BulletSeatHUD';
import { Zap, ShieldCheck, Heart, Radio, MapPin, ArrowRight, UserCircle, Car } from 'lucide-react';

const DEFAULT_DEMO_USERS: User[] = [
  {
    id: 'user_nusrat',
    email: 'nusrat@dhakatesla.com',
    name: 'Nusrat Jahan',
    role: 'PASSENGER',
    phone: '+8801711000001',
    wallet_poysha: 150000,
    wallet_bdt: 1500
  },
  {
    id: 'user_rafiq',
    email: 'rafiq@dhakatesla.com',
    name: 'Rafiqul Islam',
    role: 'PASSENGER',
    phone: '+8801711000002',
    wallet_poysha: 80000,
    wallet_bdt: 800
  },
  {
    id: 'user_shirin',
    email: 'shirin@dhakatesla.com',
    name: 'Shirin Akter',
    role: 'PASSENGER',
    phone: '+8801711000003',
    wallet_poysha: 200000,
    wallet_bdt: 2000
  },
  {
    id: 'user_jashim',
    email: 'jashim@dhakatesla.com',
    name: 'Jashim Uddin (Pilot)',
    role: 'DRIVER',
    phone: '+8801711000004',
    wallet_poysha: 50000,
    wallet_bdt: 500
  }
];

const DEFAULT_ZONES: DhakaZone[] = [
  { id: 'BANANI', name: 'Banani Road 11', bnName: 'বনানী ১১', latitude: 23.7937, longitude: 90.4066, corridor: 'BANANI_CORRIDOR', description: 'Commercial & dining hub' },
  { id: 'GULSHAN_2', name: 'Gulshan 2 Circle', bnName: 'গুলশান ২', latitude: 23.7948, longitude: 90.4143, corridor: 'BANANI_CORRIDOR', description: 'Diplomatic zone' },
  { id: 'GULSHAN_1', name: 'Gulshan 1 Circle', bnName: 'গুলশান ১', latitude: 23.7785, longitude: 90.4168, corridor: 'GULSHAN_MOHAKHALI_CORRIDOR', description: 'Rafiq destination' },
  { id: 'MOHAKHALI', name: 'Mohakhali Wireless', bnName: 'মহাখালী', latitude: 23.7776, longitude: 90.4054, corridor: 'GULSHAN_MOHAKHALI_CORRIDOR', description: 'Nusrat destination' },
  { id: 'FARMGATE', name: 'Farmgate', bnName: 'ফার্মগেট', latitude: 23.7561, longitude: 90.3872, corridor: 'CENTRAL_CORRIDOR', description: 'Major transit crossing' },
  { id: 'DHANMONDI', name: 'Dhanmondi 27', bnName: 'ধানমন্ডি ২৭', latitude: 23.7533, longitude: 90.3769, corridor: 'WEST_CORRIDOR', description: 'Residential & university corridor' },
  { id: 'MIRPUR_10', name: 'Mirpur 10 Circle', bnName: 'মিরপুর ১০', latitude: 23.8070, longitude: 90.3686, corridor: 'MIRPUR_CORRIDOR', description: 'Metro rail interchange' },
  { id: 'UTTARA_3', name: 'Uttara Sector 3', bnName: 'উত্তরা ৩', latitude: 23.8680, longitude: 90.3980, corridor: 'NORTH_CORRIDOR', description: 'Airport highway residential gate' },
  { id: 'BADDA', name: 'Badda Link Road', bnName: 'বাড্ডা লিংক রোড', latitude: 23.7806, longitude: 90.4267, corridor: 'EAST_CORRIDOR', description: 'Pragoti Sarani connection' },
  { id: 'TEJGAON', name: 'Tejgaon I/A', bnName: 'তেজগাঁও', latitude: 23.7684, longitude: 90.3995, corridor: 'CENTRAL_CORRIDOR', description: 'Industrial & tech zone' }
];

export default function App() {
  const [demoUsers, setDemoUsers] = useState<User[]>(DEFAULT_DEMO_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [zones, setZones] = useState<DhakaZone[]>(DEFAULT_ZONES);
  const [activeTab, setActiveTab] = useState<'HOME' | 'PASSENGER' | 'DRIVER' | 'SIMULATION'>('HOME');
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [activeRides, setActiveRides] = useState<RideRequest[]>([]);
  const [activePool, setActivePool] = useState<ActivePool | null>(null);

  // Initialize data on mount with resilient fallbacks
  useEffect(() => {
    async function init() {
      try {
        const [users, zonesList] = await Promise.all([
          ApiService.getDemoUsers().catch(() => []),
          ApiService.getZones().catch(() => [])
        ]);

        if (users && users.length > 0) {
          setDemoUsers(users);
        }
        if (zonesList && zonesList.length > 0) {
          setZones(zonesList);
        }

        const savedToken = ApiService.getToken();
        if (savedToken) {
          try {
            const me = await ApiService.getMe();
            if (me) {
              const fullUser: User = { ...me, token: savedToken };
              setCurrentUser(fullUser);
            }
          } catch {
            ApiService.setToken(null);
          }
        }
      } catch (err) {
        console.warn('Initial data fetch fallback active:', err);
      }
    }
    init();
  }, []);

  // WebSocket Connection for real-time live push updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect directly to backend port 5000 in dev mode to eliminate Vite proxy socket churn
    const wsHost = window.location.port === '3000'
      ? `${window.location.hostname}:5000`
      : window.location.host;
    const wsUrl = (import.meta.env.VITE_WS_URL as string) || `${protocol}//${wsHost}/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connectWs() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'RIDE_UPDATED' || data.type === 'POOL_UPDATED') {
            refreshData();
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onclose = () => {
        setIsWsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 5000);
      };

      ws.onerror = () => {
        // Handled silently by onclose to prevent terminal noise when server restarts
      };
    }

    connectWs();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const handleSelectUser = (user: User | null) => {
    if (!user) {
      setCurrentUser(null);
      ApiService.setToken(null);
      return;
    }
    const token = user.token || ApiService.getToken();
    const userWithToken: User = { ...user, token: token || undefined };
    setCurrentUser(userWithToken);
    if (token) {
      ApiService.setToken(token);
    }
    refreshData();
  };

  const handleSignOut = () => {
    handleSelectUser(null);
    setActiveTab('HOME');
  };

  const handleAuthSuccess = (user: User) => {
    setDemoUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.map((u) => (u.id === user.id ? user : u));
      }
      return [user, ...prev];
    });
    handleSelectUser(user);
    if (user.role === 'DRIVER') {
      setActiveTab('DRIVER');
    } else {
      setActiveTab('PASSENGER');
    }
  };

  // Tab switcher: prompts auth if attempting to open passenger or driver cockpit without signing in
  const handleSelectTab = (tab: 'HOME' | 'PASSENGER' | 'DRIVER' | 'SIMULATION', overrideUser?: User) => {
    setActiveTab(tab);
    if (overrideUser) {
      handleSelectUser(overrideUser);
      return;
    }
    if (!currentUser && (tab === 'PASSENGER' || tab === 'DRIVER')) {
      setIsAuthOpen(true);
    }
  };

  const refreshData = async () => {
    try {
      const [pool, users] = await Promise.all([
        ApiService.getDriverActivePool().catch(() => null),
        ApiService.getDemoUsers().catch(() => [])
      ]);
      setActivePool(pool);
      if (currentUser) {
        try {
          const me = await ApiService.getMe();
          if (me) {
            setCurrentUser(prev => prev ? { ...prev, ...me, token: prev.token || ApiService.getToken() || undefined } : null);
          }
        } catch {
          const updated = users.find(u => u.id === currentUser.id);
          if (updated) {
            setCurrentUser(prev => prev ? { ...prev, ...updated, token: prev.token || updated.token } : updated);
          }
        }
      }
    } catch (err) {
      console.error('Data refresh error:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser?.id]);

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col selection:bg-[#D2F832] selection:text-black font-sans relative">
      
      {/* Background Ambient Radial Glow (Hardware-accelerated CSS gradient, zero subpixel blur jitter) */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(circle 750px at 50% 0%, rgba(210, 248, 50, 0.08) 0%, transparent 70%)'
        }}
      />

      {/* FLOATING PILL NAVBAR */}
      <Navbar
        currentUser={currentUser}
        demoUsers={demoUsers}
        onSelectUser={handleSelectUser}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onTopup={() => setIsTopupOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        isWsConnected={isWsConnected}
      />

      {/* MAIN VIEW CONTENT */}
      <main className="flex-1">
        {activeTab === 'HOME' && (
          <div>
            {/* Hero Showcase with 3D Perspective Phones */}
            <HeroShowcase
              currentUser={currentUser}
              zones={zones}
              activePool={activePool}
              activeRides={activeRides}
              onOpenApp={handleSelectTab}
              onTopup={() => setIsTopupOpen(true)}
            />

            {/* Bento Grid Showcase */}
            <BentoShowcase
              onOpenSimulator={() => handleSelectTab('SIMULATION')}
              onOpenPassenger={() => handleSelectTab('PASSENGER')}
            />

            {/* Embedded Live Corridor Map Section */}
            <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-mono text-[#D2F832] uppercase tracking-wider block mb-1">
                    Telemetry & Routing
                  </span>
                  <h3 className="text-3xl font-extrabold text-white">
                    Banani-Mohakhali Corridor Map
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 font-mono max-w-md">
                  Real-time geographic visualization of Banani Road 11 pickup hub, Gulshan links, and Mohakhali destination lanes.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 min-w-0">
                  <DhakaMapCorridor
                    zones={zones}
                    activeRides={activeRides}
                  />
                </div>
                <div className="lg:col-span-4 min-w-0">
                  <BulletSeatHUD activePool={activePool} />
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'PASSENGER' && (
          <div className="pt-8 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#D2F832] uppercase font-bold tracking-wider">
                  Commuter Portal
                </span>
                <h2 className="text-3xl font-black text-white tracking-tight mt-1">
                  Ride Pooling & Booking
                </h2>
              </div>
              <button
                onClick={() => handleSelectTab('SIMULATION')}
                className="hidden sm:flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-xs font-mono text-zinc-300"
              >
                <Radio className="w-3.5 h-3.5 text-[#D2F832] animate-pulse" />
                <span>Open Story Simulator</span>
              </button>
            </div>

            {!currentUser ? (
              <div className="p-12 text-center bg-[#121216]/60 border border-white/10 rounded-[32px] max-w-xl mx-auto backdrop-blur-xl shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-[#D2F832] text-black flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#D2F832]/25">
                  <UserCircle className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Commuter Sign In Required</h3>
                <p className="text-xs text-zinc-400 mb-6 max-w-md mx-auto">
                  Please sign in or create an account to request Banani corridor rides, pool seats, and split fares seamlessly.
                </p>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-[#D2F832] text-black font-extrabold text-xs px-6 py-3 rounded-full hover:bg-[#c2e825] transition-all shadow-md shadow-[#D2F832]/20"
                >
                  Sign In / Create Account
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 min-w-0">
                  <PassengerView
                    currentUser={currentUser}
                    zones={zones}
                    onRideBooked={() => refreshData()}
                    onRefreshUser={() => refreshData()}
                    onTopup={() => setIsTopupOpen(true)}
                  />
                </div>
                <div className="lg:col-span-4 min-w-0 space-y-6">
                  <BulletSeatHUD activePool={activePool} />
                  <DhakaMapCorridor zones={zones} />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'DRIVER' && (
          <div className="pt-8 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#D2F832] uppercase font-bold tracking-wider">
                  Pilot Portal
                </span>
                <h2 className="text-3xl font-black text-white tracking-tight mt-1">
                  Tesla Cockpit — "Bullet"
                </h2>
              </div>
              <button
                onClick={() => handleSelectTab('SIMULATION')}
                className="hidden sm:flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-xs font-mono text-zinc-300"
              >
                <Radio className="w-3.5 h-3.5 text-[#D2F832] animate-pulse" />
                <span>Open Story Simulator</span>
              </button>
            </div>

            {!currentUser || currentUser.role !== 'DRIVER' ? (
              <div className="p-12 text-center bg-[#121216]/60 border border-white/10 rounded-[32px] max-w-xl mx-auto backdrop-blur-xl shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-[#D2F832] text-black flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#D2F832]/25">
                  <Car className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">
                  {!currentUser ? 'Tesla Pilot Sign In Required' : 'Driver Account Required'}
                </h3>
                <p className="text-xs text-zinc-400 mb-6 max-w-md mx-auto">
                  {!currentUser 
                    ? 'Please sign in with a registered Tesla Pilot account (e.g. Jashim Uddin) to operate Bullet and accept pooled riders.'
                    : `You are currently logged in as a Passenger (${currentUser.name}). Switch to a Tesla Pilot account to access this cockpit.`}
                </p>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-[#D2F832] text-black font-extrabold text-xs px-6 py-3 rounded-full hover:bg-[#c2e825] transition-all shadow-md shadow-[#D2F832]/20"
                >
                  {!currentUser ? 'Sign In as Pilot' : 'Switch to Pilot Account'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 min-w-0">
                  <DriverView
                    currentUser={currentUser}
                    onRefreshUser={() => refreshData()}
                  />
                </div>
                <div className="lg:col-span-4 min-w-0 space-y-6">
                  <BulletSeatHUD activePool={activePool} />
                  <DhakaMapCorridor zones={zones} />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'SIMULATION' && (
          <div className="pt-8 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="mb-6">
              <span className="text-xs font-mono text-[#D2F832] uppercase font-bold tracking-wider">
                Automated Invariant Demonstration
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight mt-1">
                PRD Banani Rush-Hour Story Runner
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 min-w-0">
                <LiveScenarioSimulation onSimulationStep={() => refreshData()} />
              </div>
              <div className="lg:col-span-4 min-w-0 space-y-6">
                <BulletSeatHUD activePool={activePool} />
                <DhakaMapCorridor zones={zones} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* EDITORIAL TECH FOOTER */}
      <footer className="border-t border-white/10 bg-[#0C0C0F] py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#D2F832] flex items-center justify-center text-black shadow-md shadow-[#D2F832]/20">
              <Zap className="w-4 h-4 fill-black" />
            </div>
            <div>
              <span className="font-black text-sm text-white tracking-tight">DHAKA TESLA POOL</span>
              <p className="text-[11px] text-zinc-500 font-mono">
                Share a seat. Split the fare. Survive Dhaka traffic.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-[#D2F832]" />
              Capacity Invariant: C ≤ 3 Seats
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Zap className="w-4 h-4 text-[#D2F832]" />
              Integer Poysha: ৳1 = 100 Poysha
            </span>
            <span className="text-zinc-600">
              Dhaka Tesla v1.0.0
            </span>
          </div>
        </div>
      </footer>

      {/* AUTH MODAL (SIGN IN / SIGN UP) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* TOP-UP MODAL */}
      <TopupModal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        currentUser={currentUser}
        onSuccess={() => refreshData()}
      />

    </div>
  );
}
