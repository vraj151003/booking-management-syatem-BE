import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entity/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';

@ApiTags('roles')
@Controller('role')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
constructor(
    private readonly roleService: RoleService
) {}

@Post()
@RequirePermissions('CREATE_ROLE')
@ApiOperation({ summary: 'Create a new role' })
@ApiResponse({ status: 201, description: 'Role created successfully', type: Role })
@ApiResponse({ status: 400, description: 'Bad request' })
@ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.createRole(createRoleDto.name)
}

@Get()
@RequirePermissions('READ_ROLE')
@ApiOperation({ summary: 'Get all roles' })
@ApiResponse({ status: 200, description: 'List of all roles', type: [Role] })
@ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
getAllRoles(){
    return this.roleService.getRoles()
}

@Put(':id')
@RequirePermissions('UPDATE_ROLE')
@ApiOperation({ summary: 'Update a role' })
@ApiParam({ name: 'id', description: 'Role ID', type: Number })
@ApiResponse({ status: 200, description: 'Role updated successfully', type: Role })
@ApiResponse({ status: 404, description: 'Role not found' })
@ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
updateRole(@Param('id') id: number, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.updateRole(id, updateRoleDto.name!)
}

@Delete(':id')
@RequirePermissions('DELETE_ROLE')
@ApiOperation({ summary: 'Delete a role' })
@ApiParam({ name: 'id', description: 'Role ID', type: Number })
@ApiResponse({ status: 200, description: 'Role deleted successfully' })
@ApiResponse({ status: 404, description: 'Role not found' })
@ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
deleteRole(@Param('id') id: number) {
    return this.roleService.deleteRole(id)
}
}
