import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { AuditAction, AuditEntityType } from '../../common/constant';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('VIEW_AUDIT_LOGS')
  @ApiOperation({ summary: 'Get all audit logs with filtering' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'entityType', required: false, enum: AuditEntityType })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('entityType') entityType?: AuditEntityType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.auditService.findAll(
      pageNum,
      limitNum,
      userId,
      action,
      entityType,
      start,
      end,
    );
  }

  @Get('entity/:entityType/:entityId')
  @RequirePermissions('VIEW_AUDIT_LOGS')
  @ApiOperation({ summary: 'Get audit logs for specific entity' })
  @ApiResponse({ status: 200, description: 'Entity audit logs retrieved successfully' })
  async findByEntity(
    @Query('entityType') entityType: AuditEntityType,
    @Query('entityId') entityId: string,
  ) {
    return await this.auditService.findByEntity(entityType, entityId);
  }

  @Get('user/:userId')
  @RequirePermissions('VIEW_AUDIT_LOGS')
  @ApiOperation({ summary: 'Get audit logs for specific user' })
  @ApiResponse({ status: 200, description: 'User audit logs retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findByUser(
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 100;
    return await this.auditService.findByUser(userId, limitNum);
  }
}
