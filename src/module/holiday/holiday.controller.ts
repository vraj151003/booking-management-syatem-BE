import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HolidayService } from './holiday.service';
import { CreateHolidayDto } from './dto/create-holiday-dto';
import { Holiday } from './entity/holiday.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';

@ApiTags('holidays')
@Controller('holidays')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Post()
  @RequirePermissions('CREATE_HOLIDAY')
  @ApiOperation({ summary: 'Create a new holiday' })
  @ApiResponse({ status: 201, type: Holiday })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(@Body() dto: CreateHolidayDto): Promise<Holiday> {
    return await this.holidayService.createHoliday(dto);
  }

  @Get()
  @RequirePermissions('READ_HOLIDAY')
  @ApiOperation({ summary: 'Get all active holidays' })
  @ApiResponse({ status: 200, type: [Holiday] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findAll(): Promise<Holiday[]> {
    return await this.holidayService.findAllHolidays();
  }

  @Get(':id')
  @RequirePermissions('READ_HOLIDAY')
  @ApiOperation({ summary: 'Get a holiday by ID' })
  @ApiResponse({ status: 200, type: Holiday })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findOne(@Param('id') id: string): Promise<Holiday> {
    return await this.holidayService.findOneHoliday(id);
  }

  @Put(':id')
  @RequirePermissions('UPDATE_HOLIDAY')
  @ApiOperation({ summary: 'Update a holiday' })
  @ApiResponse({ status: 200, type: Holiday })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async update(@Param('id') id: string, @Body() dto: CreateHolidayDto): Promise<Holiday> {
    return await this.holidayService.updateHoliday(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('DELETE_HOLIDAY')
  @ApiOperation({ summary: 'Delete a holiday' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.holidayService.deleteHoliday(id);
  }

  @Get('check/:date')
  @RequirePermissions('READ_HOLIDAY')
  @ApiOperation({ summary: 'Check if a date is a holiday' })
  @ApiResponse({ status: 200, schema: { type: 'object', properties: { isHoliday: { type: 'boolean' } } } })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async checkHoliday(@Param('date') date: string): Promise<{ isHoliday: boolean; holiday: Holiday | null }> {
    const isHoliday = await this.holidayService.isHoliday(date);
    const holiday = isHoliday ? await this.holidayService.getHolidayByDate(date) : null;
    return { isHoliday, holiday };
  }
}
