import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ScreenService } from './screen.service';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateScreenDTO } from './dto/create-screen-dto';
import { UpdateScreenDTO } from './dto/update-screen.dto';
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
  findAll() {
    return this.screenService.findAllScreen();
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