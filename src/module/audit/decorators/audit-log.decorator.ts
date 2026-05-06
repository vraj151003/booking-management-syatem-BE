import { SetMetadata } from '@nestjs/common';
import { AuditLogOptions } from '../interceptors/audit.interceptor';
import { AuditAction, AuditEntityType } from '../../../common/constant';

export const AUDIT_LOG_KEY = 'auditLog';

export const AuditLog = (options: AuditLogOptions) => SetMetadata(AUDIT_LOG_KEY, options);

export const AdminAction = (action: AuditAction, description?: string) =>
  AuditLog({
    action,
    description,
  });

export const EntityAction = (
  action: AuditAction,
  entityType: AuditEntityType,
  entityIdParam?: string,
  description?: string,
) =>
  AuditLog({
    action,
    entityType,
    entityIdParam,
    description,
  });
