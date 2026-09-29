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
    return this.request<{ wallet_bdt: number }>('/auth/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amountBdt })
    });
  }

  // Zones
  public static async getZones(): Promise<DhakaZone[]> {
    const data = await this.request<{ zones: DhakaZone[] }>('/zones');
    return data.zones;
  }

  // Rides & Pooling
  public static async estimateFare(pickupZone: string, destinationZone: string, requestedSeats = 1): Promise<{
    distanceKm: number;
    soloFare: FareBreakdown;
    pooledFare: FareBreakdown;
    potentialSavingsBdt: number;
  }> {
    return this.request('/rides/estimate', {
      method: 'POST',
      body: JSON.stringify({ pickupZone, destinationZone, requestedSeats })
    });
  }

  public static async requestRide(params: {
    pickupZone: string;
    destinationZone: string;
    requestedSeats?: number;
    paymentMethod?: 'CASH' | 'TESLAPAY';
  }): Promise<{ message: string; ride: RideRequest }> {
    return this.request('/rides', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  public static async getRide(id: string): Promise<RideRequest> {
    const data = await this.request<{ ride: RideRequest }>(`/rides/${id}`);
    return data.ride;
  }

  public static async getMyHistory(): Promise<RideRequest[]> {
    const data = await this.request<{ rides: RideRequest[] }>('/rides/my-history');
    return data.rides;
  }

  public static async cancelRide(id: string, reason = 'Cancelled by passenger'): Promise<RideRequest> {
    const data = await this.request<{ ride: RideRequest }>(`/rides/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return data.ride;
  }

  // Driver Endpoints
  public static async getDriverActivePool(): Promise<ActivePool | null> {
    const data = await this.request<{ activePool: ActivePool | null }>('/driver/active-pool');
    return data.activePool;
  }

  public static async getPendingRequests(): Promise<RideRequest[]> {
    const data = await this.request<{ pendingRequests: RideRequest[] }>('/driver/pending-requests');
    return data.pendingRequests;
  }

  public static async acceptRide(rideId: string): Promise<RideRequest> {
    const data = await this.request<{ ride: RideRequest }>(`/driver/rides/${rideId}/accept`, {
      method: 'POST'
    });
    return data.ride;
  }

  public static async markDriverArrived(rideId: string): Promise<RideRequest> {
    const data = await this.request<{ ride: RideRequest }>(`/driver/rides/${rideId}/arrived`, {
      method: 'POST'
    });
    return data.ride;
  }

  public static async startTrip(rideId: string): Promise<RideRequest> {
    const data = await this.request<{ ride: RideRequest }>(`/driver/rides/${rideId}/start`, {
      method: 'POST'
    });
    return data.ride;
  }

  public static async completeTrip(rideId: string): Promise<RideRequest> {
    const data = await this.request<{ ride: RideRequest }>(`/driver/rides/${rideId}/complete`, {
      method: 'POST'
    });
    return data.ride;
  }

  public static async getDriverHistory(): Promise<any[]> {
    const data = await this.request<{ history: any[] }>('/driver/history');
    return data.history;
  }

  public static async setVehicleStatus(status: 'ONLINE' | 'OFFLINE' | 'CHARGING'): Promise<any> {
    return this.request('/driver/vehicle/status', {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }
}
