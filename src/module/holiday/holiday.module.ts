import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidayController } from './holiday.controller';
import { HolidayService } from './holiday.service';
import { Holiday } from './entity/holiday.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Holiday])],
  controllers: [HolidayController],
  providers: [HolidayService],
  exports: [HolidayService],
})
export class HolidayModule {}
