import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entity/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditAction, AuditEntityType } from '../../common/constant';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async createLog(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepo.create(createAuditLogDto);
    return await this.auditLogRepo.save(auditLog);
  }

  async logAdminAction(
    userId: string,
    userEmail: string,
    userRole: string,
    action: AuditAction,
    entityType?: AuditEntityType,
    entityId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    description?: string,
    ipAddress?: string,
    userAgent?: string,
    endpoint?: string,
  ): Promise<AuditLog> {
    return await this.createLog({
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      userId,
      userEmail,
      userRole,
      ipAddress: ipAddress || 'unknown',
      userAgent,
      endpoint,
      description,
    });
  }

  async logBookingAction(
    userId: string,
    userEmail: string,
    bookingId: string,
    action: AuditAction.BOOKING_CREATED | AuditAction.BOOKING_UPDATED | AuditAction.BOOKING_CANCELLED,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    const descriptions = {
      [AuditAction.BOOKING_CREATED]: `Booking ${bookingId} created`,
      [AuditAction.BOOKING_UPDATED]: `Booking ${bookingId} updated`,
      [AuditAction.BOOKING_CANCELLED]: `Booking ${bookingId} cancelled`,
    };

    return await this.createLog({
      action,
      entityType: AuditEntityType.BOOKING,
      entityId: bookingId,
      oldValues,
      newValues,
      userId,
      userEmail,
      userRole: 'USER',
      ipAddress: ipAddress || 'unknown',
      userAgent,
      description: descriptions[action],
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
    userId?: string,
    action?: AuditAction,
    entityType?: AuditEntityType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepo
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .orderBy('auditLog.createdAt', 'DESC');

    if (userId) {
      queryBuilder.andWhere('auditLog.userId = :userId', { userId });
    }

    if (action) {
      queryBuilder.andWhere('auditLog.action = :action', { action });
    }

    if (entityType) {
      queryBuilder.andWhere('auditLog.entityType = :entityType', { entityType });
    }

    if (startDate) {
      queryBuilder.andWhere('auditLog.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('auditLog.createdAt <= :endDate', { endDate });
    }

    const [logs, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { logs, total };
  }

  async findByEntity(entityType: AuditEntityType, entityId: string): Promise<AuditLog[]> {
    return await this.auditLogRepo.find({
      where: { entityType, entityId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return await this.auditLogRepo.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
