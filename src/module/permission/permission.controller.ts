import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  findAll() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Permission retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  findOne(@Param('id') id: number) {
    return this.permissionService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete permission' })
  @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  remove(@Param('id') id: number) {
    return this.permissionService.remove(id);
  }

  @Post(':permissionId/roles/:roleId')
  @ApiOperation({ summary: 'Assign permission to role' })
  @ApiResponse({ status: 200, description: 'Permission assigned to role successfully' })
  @ApiResponse({ status: 404, description: 'Permission or role not found' })
  assignToRole(@Param('permissionId') permissionId: number, @Param('roleId') roleId: number) {
    return this.permissionService.assignPermissionToRole(permissionId, roleId);
  }

  @Delete(':permissionId/roles/:roleId')
  @ApiOperation({ summary: 'Remove permission from role' })
  @ApiResponse({ status: 200, description: 'Permission removed from role successfully' })
  @ApiResponse({ status: 404, description: 'Permission or role not found' })
  removeFromRole(@Param('permissionId') permissionId: number, @Param('roleId') roleId: number) {
    return this.permissionService.removePermissionFromRole(permissionId, roleId);
  }
}
