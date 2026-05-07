import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ShowService } from './show.service';
import { CreateShowDto } from './dto/create-show.dto';
import { ShowFilterDto } from './dto/show-filter.dto';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Shows')
@ApiBearerAuth()
@Controller('shows')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ShowController {
  constructor(private readonly showService: ShowService) {}

  @Post()
  @RequirePermissions('CREATE_SHOW')
  @ApiResponse({ status: 201, description: 'Show created' })
  create(@Body() dto: CreateShowDto) {
    return this.showService.create(dto);
  }

  @Get()
  @RequirePermissions('READ_SHOW')
  @ApiResponse({ status: 200, description: 'Shows fetched' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'movieId', required: false })
  @ApiQuery({ name: 'screenId', required: false })
  @ApiQuery({ name: 'theaterId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'startTime', required: false })
  @ApiQuery({ name: 'endTime', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  findAll(@Query() filters: ShowFilterDto) {
    return this.showService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions('READ_SHOW')
  @ApiResponse({ status: 200, description: 'Show fetched' })
  findOne(@Param('id') id: string) {
    return this.showService.findOne(id);
  }

  @Get(':id/seat-availability')
  @RequirePermissions('READ_SHOW')
  @ApiResponse({ status: 200, description: 'Seat availability fetched' })
  getSeatAvailability(@Param('id') id: string) {
    return this.showService.getSeatAvailability(id);
  }

  @Delete(':id')
  @RequirePermissions('DELETE_SHOW')
  @ApiResponse({ status: 200, description: 'Show deleted' })
  delete(@Param('id') id: string) {
    return this.showService.delete(id);
  }
}