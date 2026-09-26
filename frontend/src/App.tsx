import React, { useState, useEffect } from 'react';
import { User, DhakaZone, ActivePool, RideRequest } from './types';
import { ApiService } from './lib/api';
import { Navbar } from './components/Navbar';
import { DhakaMapCorridor } from './components/DhakaMapCorridor';
import { PassengerView } from './components/PassengerView';
import { DriverView } from './components/DriverView';
import { LiveScenarioSimulation } from './components/LiveScenarioSimulation';
import { TopupModal } from './components/TopupModal';
import { Radio, ShieldAlert } from 'lucide-react';

export function App() {
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [zones, setZones] = useState<DhakaZone[]>([]);
  const [activeTab, setActiveTab] = useState<'PASSENGER' | 'DRIVER' | 'SIMULATION'>('PASSENGER');
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [activeRides, setActiveRides] = useState<RideRequest[]>([]);

  // Initialize data on mount
  useEffect(() => {
    async function init() {
      try {
        const [users, zonesList] = await Promise.all([
          ApiService.getDemoUsers(),
          ApiService.getZones()
        ]);

        setDemoUsers(users);
        setZones(zonesList);

        // Default to Nusrat (Passenger) for authentic Banani start
        const nusrat = users.find((u) => u.email.includes('nusrat')) || users[0];
        if (nusrat) {
          handleSelectUser(nusrat);
        }
      } catch (err) {
        console.error('Initial data fetch failed:', err);
      }
    }
    init();
  }, []);

  // WebSocket Connection for real-time live push updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
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
          if (data.type === 'RIDE_UPDATED') {
            // Refresh passenger or driver view automatically!
            if (currentUser) {
              refreshCurrentUser();
            }
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onclose = () => {
        setIsWsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    }

    connectWs();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [currentUser?.id]);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    ApiService.setToken(user.token || null);
    if (user.role === 'DRIVER') {
      setActiveTab('DRIVER');
    } else {
      setActiveTab('PASSENGER');
    }
  };

  const refreshCurrentUser = async () => {
    if (!currentUser) return;
    try {
      const updated = await ApiService.getMe();
      setCurrentUser(updated);
    } catch (err) {
      console.error('Error refreshing current user:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        demoUsers={demoUsers}
        onSelectUser={handleSelectUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onTopup={() => setIsTopupOpen(true)}
        isWsConnected={isWsConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Interactive Corridor Map */}
        <DhakaMapCorridor
          zones={zones}
          selectedPickup="BANANI"
          selectedDropoff={currentUser?.role === 'PASSENGER' && currentUser.email.includes('rafiq') ? 'GULSHAN_1' : 'MOHAKHALI'}
          activeRides={activeRides}
        />

        {/* View Switcher based on Tab */}
        {activeTab === 'PASSENGER' && currentUser && (
          <PassengerView
            currentUser={currentUser}
            zones={zones}
            onRideBooked={(ride) => {
              setActiveRides((prev) => [ride, ...prev.filter((r) => r.id !== ride.id)]);
              refreshCurrentUser();
            }}
            onRefreshUser={refreshCurrentUser}
          />
        )}

        {activeTab === 'DRIVER' && currentUser && (
          <DriverView
            currentUser={currentUser}
            onRefreshUser={refreshCurrentUser}
          />
        )}

        {activeTab === 'SIMULATION' && (
          <LiveScenarioSimulation
            demoUsers={demoUsers}
            zones={zones}
            onScenarioStep={refreshCurrentUser}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950 py-6 px-4 text-center text-xs font-mono text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>⚡ Dhaka Tesla Pool (Oi Tesla) • RoBenDevs Engineering Assessment</span>
          <span>ACID Pooling Transactions • Integer Poysha Currency • Jashim & Bullet</span>
        </div>
      </footer>

      {/* Wallet Top-up Modal */}
      <TopupModal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        onSuccess={(newBalance) => {
          if (currentUser) {
            setCurrentUser({ ...currentUser, wallet_bdt: newBalance });
          }
        }}
      />
    </div>
  );
}

export default App;
