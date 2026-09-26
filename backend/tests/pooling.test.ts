import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { runSeed, SeedDataResult } from '../src/database/seed.js';
import { generateToken } from '../src/middleware/auth.js';

describe('Banani Rush-Hour Pooling & Invariant Tests', () => {
  const app = createApp();
  let seed: SeedDataResult;
  let jashimToken: string;
  let nusratToken: string;
  let rafiqToken: string;
  let shirinToken: string;

  beforeEach(() => {
    seed = runSeed();
    jashimToken = generateToken({ id: seed.driver.id, role: 'DRIVER', email: seed.driver.email });
    nusratToken = generateToken({ id: seed.passengers.nusrat.id, role: 'PASSENGER', email: seed.passengers.nusrat.email });
    rafiqToken = generateToken({ id: seed.passengers.rafiq.id, role: 'PASSENGER', email: seed.passengers.rafiq.email });
    shirinToken = generateToken({ id: seed.passengers.shirin.id, role: 'PASSENGER', email: seed.passengers.shirin.email });
  });

  it('Flow 1: Nusrat books Banani -> Mohakhali, Jashim accepts, pool formed', async () => {
    // 1. Nusrat requests ride
    const reqRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${nusratToken}`)
      .send({
        pickupZone: 'BANANI',
        destinationZone: 'MOHAKHALI',
        requestedSeats: 1
      });

    expect(reqRes.status).toBe(201);
    const nusratRideId = reqRes.body.ride.id;
    expect(reqRes.body.ride.status).toBe('REQUESTED');
    expect(reqRes.body.ride.pickup_zone).toBe('BANANI');
    expect(reqRes.body.ride.destination_zone).toBe('MOHAKHALI');

    // 2. Jashim sees pending request
    const pendingRes = await request(app)
      .get('/api/driver/pending-requests')
      .set('Authorization', `Bearer ${jashimToken}`);
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.pendingRequests.length).toBeGreaterThan(0);

    // 3. Jashim accepts Nusrat's ride
    const acceptRes = await request(app)
      .post(`/api/driver/rides/${nusratRideId}/accept`)
      .set('Authorization', `Bearer ${jashimToken}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.ride.status).toBe('MATCHED');

    // 4. Check active pool: Bullet now has 1 occupied seat out of 3
    const poolRes = await request(app)
      .get('/api/driver/active-pool')
      .set('Authorization', `Bearer ${jashimToken}`);

    expect(poolRes.status).toBe(200);
    expect(poolRes.body.activePool.pool.occupied_seats).toBe(1);
    expect(poolRes.body.activePool.pool.available_seats).toBe(2);
    expect(poolRes.body.activePool.pool.total_capacity).toBe(3);
  });

  it('Flow 2: Rafiq books compatible route (Banani -> Gulshan 1) and gets auto-pooled with discount', async () => {
    // First, Nusrat books and Jashim accepts
    const nusratRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${nusratToken}`)
      .send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI', requestedSeats: 1 });
    await request(app)
      .post(`/api/driver/rides/${nusratRes.body.ride.id}/accept`)
      .set('Authorization', `Bearer ${jashimToken}`);

    // Two minutes later, Rafiq books Banani -> Gulshan 1
    const rafiqRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${rafiqToken}`)
      .send({ pickupZone: 'BANANI', destinationZone: 'GULSHAN_1', requestedSeats: 1 });

    expect(rafiqRes.status).toBe(201);
    // Should be automatically matched into the active Banani corridor pool!
    expect(rafiqRes.body.ride.status).toBe('MATCHED');
    expect(rafiqRes.body.ride.discount_poysha).toBeGreaterThan(0); // 25% discount applied!

    // Check pool capacity: Bullet now has 2 occupied seats out of 3
    const poolRes = await request(app)
      .get('/api/driver/active-pool')
      .set('Authorization', `Bearer ${jashimToken}`);

    expect(poolRes.body.activePool.pool.occupied_seats).toBe(2);
    expect(poolRes.body.activePool.pool.available_seats).toBe(1);
    expect(poolRes.body.activePool.passengers.length).toBe(2);
  });

  it('Capacity Invariant: Bullet capacity of 3 seats can NEVER be exceeded', async () => {
    // Seat 1: Nusrat
    const nusratRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${nusratToken}`)
      .send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI', requestedSeats: 1 });
    await request(app)
      .post(`/api/driver/rides/${nusratRes.body.ride.id}/accept`)
      .set('Authorization', `Bearer ${jashimToken}`);

    // Seat 2: Rafiq
    await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${rafiqToken}`)
      .send({ pickupZone: 'BANANI', destinationZone: 'GULSHAN_1', requestedSeats: 1 });

    // Seat 3: Shirin grabs the last 1 seat
    const shirinRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${shirinToken}`)
      .send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI', requestedSeats: 1 });

    expect(shirinRes.body.ride.status).toBe('MATCHED');

    // Now Bullet has 3 occupied seats (Capacity full)
    const poolRes = await request(app)
      .get('/api/driver/active-pool')
      .set('Authorization', `Bearer ${jashimToken}`);
    expect(poolRes.body.activePool.pool.occupied_seats).toBe(3);
    expect(poolRes.body.activePool.pool.available_seats).toBe(0);

    // 4th Commuter tries to book into this pool: Must NOT exceed capacity
    const extraPassengerToken = generateToken({ id: 'dummy-id', role: 'PASSENGER', email: 'extra@dhaka.tesla' });
    const overflowRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${nusratToken}`)
      .send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI', requestedSeats: 1 });

    // The overflow request cannot be matched into Bullet; remains in REQUESTED or separate pool
    expect(overflowRes.body.ride.status).toBe('REQUESTED');

    // And driver trying to force-accept over capacity gets 409 Conflict
    const forceAccept = await request(app)
      .post(`/api/driver/rides/${overflowRes.body.ride.id}/accept`)
      .set('Authorization', `Bearer ${jashimToken}`);
    expect(forceAccept.status).toBe(409);
    expect(forceAccept.body.code).toBe('CAPACITY_EXCEEDED');
  });

  it('Lifecycle Enforcement: Invalid state transitions are strictly rejected', async () => {
    const res = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${nusratToken}`)
      .send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI', requestedSeats: 1 });
    const rideId = res.body.ride.id;

    // Cannot jump from REQUESTED directly to COMPLETED
    const jumpRes = await request(app)
      .post(`/api/driver/rides/${rideId}/complete`)
      .set('Authorization', `Bearer ${jashimToken}`);
    expect(jumpRes.status).toBe(409);

    // Accept -> DRIVER_ARRIVED -> STARTED -> COMPLETED
    await request(app).post(`/api/driver/rides/${rideId}/accept`).set('Authorization', `Bearer ${jashimToken}`);
    await request(app).post(`/api/driver/rides/${rideId}/arrived`).set('Authorization', `Bearer ${jashimToken}`);
    await request(app).post(`/api/driver/rides/${rideId}/start`).set('Authorization', `Bearer ${jashimToken}`);
    const completed = await request(app).post(`/api/driver/rides/${rideId}/complete`).set('Authorization', `Bearer ${jashimToken}`);
    expect(completed.status).toBe(200);
    expect(completed.body.ride.status).toBe('COMPLETED');
  });

  it('Security: Passengers cannot view or cancel another passenger\'s ride', async () => {
    // Nusrat creates ride
    const nusratRide = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${nusratToken}`)
      .send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI', requestedSeats: 1 });

    const rideId = nusratRide.body.ride.id;

    // Rafiq tries to view Nusrat's ride
    const viewRes = await request(app)
      .get(`/api/rides/${rideId}`)
      .set('Authorization', `Bearer ${rafiqToken}`);
    expect(viewRes.status).toBe(403);

    // Rafiq tries to cancel Nusrat's ride
    const cancelRes = await request(app)
      .post(`/api/rides/${rideId}/cancel`)
      .set('Authorization', `Bearer ${rafiqToken}`)
      .send({ reason: 'Malicious cancellation' });
    expect(cancelRes.status).toBe(403);
  });

  it('Cancellation Rules: Passenger can cancel before start, releasing pool seat', async () => {
    const rideRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${nusratToken}`)
      .send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI', requestedSeats: 1 });
    const rideId = rideRes.body.ride.id;

    await request(app).post(`/api/driver/rides/${rideId}/accept`).set('Authorization', `Bearer ${jashimToken}`);

    // Seat is 1
    let pool = await request(app).get('/api/driver/active-pool').set('Authorization', `Bearer ${jashimToken}`);
    expect(pool.body.activePool.pool.occupied_seats).toBe(1);

    // Nusrat cancels while valid (MATCHED)
    const cancelRes = await request(app)
      .post(`/api/rides/${rideId}/cancel`)
      .set('Authorization', `Bearer ${nusratToken}`)
      .send({ reason: 'Met a colleague driving a car' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.ride.status).toBe('CANCELLED');

    // Seat in Bullet is freed back to 0!
    pool = await request(app).get('/api/driver/active-pool').set('Authorization', `Bearer ${jashimToken}`);
    expect(pool.body.activePool.pool.occupied_seats).toBe(0);
    expect(pool.body.activePool.pool.available_seats).toBe(3);
  });
});
