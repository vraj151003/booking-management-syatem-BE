import { Injectable } from '@nestjs/common';
import { HolidayService } from '../holiday/holiday.service';

export interface PricingMultiplier {
  weekend: number;
  holiday: number;
  weekday: number;
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}

export interface DynamicPricingResult {
  originalPrice: number;
  adjustedPrice: number;
  multiplier: number;
  reason: string;
}

@Injectable()
export class PricingService {
  private pricingMultipliers: PricingMultiplier = {
    weekend: 1.2, // 20% higher on weekends
    holiday: 1.25, // 25% higher on holidays
    weekday: 1.0, // Standard price on weekdays
    morning: 0.9, // 10% lower in morning (6AM - 12PM)
    afternoon: 1.0, // Standard price in afternoon (12PM - 5PM)
    evening: 1.15, // 15% higher in evening (5PM - 9PM)
    night: 1.25, // 25% higher at night (9PM - 6AM)
  };

  constructor(private readonly holidayService: HolidayService) {}

  /**
   * Calculate dynamic price based on show date and time
   * @param basePrice - Original seat price
   * @param showDate - Show date in YYYY-MM-DD format
   * @param showTime - Show time in HH:MM format (optional)
   * @returns Dynamic pricing result with adjusted price and reason
   */
  async calculateDynamicPrice(
    basePrice: number,
    showDate: string,
    showTime?: string,
  ): Promise<DynamicPricingResult> {
    const date = new Date(showDate);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = await this.holidayService.isHoliday(showDate);

    let multiplier = this.pricingMultipliers.weekday;
    let reason = 'Standard weekday pricing';

    if (isHoliday) {
      multiplier = this.pricingMultipliers.holiday;
      reason = 'Holiday pricing applied';
    } else if (isWeekend) {
      multiplier = this.pricingMultipliers.weekend;
      reason = 'Weekend pricing applied';
    }

    // Apply time-based multiplier if showTime is provided
    if (showTime) {
      const timeMultiplier = this.getTimeMultiplier(showTime);
      // Combine multipliers: multiply them together
      multiplier = multiplier * timeMultiplier;
      reason = `${reason} with ${this.getTimePeriod(showTime)} pricing`;
    }

    const adjustedPrice = Math.round(basePrice * multiplier);

    return {
      originalPrice: basePrice,
      adjustedPrice,
      multiplier,
      reason,
    };
  }

  /**
   * Get time multiplier based on show time
   * @param showTime - Show time in HH:MM format
   * @returns Time multiplier
   */
  private getTimeMultiplier(showTime: string): number {
    const [hours] = showTime.split(':').map(Number);
    const hour = hours || 0;

    // Morning: 6AM - 12PM (6-12)
    if (hour >= 6 && hour < 12) {
      return this.pricingMultipliers.morning;
    }
    // Afternoon: 12PM - 5PM (12-17)
    if (hour >= 12 && hour < 17) {
      return this.pricingMultipliers.afternoon;
    }
    // Evening: 5PM - 9PM (17-21)
    if (hour >= 17 && hour < 21) {
      return this.pricingMultipliers.evening;
    }
    // Night: 9PM - 6AM (21-6)
    return this.pricingMultipliers.night;
  }

  /**
   * Get time period description
   * @param showTime - Show time in HH:MM format
   * @returns Time period description
   */
  private getTimePeriod(showTime: string): string {
    const [hours] = showTime.split(':').map(Number);
    const hour = hours || 0;

    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Calculate dynamic pricing for multiple seats
   * @param basePrices - Record of seat type to base price
   * @param showDate - Show date in YYYY-MM-DD format
   * @param showTime - Show time in HH:MM format (optional)
   * @returns Record of seat type to dynamic pricing result
   */
  async calculateDynamicPricingForSeats(
    basePrices: Record<string, number>,
    showDate: string,
    showTime?: string,
  ): Promise<Record<string, DynamicPricingResult>> {
    const results: Record<string, DynamicPricingResult> = {};

    for (const [seatType, basePrice] of Object.entries(basePrices)) {
      results[seatType] = await this.calculateDynamicPrice(basePrice, showDate, showTime);
    }

    return results;
  }

  /**
   * Update pricing multipliers
   * @param multipliers - New pricing multipliers
   */
  updatePricingMultipliers(multipliers: Partial<PricingMultiplier>): void {
    this.pricingMultipliers = { ...this.pricingMultipliers, ...multipliers };
  }

  /**
   * Get current pricing multipliers
   * @returns Current pricing multipliers
   */
  getPricingMultipliers(): PricingMultiplier {
    return { ...this.pricingMultipliers };
  }
}
