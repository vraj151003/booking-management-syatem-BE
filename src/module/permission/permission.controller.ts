import { Controller, Get, Post, Delete, Param, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import * as messageConfig from '../../common/config/message.json';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved' })
  async findAll() {
    return {
      message: messageConfig.messages.PERMISSION.GET_ALL,
      data: await this.permissionService.findAll()
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Permission retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async findOne(@Param('id') id: number) {
    return {
      message: messageConfig.messages.PERMISSION.GET_BY_ID,
      data: await this.permissionService.findOne(id)
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete permission' })
  @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async remove(@Param('id') id: number) {
    return {
      message: messageConfig.messages.PERMISSION.DELETE,
      data: await this.permissionService.remove(id)
    };
  }

  @Post('roles/:roleId/assign-permissions')
  @ApiOperation({ summary: 'Assign multiple permissions to role' })
  @ApiResponse({ status: 200, description: 'Permissions assigned to role successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async assignToRole(@Param('roleId') roleId: number, @Body() dto: AssignPermissionsDto) {
    return {
      message: messageConfig.messages.PERMISSION.ASSIGN_TO_ROLE,
      data: await this.permissionService.assignPermissionToRole(dto.permissionIds, roleId)
    };
  }

  @Delete(':permissionId/roles/:roleId')
  @ApiOperation({ summary: 'Remove permission from role' })
  @ApiResponse({ status: 200, description: 'Permission removed from role successfully' })
  @ApiResponse({ status: 404, description: 'Permission or role not found' })
  async removeFromRole(@Param('permissionId') permissionId: number, @Param('roleId') roleId: number) {
    return {
      message: messageConfig.messages.PERMISSION.REMOVE_FROM_ROLE,
      data: await this.permissionService.removePermissionFromRole(permissionId, roleId)
    };
  }
}
