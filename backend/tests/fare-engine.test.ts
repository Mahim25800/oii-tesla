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
});
