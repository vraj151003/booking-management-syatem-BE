import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ScreenService } from './screen.service';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateScreenDTO } from './dto/create-screen-dto';
import { UpdateScreenDTO } from './dto/update-screen.dto';
import { ScreenFilterDto } from './dto/screen-filter.dto';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Screens')
@ApiBearerAuth()
@Controller('screens')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ScreenController {
  constructor(private readonly screenService: ScreenService) {}

  @Post()
  @RequirePermissions('CREATE_SCREEN')
  @ApiResponse({ status: 201, description: 'Screen created' })
  create(@Body() dto: CreateScreenDTO) {
    return this.screenService.createScreen(dto);
  }

  @Get()
  @RequirePermissions('READ_SCREEN')
  @ApiResponse({ status: 200, description: 'All screens fetched' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'ownerId', required: false })
  @ApiQuery({ name: 'theaterId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'minTotalSeats', required: false })
  @ApiQuery({ name: 'maxTotalSeats', required: false })
  findAll(@Query() filters: ScreenFilterDto) {
    return this.screenService.findAllScreen(filters);
  }

  @Get(':id')
  @RequirePermissions('READ_SCREEN')
  @ApiResponse({ status: 200, description: 'Screen fetched' })
  findOne(@Param('id') id: string) {
    return this.screenService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('UPDATE_SCREEN')
  @ApiResponse({ status: 200, description: 'Screen updated' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateScreenDTO,
  ) {
    return this.screenService.updateScreen(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('DELETE_SCREEN')
  @ApiResponse({ status: 200, description: 'Screen deleted' })
  delete(@Param('id') id: string) {
    return this.screenService.deleteScreen(id);
  }
}