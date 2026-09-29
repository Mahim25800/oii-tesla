import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/connection.js';
import { FareEngine } from './FareEngine.js';
import { areRoutesCompatible, getZoneDistance, DHAKA_ZONES } from '../config/zones.js';
import { wsService } from './WebSocketService.js';

export class CapacityExceededError extends Error {
  constructor(message = 'Capacity Exceeded: Not enough seats available in this Dhaka Tesla') {
    super(message);
    this.name = 'CapacityExceededError';
  }
}

export class InvalidStateTransitionError extends Error {
  constructor(message = 'Invalid State Transition: Illegal ride lifecycle transition') {
    super(message);
    this.name = 'InvalidStateTransitionError';
  }
}

export class UnauthorizedRideAccessError extends Error {
  constructor(message = 'Forbidden: You do not have permission to view or modify this ride') {
    super(message);
    this.name = 'UnauthorizedRideAccessError';
  }
}

export interface RideRequestDTO {
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

export class PoolingService {
  /**
   * Creates a ride request and attempts intelligent atomic matching into an existing
   * compatible Tesla Pool (e.g. matching Rafiq into Jashim's Bullet alongside Nusrat).
   */
  public static createRideRequest(params: {
    passengerId: string;
    pickupZone: string;
    destinationZone: string;
    requestedSeats?: number;
    paymentMethod?: 'CASH' | 'TESLAPAY';
    autoPool?: boolean;
  }): RideRequestDTO {
    const db = getDatabase();
    const seats = Math.max(1, params.requestedSeats || 1);

    if (!DHAKA_ZONES[params.pickupZone] || !DHAKA_ZONES[params.destinationZone]) {
      throw new Error(`Invalid zone provided: pickup=${params.pickupZone}, dest=${params.destinationZone}`);
    }

    if (params.pickupZone === params.destinationZone) {
      throw new Error('Pickup and destination cannot be the exact same zone');
    }

    const distanceKm = getZoneDistance(params.pickupZone, params.destinationZone);
    const soloFare = FareEngine.calculateFare({
      pickupZoneId: params.pickupZone,
      destinationZoneId: params.destinationZone,
      requestedSeats: seats,
      isPooled: false
    });

    const rideId = uuidv4();
    const paymentMethod = params.paymentMethod || 'TESLAPAY';

    /* --- Atomic Ride Request Persistence --- */
    const executeBooking = db.transaction(() => {
      db.prepare(`
        INSERT INTO ride_requests (
          id, passenger_id, pickup_zone, destination_zone, requested_seats,
          status, pool_id, distance_km, base_fare_poysha, distance_fare_poysha,
          discount_poysha, final_fare_poysha, payment_method, payment_status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'REQUESTED', NULL, ?, ?, ?, 0, ?, ?, 'PENDING', datetime('now'), datetime('now'))
      `).run(
        rideId,
        params.passengerId,
        params.pickupZone,
        params.destinationZone,
        seats,
        distanceKm,
        soloFare.baseFarePoysha,
        soloFare.distanceFarePoysha,
        soloFare.finalFarePoysha,
        paymentMethod
      );

      db.prepare(`
        INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, details)
        VALUES (?, 'RIDE_REQUEST', ?, 'REQUEST_CREATED', ?, ?)
      `).run(
        uuidv4(),
        rideId,
        params.passengerId,
        JSON.stringify({ pickup: params.pickupZone, destination: params.destinationZone, seats, farePoysha: soloFare.finalFarePoysha })
      );

      // Automated matching trigger (utilized during automated simulation runs)
      if (params.autoPool) {
        const candidatePools = db.prepare(`
          SELECT p.id, p.vehicle_id, p.driver_id, p.total_capacity, p.occupied_seats, p.status, p.current_zone,
                 v.name as vehicle_name, v.license_plate
          FROM pools p
          JOIN vehicles v ON v.id = p.vehicle_id
          WHERE p.status IN ('FORMING', 'ACTIVE')
            AND (p.total_capacity - p.occupied_seats) >= ?
          ORDER BY p.created_at ASC
        `).all(seats) as any[];

        for (const pool of candidatePools) {
          // Find existing rides in this pool to verify corridor route compatibility
          const existingMembers = db.prepare(`
            SELECT r.pickup_zone, r.destination_zone
            FROM pool_memberships pm
            JOIN ride_requests r ON r.id = pm.ride_request_id
            WHERE pm.pool_id = ? AND pm.status = 'ACTIVE'
          `).all(pool.id) as { pickup_zone: string; destination_zone: string }[];

          let isCompatible = true;
          for (const member of existingMembers) {
            const check = areRoutesCompatible(
              member.pickup_zone,
              member.destination_zone,
              params.pickupZone,
              params.destinationZone
            );
            if (!check.compatible) {
              isCompatible = false;
              break;
            }
          }

          if (isCompatible) {
            // Guard: capacity ceiling invariant (occupied + requested <= capacity)
            const freshPool = db.prepare('SELECT occupied_seats, total_capacity FROM pools WHERE id = ?').get(pool.id) as any;
            if (freshPool.occupied_seats + seats > freshPool.total_capacity) {
              continue;
            }

            const pooledFare = FareEngine.calculateFare({
              pickupZoneId: params.pickupZone,
              destinationZoneId: params.destinationZone,
              requestedSeats: seats,
              isPooled: true
            });

            db.prepare(`
              UPDATE pools 
              SET occupied_seats = occupied_seats + ?, updated_at = datetime('now')
              WHERE id = ?
            `).run(seats, pool.id);

            db.prepare(`
              INSERT INTO pool_memberships (id, pool_id, ride_request_id, seats_allocated, status, joined_at)
              VALUES (?, ?, ?, ?, 'ACTIVE', datetime('now'))
            `).run(uuidv4(), pool.id, rideId, seats);

            db.prepare(`
              UPDATE ride_requests
              SET status = 'MATCHED',
                  pool_id = ?,
                  discount_poysha = ?,
                  final_fare_poysha = ?,
                  updated_at = datetime('now')
              WHERE id = ?
            `).run(pool.id, pooledFare.discountPoysha, pooledFare.finalFarePoysha, rideId);

            // Retroactive pool discount for active co-riders in this corridor
            const activeRideRequests = db.prepare(`
              SELECT r.id, r.pickup_zone, r.destination_zone, r.requested_seats, r.discount_poysha
              FROM ride_requests r
              JOIN pool_memberships pm ON pm.ride_request_id = r.id
              WHERE pm.pool_id = ? AND pm.status = 'ACTIVE' AND r.id != ?
            `).all(pool.id, rideId) as any[];

            for (const otherRide of activeRideRequests) {
              if (otherRide.discount_poysha === 0) {
                const otherPooledFare = FareEngine.calculateFare({
                  pickupZoneId: otherRide.pickup_zone,
                  destinationZoneId: otherRide.destination_zone,
                  requestedSeats: otherRide.requested_seats,
                  isPooled: true
                });

                db.prepare(`
                  UPDATE ride_requests
                  SET discount_poysha = ?,
                      final_fare_poysha = ?,
                      updated_at = datetime('now')
                  WHERE id = ?
                `).run(otherPooledFare.discountPoysha, otherPooledFare.finalFarePoysha, otherRide.id);
              }
            }

            db.prepare(`
              INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, details)
              VALUES (?, 'POOL', ?, 'SEAT_ALLOCATED', ?, ?)
            `).run(
              uuidv4(),
              pool.id,
              params.passengerId,
              JSON.stringify({
                rideId,
                seatsAllocated: seats,
                newOccupiedSeats: freshPool.occupied_seats + seats,
                capacity: freshPool.total_capacity,
                poolDiscountApplied: pooledFare.discountPoysha
              })
            );

            break;
          }
        }
      }
    });

    executeBooking();
    const result = this.getRideById(rideId)!;
    wsService.broadcast({ type: 'RIDE_UPDATED', payload: result });
    return result;
  }

  /**
   * Driver accepts a pending ride request or forms a new pool with Jashim's Bullet.
   */
  public static driverAcceptRide(driverId: string, rideRequestId: string): RideRequestDTO {
    const db = getDatabase();

    /* --- Driver Acceptance & Electric Corridor Pool Formation --- */
    const acceptTransaction = db.transaction(() => {
      const vehicle = db.prepare('SELECT id, total_capacity, name, license_plate FROM vehicles WHERE driver_id = ?').get(driverId) as any;
      if (!vehicle) {
        throw new Error('Driver does not own an active Dhaka Tesla vehicle');
      }

      const ride = db.prepare('SELECT * FROM ride_requests WHERE id = ?').get(rideRequestId) as any;
      if (!ride) {
        throw new Error('Ride request not found');
      }

      if (ride.status !== 'REQUESTED') {
        throw new InvalidStateTransitionError(`Cannot accept ride with status ${ride.status}. Must be REQUESTED.`);
      }

      let pool = db.prepare(`
        SELECT * FROM pools 
        WHERE driver_id = ? AND status IN ('FORMING', 'ACTIVE')
      `).get(driverId) as any;

      if (!pool) {
        const poolId = uuidv4();
        db.prepare(`
          INSERT INTO pools (
            id, vehicle_id, driver_id, status, total_capacity, occupied_seats,
            current_zone, corridor_direction, created_at, updated_at
          ) VALUES (?, ?, ?, 'FORMING', ?, 0, ?, ?, datetime('now'), datetime('now'))
        `).run(
          poolId,
          vehicle.id,
          driverId,
          vehicle.total_capacity,
          ride.pickup_zone,
          `${ride.pickup_zone}->${ride.destination_zone}`
        );

        pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(poolId) as any;
      }

      // Hard Invariant: Occupied seats cannot exceed fixed vehicle capacity (C = 3)
      if (pool.occupied_seats + ride.requested_seats > pool.total_capacity) {
        throw new CapacityExceededError(
          `Cannot allocate ${ride.requested_seats} seat(s). Vehicle '${vehicle.name}' has only ${pool.total_capacity - pool.occupied_seats} seat(s) remaining out of ${pool.total_capacity}.`
        );
      }

      db.prepare(`
        UPDATE pools 
        SET occupied_seats = occupied_seats + ?, status = 'FORMING', updated_at = datetime('now')
        WHERE id = ?
      `).run(ride.requested_seats, pool.id);

      db.prepare(`
        INSERT INTO pool_memberships (id, pool_id, ride_request_id, seats_allocated, status, joined_at)
        VALUES (?, ?, ?, ?, 'ACTIVE', datetime('now'))
      `).run(uuidv4(), pool.id, ride.id, ride.requested_seats);

      const activeMembers = db.prepare(`
        SELECT r.id, r.pickup_zone, r.destination_zone, r.requested_seats
        FROM ride_requests r
        JOIN pool_memberships pm ON pm.ride_request_id = r.id
        WHERE pm.pool_id = ? AND pm.status = 'ACTIVE'
      `).all(pool.id) as any[];

      const isPooled = activeMembers.length > 1;

      if (isPooled) {
        for (const member of activeMembers) {
          const pooledFare = FareEngine.calculateFare({
            pickupZoneId: member.pickup_zone,
            destinationZoneId: member.destination_zone,
            requestedSeats: member.requested_seats,
            isPooled: true
          });

          db.prepare(`
            UPDATE ride_requests
            SET status = 'MATCHED',
                pool_id = ?,
                discount_poysha = ?,
                final_fare_poysha = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `).run(pool.id, pooledFare.discountPoysha, pooledFare.finalFarePoysha, member.id);
        }
      } else {
        db.prepare(`
          UPDATE ride_requests
          SET status = 'MATCHED', pool_id = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(pool.id, ride.id);
      }

      db.prepare(`
        INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, details)
        VALUES (?, 'RIDE_REQUEST', ?, 'MATCHED', ?, ?)
      `).run(
        uuidv4(),
        ride.id,
        driverId,
        JSON.stringify({ poolId: pool.id, vehicle: vehicle.name, occupiedSeats: pool.occupied_seats + ride.requested_seats, isPooled })
      );
    });

    acceptTransaction();
    const result = this.getRideById(rideRequestId)!;
    wsService.broadcast({ type: 'RIDE_UPDATED', payload: result });
    wsService.broadcast({ type: 'POOL_UPDATED', payload: { poolId: result.pool_id } });
    return result;
  }

  /**
   * Driver marks arrival at passenger pickup location
   */
  public static markDriverArrived(driverId: string, rideRequestId: string): RideRequestDTO {
    const db = getDatabase();
    const ride = db.prepare(`
      SELECT r.*, p.driver_id 
      FROM ride_requests r
      LEFT JOIN pools p ON p.id = r.pool_id
      WHERE r.id = ?
    `).get(rideRequestId) as any;

    if (!ride) throw new Error('Ride request not found');
    if (ride.status !== 'MATCHED') {
      throw new InvalidStateTransitionError(`Cannot transition from '${ride.status}' to 'DRIVER_ARRIVED'. Must be MATCHED.`);
    }
    if (ride.driver_id !== driverId) throw new UnauthorizedRideAccessError('Only the assigned driver can mark arrival');

    db.prepare(`
      UPDATE ride_requests 
      SET status = 'DRIVER_ARRIVED', updated_at = datetime('now') 
      WHERE id = ?
    `).run(rideRequestId);

    db.prepare(`
      INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, details)
      VALUES (?, 'RIDE_REQUEST', ?, 'DRIVER_ARRIVED', ?, ?)
    `).run(uuidv4(), rideRequestId, driverId, JSON.stringify({ timestamp: new Date().toISOString() }));

    const result = this.getRideById(rideRequestId)!;
    wsService.broadcast({ type: 'RIDE_UPDATED', payload: result });
    return result;
  }

  /**
   * Driver starts the trip (Tesla is rolling through Dhaka traffic)
   */
  public static startTrip(driverId: string, rideRequestId: string): RideRequestDTO {
    const db = getDatabase();
    const ride = db.prepare(`
      SELECT r.*, p.driver_id, p.id as pool_id
      FROM ride_requests r
      LEFT JOIN pools p ON p.id = r.pool_id
      WHERE r.id = ?
    `).get(rideRequestId) as any;

    if (!ride) throw new Error('Ride request not found');
    if (ride.status !== 'DRIVER_ARRIVED' && ride.status !== 'MATCHED') {
      throw new InvalidStateTransitionError(`Cannot start trip with status '${ride.status}'. Driver must be matched or arrived.`);
    }
    if (ride.driver_id !== driverId) throw new UnauthorizedRideAccessError('Only the assigned driver can start the trip');

    db.transaction(() => {
      db.prepare(`
        UPDATE ride_requests 
        SET status = 'STARTED', updated_at = datetime('now') 
        WHERE id = ?
      `).run(rideRequestId);

      db.prepare(`
        UPDATE pools 
        SET status = 'ACTIVE', updated_at = datetime('now') 
        WHERE id = ?
      `).run(ride.pool_id);

      db.prepare(`
        INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, details)
        VALUES (?, 'RIDE_REQUEST', ?, 'STARTED', ?, ?)
      `).run(uuidv4(), rideRequestId, driverId, JSON.stringify({ timestamp: new Date().toISOString() }));
    })();

    const result = this.getRideById(rideRequestId)!;
    wsService.broadcast({ type: 'RIDE_UPDATED', payload: result });
    return result;
  }

  /**
   * Driver completes the trip and collects fare (Cash or TeslaPay automated debit)
   */
  public static completeTrip(driverId: string, rideRequestId: string): RideRequestDTO {
    const db = getDatabase();
    const ride = db.prepare(`
      SELECT r.*, p.driver_id, p.id as pool_id
      FROM ride_requests r
      LEFT JOIN pools p ON p.id = r.pool_id
      WHERE r.id = ?
    `).get(rideRequestId) as any;

    if (!ride) throw new Error('Ride request not found');
    if (ride.status !== 'STARTED') {
      throw new InvalidStateTransitionError(`Cannot complete trip with status '${ride.status}'. Trip must be STARTED.`);
    }
    if (ride.driver_id !== driverId) throw new UnauthorizedRideAccessError('Only the assigned driver can complete this trip');

    /* --- Financial Settlement (Integer Poysha) & Seat Deallocation --- */
    db.transaction(() => {
      if (ride.payment_method === 'TESLAPAY') {
        const passenger = db.prepare('SELECT wallet_poysha FROM users WHERE id = ?').get(ride.passenger_id) as any;
        if (passenger && passenger.wallet_poysha >= ride.final_fare_poysha) {
          db.prepare('UPDATE users SET wallet_poysha = wallet_poysha - ? WHERE id = ?').run(ride.final_fare_poysha, ride.passenger_id);
          db.prepare('UPDATE users SET wallet_poysha = wallet_poysha + ? WHERE id = ?').run(ride.final_fare_poysha, driverId);
          db.prepare("UPDATE ride_requests SET payment_status = 'PAID' WHERE id = ?").run(rideRequestId);
        } else {
          // Graceful fallback to cash collection if wallet balance is below fare
          db.prepare("UPDATE ride_requests SET payment_method = 'CASH', payment_status = 'PAID' WHERE id = ?").run(rideRequestId);
        }
      } else {
        db.prepare("UPDATE ride_requests SET payment_status = 'PAID' WHERE id = ?").run(rideRequestId);
      }

      db.prepare(`
        UPDATE ride_requests 
        SET status = 'COMPLETED', updated_at = datetime('now') 
        WHERE id = ?
      `).run(rideRequestId);

      db.prepare(`
        UPDATE pool_memberships 
        SET status = 'COMPLETED', completed_at = datetime('now')
        WHERE ride_request_id = ?
      `).run(rideRequestId);

      // Restore vehicle seat availability
      db.prepare(`
        UPDATE pools 
        SET occupied_seats = MAX(0, occupied_seats - ?), updated_at = datetime('now')
        WHERE id = ?
      `).run(ride.requested_seats, ride.pool_id);

      const remainingActive = db.prepare(`
        SELECT COUNT(*) as count 
        FROM pool_memberships 
        WHERE pool_id = ? AND status = 'ACTIVE'
      `).get(ride.pool_id) as { count: number };

      if (remainingActive.count === 0) {
        db.prepare(`UPDATE pools SET status = 'COMPLETED', updated_at = datetime('now') WHERE id = ?`).run(ride.pool_id);
      }

      db.prepare(`
        INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, details)
        VALUES (?, 'RIDE_REQUEST', ?, 'COMPLETED', ?, ?)
      `).run(uuidv4(), rideRequestId, driverId, JSON.stringify({ fareCollectedPoysha: ride.final_fare_poysha, paymentMethod: ride.payment_method }));
    })();

    const result = this.getRideById(rideRequestId)!;
    wsService.broadcast({ type: 'RIDE_UPDATED', payload: result });
    return result;
  }

  /**
   * Passenger cancels their ride. Valid only before the trip has STARTED.
   * If already matched in a pool, atomic rollback frees the seat for another commuter!
   */
  public static cancelRide(userId: string, rideRequestId: string, reason = 'Cancelled by passenger'): RideRequestDTO {
    const db = getDatabase();
    const ride = db.prepare('SELECT * FROM ride_requests WHERE id = ?').get(rideRequestId) as any;

    if (!ride) throw new Error('Ride request not found');

    // Only owner passenger or assigned driver/admin can cancel
    const isOwner = ride.passenger_id === userId;
    let isAssignedDriver = false;
    if (ride.pool_id) {
      const pool = db.prepare('SELECT driver_id FROM pools WHERE id = ?').get(ride.pool_id) as any;
      if (pool && pool.driver_id === userId) {
        isAssignedDriver = true;
      }
    }

    if (!isOwner && !isAssignedDriver) {
      throw new UnauthorizedRideAccessError('You are not authorized to cancel this ride request');
    }

    // Cancellation constraint: Cannot cancel if STARTED or COMPLETED
    if (ride.status === 'STARTED' || ride.status === 'COMPLETED') {
      throw new InvalidStateTransitionError(`Cannot cancel a ride that is already in '${ride.status}' status`);
    }

    if (ride.status === 'CANCELLED') {
      return this.getRideById(rideRequestId)!; // Already cancelled
    }

    db.transaction(() => {
      db.prepare(`
        UPDATE ride_requests 
        SET status = 'CANCELLED', cancellation_reason = ?, cancelled_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(reason, rideRequestId);

      if (ride.pool_id) {
        // Restore pool capacity invariant upon cancellation
        db.prepare(`
          UPDATE pools 
          SET occupied_seats = MAX(0, occupied_seats - ?), updated_at = datetime('now')
          WHERE id = ?
        `).run(ride.requested_seats, ride.pool_id);

        db.prepare(`
          UPDATE pool_memberships 
          SET status = 'CANCELLED' 
          WHERE ride_request_id = ?
        `).run(rideRequestId);
      }

      db.prepare(`
        INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, details)
        VALUES (?, 'RIDE_REQUEST', ?, 'CANCELLED', ?, ?)
      `).run(uuidv4(), rideRequestId, userId, JSON.stringify({ reason }));
    })();

    const result = this.getRideById(rideRequestId)!;
    wsService.broadcast({ type: 'RIDE_UPDATED', payload: result });
    return result;
  }

  /**
   * Retrieves single ride request by ID with full breakdown, driver info, and vehicle specs
   */
  public static getRideById(rideId: string): RideRequestDTO | null {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT r.*, 
             u.name as passenger_name, u.phone as passenger_phone,
             du.name as driver_name, du.phone as driver_phone,
             v.name as vehicle_name, v.license_plate
      FROM ride_requests r
      JOIN users u ON u.id = r.passenger_id
      LEFT JOIN pools p ON p.id = r.pool_id
      LEFT JOIN users du ON du.id = p.driver_id
      LEFT JOIN vehicles v ON v.id = p.vehicle_id
      WHERE r.id = ?
    `).get(rideId) as any;

    if (!row) return null;

    return {
      id: row.id,
      passenger_id: row.passenger_id,
      passenger_name: row.passenger_name,
      passenger_phone: row.passenger_phone,
      pickup_zone: row.pickup_zone,
      destination_zone: row.destination_zone,
      requested_seats: row.requested_seats,
      status: row.status,
      pool_id: row.pool_id,
      distance_km: row.distance_km,
      base_fare_poysha: row.base_fare_poysha,
      distance_fare_poysha: row.distance_fare_poysha,
      discount_poysha: row.discount_poysha,
      final_fare_poysha: row.final_fare_poysha,
      final_fare_bdt: row.final_fare_poysha / 100,
      payment_method: row.payment_method,
      payment_status: row.payment_status,
      cancellation_reason: row.cancellation_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
      driver: row.driver_name ? {
        name: row.driver_name,
        phone: row.driver_phone,
        vehicle_name: row.vehicle_name,
        license_plate: row.license_plate
      } : undefined
    };
  }

  /**
   * Passenger history: retrieves ride history strictly for the calling passenger
   */
  public static getPassengerRides(passengerId: string): RideRequestDTO[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT r.*, 
             u.name as passenger_name, u.phone as passenger_phone,
             du.name as driver_name, du.phone as driver_phone,
             v.name as vehicle_name, v.license_plate
      FROM ride_requests r
      JOIN users u ON u.id = r.passenger_id
      LEFT JOIN pools p ON p.id = r.pool_id
      LEFT JOIN users du ON du.id = p.driver_id
      LEFT JOIN vehicles v ON v.id = p.vehicle_id
      WHERE r.passenger_id = ?
      ORDER BY r.created_at DESC
    `).all(passengerId) as any[];

    return rows.map(row => ({
      id: row.id,
      passenger_id: row.passenger_id,
      passenger_name: row.passenger_name,
      passenger_phone: row.passenger_phone,
      pickup_zone: row.pickup_zone,
      destination_zone: row.destination_zone,
      requested_seats: row.requested_seats,
      status: row.status,
      pool_id: row.pool_id,
      distance_km: row.distance_km,
      base_fare_poysha: row.base_fare_poysha,
      distance_fare_poysha: row.distance_fare_poysha,
      discount_poysha: row.discount_poysha,
      final_fare_poysha: row.final_fare_poysha,
      final_fare_bdt: row.final_fare_poysha / 100,
      payment_method: row.payment_method,
      payment_status: row.payment_status,
      cancellation_reason: row.cancellation_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
      driver: row.driver_name ? {
        name: row.driver_name,
        phone: row.driver_phone,
        vehicle_name: row.vehicle_name,
        license_plate: row.license_plate
      } : undefined
    }));
  }

  /**
   * Driver and Passenger dashboard: retrieves current active pool assignment or corridor pool
   */
  public static getDriverActivePool(userId: string, role?: string) {
    const db = getDatabase();
    let pool: any = null;

    if (role === 'DRIVER') {
      pool = db.prepare(`
        SELECT p.*, v.name as vehicle_name, v.license_plate, v.battery_percent
        FROM pools p
        JOIN vehicles v ON v.id = p.vehicle_id
        WHERE p.driver_id = ? AND p.status IN ('FORMING', 'ACTIVE')
        ORDER BY p.created_at DESC
        LIMIT 1
      `).get(userId) as any;
    } else {
      // 1. Check if user is a passenger currently assigned to an active pool
      pool = db.prepare(`
        SELECT p.*, v.name as vehicle_name, v.license_plate, v.battery_percent
        FROM pools p
        JOIN vehicles v ON v.id = p.vehicle_id
        JOIN pool_memberships pm ON pm.pool_id = p.id
        JOIN ride_requests r ON r.id = pm.ride_request_id
        WHERE r.passenger_id = ? AND pm.status = 'ACTIVE' AND p.status IN ('FORMING', 'ACTIVE')
        ORDER BY p.created_at DESC
        LIMIT 1
      `).get(userId) as any;

      // 2. If passenger is not yet pooled, find the active corridor Bullet pool so HUD shows live vehicle telemetry
      if (!pool) {
        pool = db.prepare(`
          SELECT p.*, v.name as vehicle_name, v.license_plate, v.battery_percent
          FROM pools p
          JOIN vehicles v ON v.id = p.vehicle_id
          WHERE p.status IN ('FORMING', 'ACTIVE')
          ORDER BY p.created_at DESC
          LIMIT 1
        `).get() as any;
      }
    }

    if (!pool) return null;

    // Get passengers in this pool
    const passengers = db.prepare(`
      SELECT r.id as ride_id, r.passenger_id, u.name as passenger_name, u.phone as passenger_phone,
             r.pickup_zone, r.destination_zone, r.requested_seats, r.status, r.final_fare_poysha,
             r.payment_method, r.payment_status, pm.joined_at
      FROM pool_memberships pm
      JOIN ride_requests r ON r.id = pm.ride_request_id
      JOIN users u ON u.id = r.passenger_id
      WHERE pm.pool_id = ? AND pm.status = 'ACTIVE'
    `).all(pool.id) as any[];

    return {
      pool: {
        id: pool.id,
        vehicle_id: pool.vehicle_id,
        vehicle_name: pool.vehicle_name,
        license_plate: pool.license_plate,
        battery_percent: pool.battery_percent,
        total_capacity: pool.total_capacity,
        occupied_seats: pool.occupied_seats,
        available_seats: pool.total_capacity - pool.occupied_seats,
        status: pool.status,
        current_zone: pool.current_zone,
        corridor_direction: pool.corridor_direction,
        created_at: pool.created_at
      },
      passengers: passengers.map(p => ({
        ...p,
        final_fare_bdt: p.final_fare_poysha / 100
      }))
    };
  }

  /**
   * Returns all pending unassigned ride requests waiting for pickup
   */
  public static getPendingRideRequests(): RideRequestDTO[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT r.*, u.name as passenger_name, u.phone as passenger_phone
      FROM ride_requests r
      JOIN users u ON u.id = r.passenger_id
      WHERE r.status = 'REQUESTED'
      ORDER BY r.created_at ASC
    `).all() as any[];

    return rows.map(r => ({
      ...r,
      final_fare_bdt: r.final_fare_poysha / 100
    }));
  }

  /**
   * Driver's completed trip history
   */
  public static getDriverHistory(driverId: string) {
    const db = getDatabase();
    return db.prepare(`
      SELECT p.id as pool_id, p.status, p.corridor_direction, p.created_at, p.updated_at,
             COUNT(pm.id) as total_passengers,
             SUM(r.final_fare_poysha) as total_earnings_poysha
      FROM pools p
      LEFT JOIN pool_memberships pm ON pm.pool_id = p.id
      LEFT JOIN ride_requests r ON r.id = pm.ride_request_id AND r.status = 'COMPLETED'
      WHERE p.driver_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 20
    `).all(driverId) as any[];
  }
}
