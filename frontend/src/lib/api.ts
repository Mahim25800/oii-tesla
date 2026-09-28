import { User, DhakaZone, RideRequest, ActivePool, FareBreakdown } from '../types';

const API_BASE = '/api';

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

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'API Request Failed');
    }
    return data;
  }

  // Auth & Cast
  public static async getDemoUsers(): Promise<User[]> {
    const data = await this.request<{ cast: User[] }>('/auth/demo-users');
    return data.cast;
  }

  public static async login(identifier: string, password = 'password123'): Promise<{ user: User; token: string }> {
    const data = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    this.setToken(data.token);
    return data;
  }

  public static async getMe(): Promise<User> {
    const data = await this.request<{ user: User }>('/auth/me');
    return data.user;
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
