import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { HolidayModule } from '../holiday/holiday.module';

@Module({
  imports: [HolidayModule],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
