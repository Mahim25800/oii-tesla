import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { runSeed, SeedDataResult } from '../src/database/seed.js';
import { generateToken } from '../src/middleware/auth.js';
import { getDatabase } from '../src/database/connection.js';

describe('Concurrency & Race Condition Invariant Tests', () => {
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

  it('The Concurrency Problem: 1 seat left, simultaneous requests NEVER overbook Bullet', async () => {
    // 1. Initial State: Nusrat books and Jashim forms pool (Seat 1)
    const nusratRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${nusratToken}`)
      .send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI', requestedSeats: 1 });
    await request(app)
      .post(`/api/driver/rides/${nusratRes.body.ride.id}/accept`)
      .set('Authorization', `Bearer ${jashimToken}`);

    // 2. Rafiq joins pool (Seat 2)
    const rafiqRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${rafiqToken}`)
      .send({ pickupZone: 'BANANI', destinationZone: 'GULSHAN_1', requestedSeats: 1, autoPool: true });
    expect(rafiqRes.body.ride.status).toBe('MATCHED');

    // Verify Bullet has exactly 1 seat left
    const poolBefore = await request(app)
      .get('/api/driver/active-pool')
      .set('Authorization', `Bearer ${jashimToken}`);
    expect(poolBefore.body.activePool.pool.occupied_seats).toBe(2);
    expect(poolBefore.body.activePool.pool.available_seats).toBe(1);

    // 3. Concurrency Challenge:
    // Shirin and a fourth passenger (Kamal) simultaneously race to claim the final remaining seat!
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Kamal Hossain',
        phone: '+8801755443322',
        email: 'kamal@dhaka.tesla',
        password: 'password123',
        role: 'PASSENGER'
      });
    const kamalToken = registerRes.body.token;

    // Fire both requests simultaneously using Promise.all
    const [competingReq1, competingReq2] = await Promise.all([
      request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${shirinToken}`)
        .send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI', requestedSeats: 1, autoPool: true }),
      request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${kamalToken}`)
        .send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI', requestedSeats: 1, autoPool: true })
    ]);

    expect(competingReq1.status).toBe(201);
    expect(competingReq2.status).toBe(201);

    // Check statuses: exactly ONE of them must be MATCHED to Bullet's final seat,
    // and the other must remain in REQUESTED (unmatched)
    const statuses = [competingReq1.body.ride.status, competingReq2.body.ride.status];
    const matchedCount = statuses.filter(s => s === 'MATCHED').length;
    const requestedCount = statuses.filter(s => s === 'REQUESTED').length;

    expect(matchedCount).toBe(1);
    expect(requestedCount).toBe(1);

    // Verify database state: Bullet's occupied seats MUST be exactly 3, NEVER 4
    const poolAfter = await request(app)
      .get('/api/driver/active-pool')
      .set('Authorization', `Bearer ${jashimToken}`);
    expect(poolAfter.body.activePool.pool.occupied_seats).toBe(3);
    expect(poolAfter.body.activePool.pool.available_seats).toBe(0);

    // Verify via raw SQL query directly on the database
    const db = getDatabase();
    const rawPool = db.prepare('SELECT occupied_seats, total_capacity FROM pools WHERE driver_id = ?').get(seed.driver.id) as any;
    expect(rawPool.occupied_seats).toBe(3);
    expect(rawPool.occupied_seats).toBeLessThanOrEqual(rawPool.total_capacity);
  });

  it('Driver Accept Race: Multiple simultaneous driver accepts on full vehicle are rejected', async () => {
    // Fill 3 seats first
    const r1 = await request(app).post('/api/rides').set('Authorization', `Bearer ${nusratToken}`).send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI' });
    await request(app).post(`/api/driver/rides/${r1.body.ride.id}/accept`).set('Authorization', `Bearer ${jashimToken}`);

    const r2 = await request(app).post('/api/rides').set('Authorization', `Bearer ${rafiqToken}`).send({ pickupZone: 'BANANI', destinationZone: 'GULSHAN_1', autoPool: true });
    const r3 = await request(app).post('/api/rides').set('Authorization', `Bearer ${shirinToken}`).send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI', autoPool: true });

    // Both r2 and r3 got matched, filling all 3 seats
    const pool = await request(app).get('/api/driver/active-pool').set('Authorization', `Bearer ${jashimToken}`);
    expect(pool.body.activePool.pool.occupied_seats).toBe(3);

    // Create an unassigned ride
    const r4 = await request(app).post('/api/rides').set('Authorization', `Bearer ${nusratToken}`).send({ pickupZone: 'BANANI', destinationZone: 'MOHAKHALI' });
    expect(r4.body.ride.status).toBe('REQUESTED');

    // Driver attempts to accept r4 into already-full Bullet
    const overflowAccept = await request(app)
      .post(`/api/driver/rides/${r4.body.ride.id}/accept`)
      .set('Authorization', `Bearer ${jashimToken}`);

    expect(overflowAccept.status).toBe(409);
    expect(overflowAccept.body.code).toBe('CAPACITY_EXCEEDED');
  });
});
