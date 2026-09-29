import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { runSeed } from '../src/database/seed.js';

describe('Auth & User Lifecycle Endpoints', () => {
  const app = createApp();

  beforeAll(() => {
    // Seed test database
    runSeed();
  });

  it('provides the Banani rush-hour story cast via demo-users', async () => {
    const res = await request(app).get('/api/auth/demo-users');
    expect(res.status).toBe(200);
    expect(res.body.cast).toBeDefined();

    const emails = res.body.cast.map((c: any) => c.email);
    expect(emails).toContain('jashim@tesla.dhaka');
    expect(emails).toContain('nusrat@banani.dhaka');
    expect(emails).toContain('rafiq@gulshan.dhaka');
    expect(emails).toContain('shirin@mohakhali.dhaka');

    const jashim = res.body.cast.find((c: any) => c.email === 'jashim@tesla.dhaka');
    expect(jashim.role).toBe('DRIVER');
    expect(jashim.vehicle.name).toBe('Bullet');
    expect(jashim.vehicle.total_capacity).toBe(3);
  });

  it('authenticates Nusrat with valid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'nusrat@banani.dhaka',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Nusrat Jahan');
    expect(res.body.user.role).toBe('PASSENGER');
  });

  it('rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'nusrat@banani.dhaka',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
  });

  it('allows registering a new commuter with valid inputs', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Md Tanvir Hasan',
        email: 'tanvir@dhaka.tesla',
        phone: '01799887766',
        password: 'securePassword99',
        confirmPassword: 'securePassword99',
        role: 'PASSENGER'
      });

    expect(res.status).toBe(201);
    expect(res.body.user.name).toBe('Md Tanvir Hasan');
    expect(res.body.token).toBeDefined();
  });

  it('rejects registration when name has less than 3 words', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Tanvir Hasan', // only 2 words
        email: 'tanvir.two@dhaka.tesla',
        phone: '01799887761',
        password: 'securePassword99',
        confirmPassword: 'securePassword99',
        role: 'PASSENGER'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 3 words/i);
  });

  it('rejects registration when phone is not 11 digits or has non-numbers', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Md Tanvir Hasan',
        email: 'tanvir.phone@dhaka.tesla',
        phone: '+88017998877', // non-numbers and wrong length
        password: 'securePassword99',
        confirmPassword: 'securePassword99',
        role: 'PASSENGER'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/11 digits/i);
  });

  it('rejects registration when email structure is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Md Tanvir Hasan',
        email: 'not-an-email-structure',
        phone: '01799887762',
        password: 'securePassword99',
        confirmPassword: 'securePassword99',
        role: 'PASSENGER'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email format/i);
  });

  it('rejects registration when confirm password does not match', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Md Tanvir Hasan',
        email: 'tanvir.pwd@dhaka.tesla',
        phone: '01799887763',
        password: 'securePassword99',
        confirmPassword: 'differentPassword99',
        role: 'PASSENGER'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/passwords do not match/i);
  });
});
