import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ShowService } from './show.service';
import { CreateShowDto } from './dto/create-show.dto';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  findAll() {
    return this.showService.findAll();
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