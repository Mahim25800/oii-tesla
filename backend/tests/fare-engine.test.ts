import { describe, it, expect } from 'vitest';
import { FareEngine } from '../src/services/FareEngine.js';

describe('FareEngine Hand-Calculable Model', () => {
  it('correctly calculates Nusrat solo vs pooled fare (Banani -> Mohakhali)', () => {
    // Nusrat: Banani -> Mohakhali
    // Solo calculation
    const solo = FareEngine.calculateFare({
      pickupZoneId: 'BANANI',
      destinationZoneId: 'MOHAKHALI',
      requestedSeats: 1,
      isPooled: false
    });

    expect(solo.baseFarePoysha).toBe(3000); // ৳30.00
    expect(solo.distanceKm).toBeGreaterThan(2.0);
    expect(solo.discountPoysha).toBe(0);
    expect(solo.isPooled).toBe(false);

    // Pooled calculation (25% off)
    const pooled = FareEngine.calculateFare({
      pickupZoneId: 'BANANI',
      destinationZoneId: 'MOHAKHALI',
      requestedSeats: 1,
      isPooled: true
    });

    expect(pooled.discountPercent).toBe(25);
    const expectedDiscount = Math.round(pooled.subtotalPoysha * 0.25);
    expect(pooled.discountPoysha).toBe(expectedDiscount);
    expect(pooled.finalFarePoysha).toBe(pooled.subtotalPoysha - expectedDiscount);
    expect(pooled.finalFarePoysha).toBeLessThan(solo.finalFarePoysha);
  });

  it('correctly calculates Rafiq solo vs pooled fare (Banani -> Gulshan 1)', () => {
    // Rafiq: Banani -> Gulshan 1
    const solo = FareEngine.calculateFare({
      pickupZoneId: 'BANANI',
      destinationZoneId: 'GULSHAN_1',
      requestedSeats: 1,
      isPooled: false
    });

    const pooled = FareEngine.calculateFare({
      pickupZoneId: 'BANANI',
      destinationZoneId: 'GULSHAN_1',
      requestedSeats: 1,
      isPooled: true
    });

    expect(solo.baseFareBdt).toBe(30);
    expect(pooled.discountPercent).toBe(25);
    expect(pooled.finalFareBdt).toBe(pooled.finalFarePoysha / 100);
    expect(pooled.finalFarePoysha).toBeLessThan(solo.finalFarePoysha);
  });

  it('enforces minimum fare boundary condition', () => {
    const minimal = FareEngine.calculateFare({
      pickupZoneId: 'BANANI',
      destinationZoneId: 'BANANI', // 1.0 km
      requestedSeats: 1,
      isPooled: true
    });

    expect(minimal.finalFarePoysha).toBeGreaterThanOrEqual(2500); // ৳25.00 min
  });

  it('correctly calculates multi-seat fares (1, 2, and 3 seats) with exact Poysha conversion and 25% discount', () => {
    // 1 Seat
    const fare1 = FareEngine.calculateFare({
      pickupZoneId: 'BANANI',
      destinationZoneId: 'MOHAKHALI',
      requestedSeats: 1,
      isPooled: true
    });
    expect(fare1.baseFarePoysha).toBe(3000);
    expect(fare1.baseFareBdt).toBe(30);
    expect(fare1.distanceKm).toBe(2.4);
    expect(fare1.distanceFarePoysha).toBe(3600); // 2.4 * 1500
    expect(fare1.subtotalPoysha).toBe(6600);
    expect(fare1.discountPoysha).toBe(1650); // 25% of 6600
    expect(fare1.finalFarePoysha).toBe(4950);
    expect(fare1.finalFareBdt).toBe(49.5);

    // 2 Seats
    const fare2 = FareEngine.calculateFare({
      pickupZoneId: 'BANANI',
      destinationZoneId: 'MOHAKHALI',
      requestedSeats: 2,
      isPooled: true
    });
    expect(fare2.baseFarePoysha).toBe(6000); // 2 * 3000
    expect(fare2.baseFareBdt).toBe(60);
    expect(fare2.distanceFarePoysha).toBe(7200); // 2 * 3600
    expect(fare2.subtotalPoysha).toBe(13200);
    expect(fare2.discountPoysha).toBe(3300); // 25% of 13200
    expect(fare2.finalFarePoysha).toBe(9900);
    expect(fare2.finalFareBdt).toBe(99);

    // 3 Seats
    const fare3 = FareEngine.calculateFare({
      pickupZoneId: 'BANANI',
      destinationZoneId: 'MOHAKHALI',
      requestedSeats: 3,
      isPooled: true
    });
    expect(fare3.baseFarePoysha).toBe(9000); // 3 * 3000
    expect(fare3.baseFareBdt).toBe(90);
    expect(fare3.distanceFarePoysha).toBe(10800); // 3 * 3600
    expect(fare3.subtotalPoysha).toBe(19800);
    expect(fare3.discountPoysha).toBe(4950); // 25% of 19800
    expect(fare3.finalFarePoysha).toBe(14850);
    expect(fare3.finalFareBdt).toBe(148.5);
  });
});
