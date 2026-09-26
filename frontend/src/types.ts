export interface DhakaZone {
  id: string;
  name: string;
  bnName: string;
  latitude: number;
  longitude: number;
  corridor: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  wallet_poysha: number;
  wallet_bdt: number;
  token?: string;
  vehicle?: Vehicle | null;
}

export interface Vehicle {
  id: string;
  name: string;
  license_plate: string;
  total_capacity: number;
  battery_percent: number;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'CHARGING';
  current_zone?: string;
}

export interface FareBreakdown {
  pickupZoneId: string;
  destinationZoneId: string;
  distanceKm: number;
  requestedSeats: number;
  baseFareBdt: number;
  distanceFareBdt: number;
  subtotalBdt: number;
  discountBdt: number;
  discountPercent: number;
  finalFareBdt: number;
  isPooled: boolean;
  currency: 'BDT';
  explanation: string;
}

export interface RideRequest {
  id: string;
  passenger_id: string;
  passenger_name?: string;
  passenger_phone?: string;
  pickup_zone: string;
  destination_zone: string;
  requested_seats: number;
  status: 'REQUESTED' | 'MATCHED' | 'DRIVER_ARRIVED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  pool_id: string | null;
  distance_km: number;
  base_fare_poysha: number;
  distance_fare_poysha: number;
  discount_poysha: number;
  final_fare_poysha: number;
  final_fare_bdt: number;
  payment_method: 'CASH' | 'TESLAPAY';
  payment_status: 'PENDING' | 'PAID' | 'REFUNDED';
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  driver?: {
    name: string;
    phone: string;
    vehicle_name: string;
    license_plate: string;
  };
}

export interface ActivePool {
  pool: {
    id: string;
    vehicle_id: string;
    vehicle_name: string;
    license_plate: string;
    battery_percent: number;
    total_capacity: number;
    occupied_seats: number;
    available_seats: number;
    status: 'FORMING' | 'ACTIVE' | 'COMPLETED';
    current_zone: string;
    corridor_direction: string;
    created_at: string;
  };
  passengers: Array<{
    ride_id: string;
    passenger_id: string;
    passenger_name: string;
    passenger_phone: string;
    pickup_zone: string;
    destination_zone: string;
    requested_seats: number;
    status: string;
    final_fare_bdt: number;
    payment_method: string;
    payment_status: string;
    joined_at: string;
  }>;
}
