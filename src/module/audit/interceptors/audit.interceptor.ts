import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AuditService } from '../audit.service';
import { AuditAction, AuditEntityType } from '../../../common/constant';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: {
      name: string;
    };
  };
}

export interface AuditLogOptions {
  action: AuditAction;
  entityType?: AuditEntityType;
  entityIdParam?: string;
  description?: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // Skip audit logging for GET requests and unauthenticated users
    if (request.method === 'GET' || !user) {
      return next.handle();
    }

    // Check for manual audit decorator first (for specific overrides)
    const auditOptions = this.reflector.get<AuditLogOptions>(
      'auditLog',
      context.getHandler(),
    );

    // Auto-generate audit options if not manually specified
    const options = auditOptions || this.generateAuditOptions(request, context);

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Log successful responses
          this.logSuccessfulAction(request, user, options);
        },
        error: (error) => {
          // Optionally log errors if needed
          this.logger.error(`Request failed: ${error.message}`);
        },
      }),
    );
  }

  private generateAuditOptions(request: AuthenticatedRequest, context: ExecutionContext): AuditLogOptions {
    const method = request.method;
    const url = request.url;
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    
    // Extract entity type from controller name or URL
    let entityType: AuditEntityType;
    let action: AuditAction;
    
    // Map controller names to entity types
    const controllerEntityMap: Record<string, AuditEntityType> = {
      'BookingController': AuditEntityType.BOOKING,
      'ConcessionController': AuditEntityType.CONCESSION,
      'MovieController': AuditEntityType.MOVIE,
      'ShowController': AuditEntityType.SHOW,
      'AuthController': AuditEntityType.USER,
    };
    
    // Extract entity type from URL path as fallback
    const urlEntityMap: Record<string, AuditEntityType> = {
      '/concessions': AuditEntityType.CONCESSION,
      '/movies': AuditEntityType.MOVIE,
      '/shows': AuditEntityType.SHOW,
      '/bookings': AuditEntityType.BOOKING,
      '/users': AuditEntityType.USER,
      '/auth': AuditEntityType.USER,
    };
    
    // Determine entity type
    entityType = controllerEntityMap[controller] || 
                 Object.entries(urlEntityMap).find(([path]) => url.includes(path))?.[1] ||
                 AuditEntityType.USER; // default
    
    // Map HTTP methods to audit actions
    const methodActionMap: Record<string, AuditAction> = {
      'POST': AuditAction.CREATE,
      'PUT': AuditAction.UPDATE,
      'PATCH': AuditAction.UPDATE,
      'DELETE': AuditAction.DELETE,
    };
    
    action = methodActionMap[method] || AuditAction.UPDATE;
    
    // Generate description
    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase();
    const actionName = action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
    const description = `${entityName} ${actionName.toLowerCase()} via ${handler}`;
    
    // Extract entity ID from params if available
    const entityIdParam = this.extractEntityIdParam(request, entityType);
    
    return {
      action,
      entityType,
      entityIdParam,
      description,
    };
  }
  
  private extractEntityIdParam(request: AuthenticatedRequest, entityType: AuditEntityType): string | undefined {
    const params = request.params;
    
    // Common ID parameter names
    const idParams = ['id', 'bookingId', 'movieId', 'showId', 'userId', 'concessionId', 'categoryId'];
    
    for (const param of idParams) {
      if (params[param]) {
        return param;
      }
    }
    
    return undefined;
  }

  private async logSuccessfulAction(
    request: AuthenticatedRequest,
    user: any,
    options: AuditLogOptions,
  ) {
    try {
      const entityId = options.entityIdParam
        ? request.params[options.entityIdParam] as string
        : undefined;

      await this.auditService.logAdminAction(
        user.id,
        user.email,
        user.role?.name || 'USER',
        options.action,
        options.entityType,
        entityId,
        undefined,
        undefined,
        options.description,
        request.ip,
        request.get('User-Agent'),
        request.url,
      );
    } catch (error) {
      this.logger.error('Failed to log audit action:', error);
    }
  }
}
