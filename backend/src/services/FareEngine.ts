import { CONFIG } from '../config/index.js';
import { getZoneDistance } from '../config/zones.js';

export interface FareCalculationInput {
  pickupZoneId: string;
  destinationZoneId: string;
  requestedSeats?: number;
  isPooled?: boolean;
  poolRiderCount?: number;
}

export interface FareBreakdown {
  pickupZoneId: string;
  destinationZoneId: string;
  distanceKm: number;
  requestedSeats: number;
  baseFarePoysha: number;
  baseFareBdt: number;
  distanceFarePoysha: number;
  distanceFareBdt: number;
  subtotalPoysha: number;
  subtotalBdt: number;
  discountPoysha: number;
  discountBdt: number;
  discountPercent: number;
  finalFarePoysha: number;
  finalFareBdt: number;
  isPooled: boolean;
  currency: 'BDT';
  explanation: string;
}

export class FareEngine {
  /**
   * Calculates individual passenger fare with transparent integer Poysha math.
   * 1 BDT = 100 Poysha.
   *
   * Formula:
   *   passengerFare = baseFare + distanceCharge - poolDiscount
   */
  public static calculateFare(input: FareCalculationInput): FareBreakdown {
    const seats = Math.max(1, input.requestedSeats || 1);
    const distanceKm = getZoneDistance(input.pickupZoneId, input.destinationZoneId);

    /* --- Integer Poysha Computation (Exact Currency Representation) --- */
    const baseFarePoysha = CONFIG.FARE.BASE_FARE_POYSHA;
    const distanceFarePoysha = Math.round(distanceKm * CONFIG.FARE.RATE_PER_KM_POYSHA);
    let subtotalPoysha = baseFarePoysha + distanceFarePoysha;

    if (seats > 1) {
      subtotalPoysha = Math.round(subtotalPoysha * (1 + (seats - 1) * 0.7));
    }

    const isPooled = Boolean(input.isPooled);
    let discountPercent = 0;
    let discountPoysha = 0;

    if (isPooled) {
      discountPercent = CONFIG.FARE.POOL_DISCOUNT_PERCENT;
      discountPoysha = Math.round(subtotalPoysha * (discountPercent / 100));
    }

    // Minimum fare guarantee prevents negative or zero fare edge cases
    const rawFinalFare = subtotalPoysha - discountPoysha;
    const finalFarePoysha = Math.max(CONFIG.FARE.MINIMUM_FARE_POYSHA, rawFinalFare);

    const explanation = isPooled
      ? `Base ৳${(baseFarePoysha / 100).toFixed(2)} + Distance (${distanceKm.toFixed(1)}km × ৳${(CONFIG.FARE.RATE_PER_KM_POYSHA / 100).toFixed(2)}) = ৳${(subtotalPoysha / 100).toFixed(2)} less ${discountPercent}% Pool Discount (-৳${(discountPoysha / 100).toFixed(2)}) = ৳${(finalFarePoysha / 100).toFixed(2)}`
      : `Base ৳${(baseFarePoysha / 100).toFixed(2)} + Distance (${distanceKm.toFixed(1)}km × ৳${(CONFIG.FARE.RATE_PER_KM_POYSHA / 100).toFixed(2)}) = ৳${(finalFarePoysha / 100).toFixed(2)}`;

    return {
      pickupZoneId: input.pickupZoneId,
      destinationZoneId: input.destinationZoneId,
      distanceKm,
      requestedSeats: seats,
      baseFarePoysha,
      baseFareBdt: baseFarePoysha / 100,
      distanceFarePoysha,
      distanceFareBdt: distanceFarePoysha / 100,
      subtotalPoysha,
      subtotalBdt: subtotalPoysha / 100,
      discountPoysha,
      discountBdt: discountPoysha / 100,
      discountPercent,
      finalFarePoysha,
      finalFareBdt: finalFarePoysha / 100,
      isPooled,
      currency: 'BDT',
      explanation
    };
  }

  /**
   * Helper to format Poysha to Bangladeshi Taka display string
   */
  public static formatTaka(poysha: number): string {
    return `৳${(poysha / 100).toFixed(2)}`;
  }
}
