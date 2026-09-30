import { User, DhakaZone, RideRequest, ActivePool, FareBreakdown } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api';

const FALLBACK_USERS: User[] = [
  {
    id: 'user_nusrat',
    email: 'nusrat@dhakatesla.com',
    name: 'Nusrat Jahan',
    role: 'PASSENGER',
    phone: '+8801711000001',
    wallet_poysha: 150000,
    wallet_bdt: 1500,
    token: 'jwt-demo-token-nusrat'
  },
  {
    id: 'user_rafiq',
    email: 'rafiq@dhakatesla.com',
    name: 'Rafiqul Islam',
    role: 'PASSENGER',
    phone: '+8801711000002',
    wallet_poysha: 80000,
    wallet_bdt: 800,
    token: 'jwt-demo-token-rafiq'
  },
  {
    id: 'user_shirin',
    email: 'shirin@dhakatesla.com',
    name: 'Shirin Akter',
    role: 'PASSENGER',
    phone: '+8801711000003',
    wallet_poysha: 200000,
    wallet_bdt: 2000,
    token: 'jwt-demo-token-shirin'
  },
  {
    id: 'user_sakib',
    email: 'mhim2580@gmail.com',
    name: 'Sakib Hasan',
    role: 'PASSENGER',
    phone: '01711223344',
    wallet_poysha: 50000,
    wallet_bdt: 500,
    token: 'jwt-demo-token-sakib'
  },
  {
    id: 'user_jashim',
    email: 'jashim@dhakatesla.com',
    name: 'Jashim Uddin (Pilot)',
    role: 'DRIVER',
    phone: '+8801711000004',
    wallet_poysha: 50000,
    wallet_bdt: 500,
    token: 'jwt-demo-token-jashim'
  }
];

export const DEFAULT_ZONES: DhakaZone[] = [
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

interface StoredUser extends User {
  password?: string;
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem('dhaka_tesla_custom_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUser(user: StoredUser) {
  try {
    const users = getStoredUsers();
    const idx = users.findIndex(
      (u) => u.email.toLowerCase() === user.email.toLowerCase() || u.phone === user.phone
    );
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem('dhaka_tesla_custom_users', JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to save user to localStorage', e);
  }
}

function getStoredRides(): RideRequest[] {
  try {
    const raw = localStorage.getItem('dhaka_tesla_my_rides');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredRides(rides: RideRequest[]) {
  try {
    localStorage.setItem('dhaka_tesla_my_rides', JSON.stringify(rides));
  } catch (e) {
    console.warn('Failed to save rides to localStorage', e);
  }
}

function calculateMockFare(pickup: string, destination: string, seats: number = 1) {
  const pZone = DEFAULT_ZONES.find((z) => z.id === pickup);
  const dZone = DEFAULT_ZONES.find((z) => z.id === destination);
  let distanceKm = 2.4;
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

  const baseFarePoysha = 3000 * seats;
  const distanceFarePoysha = Math.round(distanceKm * 1500) * seats;
  const subtotalPoysha = baseFarePoysha + distanceFarePoysha;
  const discountPoysha = Math.round(subtotalPoysha * 0.25);
  const finalFarePoysha = Math.max(2500 * seats, subtotalPoysha - discountPoysha);

  return {
    distanceKm,
    baseFarePoysha,
    baseFareBdt: baseFarePoysha / 100,
    distanceFarePoysha,
    distanceFareBdt: distanceFarePoysha / 100,
    subtotalPoysha,
    subtotalBdt: subtotalPoysha / 100,
    discountPoysha,
    discountBdt: discountPoysha / 100,
    discountPercent: 25,
    finalFarePoysha,
    finalFareBdt: finalFarePoysha / 100
  };
}

export class ApiService {
  private static token: string | null = null;

  public static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('dhaka_tesla_token', token);
    } else {
      localStorage.removeItem('dhaka_tesla_token');
    }
  }

  public static getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('dhaka_tesla_token');
    }
    return this.token;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    let text = '';
    try {
      text = await res.text();
    } catch {
      text = '';
    }

    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }
    }

    if (!res.ok) {
      if (res.status === 502 || res.status === 504 || res.status === 503) {
        throw new Error('Backend server is currently offline or unreachable on port 5000.');
      }
      throw new Error(data.error || data.message || `API Request Failed (${res.status})`);
    }
    return data;
  }

  // Auth & Cast
  public static async getDemoUsers(): Promise<User[]> {
    try {
      const data = await this.request<{ cast: User[] }>('/auth/demo-users');
      return data.cast;
    } catch {
      const custom = getStoredUsers();
      return [...custom, ...FALLBACK_USERS];
    }
  }

  public static async login(identifier: string, password = 'password123'): Promise<{ user: User; token: string }> {
    const cleanIdent = identifier.trim().toLowerCase();

    try {
      const data = await this.request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });
      data.user.token = data.token;
      this.setToken(data.token);
      saveStoredUser({ ...data.user, password });
      return data;
    } catch (err: any) {
      // 1. Check local registered custom users
      const storedUsers = getStoredUsers();
      const customMatch = storedUsers.find(
        (u) =>
          (u.email.toLowerCase() === cleanIdent || u.phone === cleanIdent || u.name.toLowerCase().includes(cleanIdent)) &&
          (!u.password || u.password === password)
      );
      if (customMatch) {
        const token = customMatch.token || `jwt-${customMatch.id}`;
        this.setToken(token);
        return { user: { ...customMatch, token }, token };
      }

      // 2. Check fallback demo users
      const demoMatch = FALLBACK_USERS.find(
        (u) => u.email.toLowerCase() === cleanIdent || u.phone === cleanIdent || u.name.toLowerCase().includes(cleanIdent)
      );
      if (demoMatch) {
        const token = demoMatch.token || `jwt-${demoMatch.id}`;
        this.setToken(token);
        return { user: { ...demoMatch, token }, token };
      }

      // 3. User friendly message if backend is unreachable
      if (err.message === 'Failed to fetch' || err.message?.includes('NetworkError') || err.message?.includes('offline')) {
        throw new Error('Backend is waking up or not yet connected. Free tier Render instances take ~45s to spin up. Please retry in a moment!');
      }

      throw err;
    }
  }

  public static async register(payload: {
    name: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword?: string;
    role: 'PASSENGER' | 'DRIVER';
  }): Promise<{ user: User; token: string }> {
    try {
      const data = await this.request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      data.user.token = data.token;
      this.setToken(data.token);
      saveStoredUser({ ...data.user, password: payload.password });
      return data;
    } catch (err: any) {
      // Re-throw server validation or conflict errors
      if (
        err.message &&
        !err.message.includes('offline') &&
        !err.message.includes('unreachable') &&
        !err.message.includes('Failed to fetch') &&
        !err.message.includes('NetworkError')
      ) {
        throw err;
      }
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        wallet_poysha: 50000,
        wallet_bdt: 500,
        token: `jwt-user-${Date.now()}`
      };
      this.setToken(newUser.token!);
      saveStoredUser({ ...newUser, password: payload.password });
      return { user: newUser, token: newUser.token! };
    }
  }

  public static async getMe(): Promise<User> {
    try {
      const data = await this.request<{ user: User }>('/auth/me');
      return data.user;
    } catch (err) {
      const token = this.getToken();
      if (token) {
        const storedUsers = getStoredUsers();
        const found = storedUsers.find((u) => u.token === token || `jwt-${u.id}` === token);
        if (found) return found;
        const demoFound = FALLBACK_USERS.find((u) => u.token === token);
        if (demoFound) return demoFound;
      }
      throw err;
    }
  }

  public static async topupWallet(amountBdt: number): Promise<{ wallet_bdt: number }> {
    try {
      return await this.request<{ wallet_bdt: number }>('/auth/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({ amountBdt })
      });
    } catch {
      const token = this.getToken();
      const users = getStoredUsers();
      const user = users.find((u) => u.token === token || `jwt-${u.id}` === token);
      if (user) {
        user.wallet_bdt = (user.wallet_bdt || 0) + amountBdt;
        user.wallet_poysha = user.wallet_bdt * 100;
        saveStoredUser(user);
        return { wallet_bdt: user.wallet_bdt };
      }
      return { wallet_bdt: 500 + amountBdt };
    }
  }

  // Zones
  public static async getZones(): Promise<DhakaZone[]> {
    try {
      const data = await this.request<{ zones: DhakaZone[] }>('/zones');
      return data.zones;
    } catch {
      return DEFAULT_ZONES;
    }
  }

  // Rides & Pooling
  public static async estimateFare(
    pickupZone: string,
    destinationZone: string,
    requestedSeats = 1
  ): Promise<{
    distanceKm: number;
    soloFare: FareBreakdown;
    pooledFare: FareBreakdown;
    potentialSavingsBdt: number;
  }> {
    try {
      return await this.request('/rides/estimate', {
        method: 'POST',
        body: JSON.stringify({ pickupZone, destinationZone, requestedSeats })
      });
    } catch {
      const fare = calculateMockFare(pickupZone, destinationZone, requestedSeats);
      return {
        distanceKm: fare.distanceKm,
        soloFare: {
          pickupZoneId: pickupZone,
          destinationZoneId: destinationZone,
          distanceKm: fare.distanceKm,
          requestedSeats,
          baseFareBdt: fare.baseFareBdt,
          baseFarePoysha: fare.baseFarePoysha,
          distanceFareBdt: fare.distanceFareBdt,
          distanceFarePoysha: fare.distanceFarePoysha,
          subtotalBdt: fare.subtotalBdt,
          subtotalPoysha: fare.subtotalPoysha,
          discountBdt: 0,
          discountPercent: 0,
          discountPoysha: 0,
          finalFareBdt: fare.subtotalBdt,
          finalFarePoysha: fare.subtotalPoysha,
          isPooled: false,
          currency: 'BDT',
          explanation: `${requestedSeats > 1 ? `${requestedSeats} Seats: ` : ''}Solo Ride (Standard Fleet)`
        },
        pooledFare: {
          pickupZoneId: pickupZone,
          destinationZoneId: destinationZone,
          distanceKm: fare.distanceKm,
          requestedSeats,
          baseFareBdt: fare.baseFareBdt,
          baseFarePoysha: fare.baseFarePoysha,
          distanceFareBdt: fare.distanceFareBdt,
          distanceFarePoysha: fare.distanceFarePoysha,
          subtotalBdt: fare.subtotalBdt,
          subtotalPoysha: fare.subtotalPoysha,
          discountBdt: fare.discountBdt,
          discountPercent: 25,
          discountPoysha: fare.discountPoysha,
          finalFareBdt: fare.finalFareBdt,
          finalFarePoysha: fare.finalFarePoysha,
          isPooled: true,
          currency: 'BDT',
          explanation: `${requestedSeats > 1 ? `${requestedSeats} Seats: ` : ''}Pooled Ride (25% Discount corridor incentive)`
        },
        potentialSavingsBdt: fare.discountBdt
      };
    }
  }

  public static async requestRide(params: {
    pickupZone: string;
    destinationZone: string;
    requestedSeats?: number;
    paymentMethod?: 'CASH' | 'TESLAPAY';
    passenger?: User;
  }): Promise<{ message: string; ride: RideRequest }> {
    try {
      const res = await this.request<{ message: string; ride: RideRequest }>('/rides', {
        method: 'POST',
        body: JSON.stringify({
          pickupZone: params.pickupZone,
          destinationZone: params.destinationZone,
          requestedSeats: params.requestedSeats,
          paymentMethod: params.paymentMethod
        })
      });
      const stored = getStoredRides();
      stored.unshift(res.ride);
      saveStoredRides(stored);
      return res;
    } catch (err: any) {
      if (err.message && err.message.includes('must be different')) {
        throw err;
      }

      // Offline / Cold-start fallback
      const token = this.getToken();
      const users = getStoredUsers();
      const currentUser: User =
        params.passenger ||
        users.find((u) => u.token === token || `jwt-${u.id}` === token) ||
        FALLBACK_USERS.find((u) => u.token === token || `jwt-${u.id}` === token) || {
          id: 'user_local',
          name: 'Commuter',
          email: 'guest@dhakatesla.com',
          phone: '01711223344',
          role: 'PASSENGER',
          wallet_bdt: 500,
          wallet_poysha: 50000
        };

      const fare = calculateMockFare(params.pickupZone, params.destinationZone, params.requestedSeats || 1);

      const newRide: RideRequest = {
        id: `ride_${Date.now()}`,
        passenger_id: currentUser.id,
        passenger_name: currentUser.name,
        passenger_phone: currentUser.phone,
        pickup_zone: params.pickupZone,
        destination_zone: params.destinationZone,
        requested_seats: params.requestedSeats || 1,
        status: 'REQUESTED',
        pool_id: 'pool_banani_01',
        distance_km: fare.distanceKm,
        base_fare_poysha: fare.baseFarePoysha,
        distance_fare_poysha: fare.distanceFarePoysha,
        discount_poysha: fare.discountPoysha,
        final_fare_poysha: fare.finalFarePoysha,
        final_fare_bdt: fare.finalFareBdt,
        payment_method: params.paymentMethod || 'TESLAPAY',
        payment_status: params.paymentMethod === 'TESLAPAY' ? 'PAID' : 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        driver: {
          name: 'Jashim Uddin (Pilot)',
          phone: '+8801711000004',
          vehicle_name: 'Dhaka Tesla Bullet #01',
          license_plate: 'DHK-METRO-HA-1234'
        }
      };

      if (params.paymentMethod === 'TESLAPAY' && currentUser.wallet_bdt) {
        currentUser.wallet_bdt = Math.max(0, currentUser.wallet_bdt - fare.finalFareBdt);
        currentUser.wallet_poysha = currentUser.wallet_bdt * 100;
        saveStoredUser(currentUser as any);
      }

      const stored = getStoredRides();
      stored.unshift(newRide);
      saveStoredRides(stored);

      return {
        message: 'Ride request dispatched to Banani electric corridor!',
        ride: newRide
      };
    }
  }

  public static async getRide(id: string): Promise<RideRequest> {
    try {
      const data = await this.request<{ ride: RideRequest }>(`/rides/${id}`);
      return data.ride;
    } catch {
      const stored = getStoredRides();
      const found = stored.find((r) => r.id === id);
      if (found) return found;
      throw new Error('Ride not found');
    }
  }

  public static async getMyHistory(passengerId?: string): Promise<RideRequest[]> {
    try {
      const data = await this.request<{ rides: RideRequest[] }>('/rides/my-history');
      if (data.rides && data.rides.length > 0) {
        const existing = getStoredRides();
        const map = new Map(existing.map((r) => [r.id, r]));
        for (const r of data.rides) {
          map.set(r.id, r);
        }
        saveStoredRides(Array.from(map.values()));
      }
      return data.rides;
    } catch {
      const allRides = getStoredRides();
      const currentToken = this.getToken();
      let targetId = passengerId;
      if (!targetId && currentToken) {
        const storedUsers = getStoredUsers();
        const found = storedUsers.find((u) => u.token === currentToken || `jwt-${u.id}` === currentToken);
        if (found) targetId = found.id;
        if (!targetId) {
          const demoFound = FALLBACK_USERS.find((u) => u.token === currentToken || `jwt-${u.id}` === currentToken);
          if (demoFound) targetId = demoFound.id;
        }
      }
      if (targetId) {
        return allRides.filter((r) => r.passenger_id === targetId);
      }
      return allRides;
    }
  }

  public static async cancelRide(id: string, reason = 'Cancelled by passenger'): Promise<RideRequest> {
    try {
      const data = await this.request<{ ride: RideRequest }>(`/rides/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      return data.ride;
    } catch {
      const rides = getStoredRides();
      const ride = rides.find((r) => r.id === id);
      if (ride) {
        ride.status = 'CANCELLED';
        ride.cancellation_reason = reason;
        ride.updated_at = new Date().toISOString();
        saveStoredRides(rides);
        return ride;
      }
      throw new Error('Ride not found');
    }
  }

  // Driver Endpoints
  public static async getDriverActivePool(): Promise<ActivePool | null> {
    try {
      const data = await this.request<{ activePool: ActivePool | null }>('/driver/active-pool');
      return data.activePool;
    } catch {
      const rides = getStoredRides();
      const activeRides = rides.filter(
        (r) => r.status === 'MATCHED' || r.status === 'DRIVER_ARRIVED' || r.status === 'STARTED'
      );
      if (activeRides.length === 0) return null;
      const occupiedSeats = activeRides.reduce((sum, r) => sum + r.requested_seats, 0);
      return {
        pool: {
          id: 'pool_local_01',
          vehicle_id: 'veh_bullet_01',
          vehicle_name: 'Dhaka Tesla Bullet #01',
          license_plate: 'DHK-METRO-HA-1234',
          battery_percent: 84,
          total_capacity: 3,
          occupied_seats: occupiedSeats,
          available_seats: Math.max(0, 3 - occupiedSeats),
          status: 'ACTIVE',
          current_zone: activeRides[0].pickup_zone,
          corridor_direction: 'NORTH_SOUTH',
          created_at: activeRides[0].created_at
        },
        passengers: activeRides.map((r) => ({
          ride_id: r.id,
          passenger_id: r.passenger_id,
          passenger_name: r.passenger_name || 'Passenger',
          passenger_phone: r.passenger_phone || '01711000000',
          pickup_zone: r.pickup_zone,
          destination_zone: r.destination_zone,
          requested_seats: r.requested_seats,
          status: r.status,
          final_fare_bdt: r.final_fare_bdt,
          payment_method: r.payment_method || 'TESLAPAY',
          payment_status: r.payment_status || 'PENDING',
          joined_at: r.created_at
        }))
      };
    }
  }

  public static async getPendingRequests(): Promise<RideRequest[]> {
    try {
      const data = await this.request<{ pendingRequests: RideRequest[] }>('/driver/pending-requests');
      return data.pendingRequests;
    } catch {
      const rides = getStoredRides();
      return rides.filter((r) => r.status === 'REQUESTED');
    }
  }

  public static async acceptRide(rideId: string): Promise<RideRequest> {
    try {
      const data = await this.request<{ ride: RideRequest }>(`/driver/rides/${rideId}/accept`, {
        method: 'POST'
      });
      return data.ride;
    } catch {
      const rides = getStoredRides();
      const ride = rides.find((r) => r.id === rideId);
      if (ride) {
        ride.status = 'MATCHED';
        ride.driver = {
          name: 'Jashim Uddin (Pilot)',
          phone: '+8801711000004',
          vehicle_name: 'Dhaka Tesla Bullet #01',
          license_plate: 'DHK-METRO-HA-1234'
        };
        ride.updated_at = new Date().toISOString();
        saveStoredRides(rides);
        return ride;
      }
      throw new Error('Ride not found');
    }
  }

  public static async markDriverArrived(rideId: string): Promise<RideRequest> {
    try {
      const data = await this.request<{ ride: RideRequest }>(`/driver/rides/${rideId}/arrived`, {
        method: 'POST'
      });
      return data.ride;
    } catch {
      const rides = getStoredRides();
      const ride = rides.find((r) => r.id === rideId);
      if (ride) {
        ride.status = 'DRIVER_ARRIVED';
        ride.updated_at = new Date().toISOString();
        saveStoredRides(rides);
        return ride;
      }
      throw new Error('Ride not found');
    }
  }

  public static async startTrip(rideId: string): Promise<RideRequest> {
    try {
      const data = await this.request<{ ride: RideRequest }>(`/driver/rides/${rideId}/start`, {
        method: 'POST'
      });
      return data.ride;
    } catch {
      const rides = getStoredRides();
      const ride = rides.find((r) => r.id === rideId);
      if (ride) {
        ride.status = 'STARTED';
        ride.updated_at = new Date().toISOString();
        saveStoredRides(rides);
        return ride;
      }
      throw new Error('Ride not found');
    }
  }

  public static async completeTrip(rideId: string): Promise<RideRequest> {
    try {
      const data = await this.request<{ ride: RideRequest }>(`/driver/rides/${rideId}/complete`, {
        method: 'POST'
      });
      return data.ride;
    } catch {
      const rides = getStoredRides();
      const ride = rides.find((r) => r.id === rideId);
      if (ride) {
        ride.status = 'COMPLETED';
        ride.payment_status = 'PAID';
        ride.updated_at = new Date().toISOString();
        saveStoredRides(rides);
        return ride;
      }
      throw new Error('Ride not found');
    }
  }

  public static async getDriverHistory(): Promise<any[]> {
    try {
      const data = await this.request<{ history: any[] }>('/driver/history');
      return data.history;
    } catch {
      const rides = getStoredRides();
      return rides.filter((r) => r.status === 'COMPLETED');
    }
  }

  public static async setVehicleStatus(status: 'ONLINE' | 'OFFLINE' | 'CHARGING'): Promise<any> {
    try {
      return await this.request('/driver/vehicle/status', {
        method: 'POST',
        body: JSON.stringify({ status })
      });
    } catch {
      return { success: true, status };
    }
  }
}
