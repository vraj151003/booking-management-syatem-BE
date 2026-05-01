import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holiday } from './entity/holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday-dto';

@Injectable()
export class HolidayService {
  constructor(
    @InjectRepository(Holiday)
    private holidayRepo: Repository<Holiday>,
  ) {}

  async createHoliday(dto: CreateHolidayDto): Promise<Holiday> {
    const holiday = this.holidayRepo.create(dto);
    return await this.holidayRepo.save(holiday);
  }

  async findAllHolidays(): Promise<Holiday[]> {
    return await this.holidayRepo.find({
      where: { isActive: true },
      order: { date: 'ASC' },
    });
  }

  async findOneHoliday(id: string): Promise<Holiday> {
    const holiday = await this.holidayRepo.findOne({ where: { id } });
    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }
    return holiday;
  }

  async updateHoliday(id: string, dto: CreateHolidayDto): Promise<Holiday> {
    const holiday = await this.findOneHoliday(id);
    Object.assign(holiday, dto);
    return await this.holidayRepo.save(holiday);
  }

  async deleteHoliday(id: string): Promise<void> {
    const holiday = await this.findOneHoliday(id);
    await this.holidayRepo.remove(holiday);
  }

  async isHoliday(date: string): Promise<boolean> {
    const holiday = await this.holidayRepo.findOne({
      where: { date, isActive: true },
    });
    return !!holiday;
  }

  async getHolidayByDate(date: string): Promise<Holiday | null> {
    return await this.holidayRepo.findOne({
      where: { date, isActive: true },
    });
  }
}
