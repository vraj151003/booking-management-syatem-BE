import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holiday } from './entity/holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday-dto';
import { HolidayFilterDto } from './dto/holiday-filter.dto';

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

  async findAllHolidays(filters?: HolidayFilterDto): Promise<Holiday[]> {
    const queryBuilder = this.holidayRepo.createQueryBuilder('holiday');

    // Apply search filter
    if (filters?.search) {
      queryBuilder.andWhere(
        'LOWER(holiday.name) LIKE LOWER(:search)',
        { search: `%${filters.search}%` }
      );
    }

    // Apply date range filter
    if (filters?.startDate) {
      queryBuilder.andWhere('holiday.date >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('holiday.date <= :endDate', { endDate: filters.endDate });
    }

    // Apply active status filter
    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('holiday.isActive = :isActive', { isActive: filters.isActive });
    } else {
      // Default to active holidays if not specified
      queryBuilder.andWhere('holiday.isActive = :isActive', { isActive: true });
    }

    return await queryBuilder.orderBy('holiday.date', 'ASC').getMany();
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
