import { Test, TestingModule } from '@nestjs/testing';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from '../audit.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AuditAction, AuditEntityType } from '../../../common/constant';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditService: any;
  let reflector: any;

  beforeEach(async () => {
    auditService = {
      logAdminAction: jest.fn(),
      createLog: jest.fn(),
      logBookingAction: jest.fn(),
      findAll: jest.fn(),
      findByEntity: jest.fn(),
      findByUser: jest.fn(),
    };

    reflector = {
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndMerge: jest.fn(),
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
        {
          provide: AuditService,
          useValue: auditService,
        },
        {
          provide: Reflector,
          useValue: reflector,
        },
      ],
    }).compile();

    interceptor = module.get<AuditInterceptor>(AuditInterceptor);
  });

  describe('intercept', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: { name: 'ADMIN' },
    };

    // Helper function to create mock context
    const createMockContext = (request: any, handler: any = {}, controller: any = {}): ExecutionContext => {
      return {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({ statusCode: 200 }),
          getNext: () => ({}),
        }),
        switchToRpc: () => ({
          getData: () => ({}),
          getContext: () => ({}),
        }),
        switchToWs: () => ({
          getClient: () => ({}),
          getData: () => ({}),
          getPattern: () => 'test',
        }),
        getHandler: () => handler,
        getClass: () => controller,
        getArgs: () => [],
        getArgByIndex: () => null,
        getType: () => 'http' as any,
      } as ExecutionContext;
    };

    // Helper function to create mock call handler
    const createMockCallHandler = (response: any = {}, shouldError: boolean = false): CallHandler => {
      return {
        handle: () => shouldError 
          ? throwError(new Error('Test error')) 
          : of(response),
      } as CallHandler;
    };

    describe('Skip Conditions', () => {
      it('should skip audit logging for GET requests', () => {
        // Arrange
        const request = {
          method: 'GET',
          url: '/api/concessions',
          user: mockUser,
          ip: '127.0.0.1',
          params: {},
          get: jest.fn(),
        };
        const context = createMockContext(request);
        const next = createMockCallHandler({ success: true });

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).not.toHaveBeenCalled();
      });

      it('should skip audit logging for unauthenticated users', () => {
        // Arrange
        const request = {
          method: 'POST',
          url: '/api/concessions',
          user: null,
          ip: '127.0.0.1',
          params: {},
          get: jest.fn(),
        };
        const context = createMockContext(request);
        const next = createMockCallHandler({ success: true });

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).not.toHaveBeenCalled();
      });

      it('should skip audit logging for undefined user', () => {
        // Arrange
        const request = {
          method: 'POST',
          url: '/api/concessions',
          user: undefined,
          ip: '127.0.0.1',
          params: {},
          get: jest.fn(),
        };
        const context = createMockContext(request);
        const next = createMockCallHandler({ success: true });

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).not.toHaveBeenCalled();
      });
    });

    describe('Manual Audit Decorator Override', () => {
      it('should use manual audit options when decorator is present', () => {
        // Arrange
        const manualOptions = {
          action: AuditAction.DELETE,
          entityType: AuditEntityType.CONCESSION,
          entityIdParam: 'id',
          description: 'Manual audit description',
        };

        const request = {
          method: 'POST',
          url: '/api/concessions',
          user: mockUser,
          ip: '127.0.0.1',
          params: { id: '123' },
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        const handler = { name: 'createConcession' };
        const controller = { name: 'ConcessionController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(manualOptions);

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(reflector.get).toHaveBeenCalledWith('auditLog', handler);
        expect(auditService.logAdminAction).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
          mockUser.role.name,
          manualOptions.action,
          manualOptions.entityType,
          '123',
          undefined,
          undefined,
          manualOptions.description,
          request.ip,
          'Mozilla/5.0',
          request.url
        );
      });
    });

    describe('Auto-Generated Audit Options', () => {
      it('should generate audit options for POST request to ConcessionController', () => {
        // Arrange
        const request = {
          method: 'POST',
          url: '/api/concessions',
          user: mockUser,
          ip: '127.0.0.1',
          params: {},
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        const handler = { name: 'createConcession' };
        const controller = { name: 'ConcessionController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(undefined);

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
          mockUser.role.name,
          AuditAction.CREATE,
          AuditEntityType.CONCESSION,
          undefined,
          undefined,
          undefined,
          'Concession create via createConcession',
          request.ip,
          'Mozilla/5.0',
          request.url
        );
      });

      it('should generate audit options for PUT request to MovieController', () => {
        // Arrange
        const request = {
          method: 'PUT',
          url: '/api/movies/123',
          user: mockUser,
          ip: '127.0.0.1',
          params: { id: '123' },
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        const handler = { name: 'updateMovie' };
        const controller = { name: 'MovieController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(undefined);

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
          mockUser.role.name,
          AuditAction.UPDATE,
          AuditEntityType.MOVIE,
          '123',
          undefined,
          undefined,
          'Movie update via updateMovie',
          request.ip,
          'Mozilla/5.0',
          request.url
        );
      });

      it('should generate audit options for DELETE request to ShowController', () => {
        // Arrange
        const request = {
          method: 'DELETE',
          url: '/api/shows/456',
          user: mockUser,
          ip: '127.0.0.1',
          params: { id: '456' },
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        const handler = { name: 'deleteShow' };
        const controller = { name: 'ShowController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(undefined);

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
          mockUser.role.name,
          AuditAction.DELETE,
          AuditEntityType.SHOW,
          '456',
          undefined,
          undefined,
          'Show delete via deleteShow',
          request.ip,
          'Mozilla/5.0',
          request.url
        );
      });

      it('should fallback to URL mapping when controller not recognized', () => {
        // Arrange
        const request = {
          method: 'POST',
          url: '/api/bookings',
          user: mockUser,
          ip: '127.0.0.1',
          params: {},
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        const handler = { name: 'createBooking' };
        const controller = { name: 'UnknownController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(undefined);

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
          mockUser.role.name,
          AuditAction.CREATE,
          AuditEntityType.BOOKING,
          undefined,
          undefined,
          undefined,
          'Booking create via createBooking',
          request.ip,
          'Mozilla/5.0',
          request.url
        );
      });

      it('should default to USER entity type when controller and URL not recognized', () => {
        // Arrange
        const request = {
          method: 'POST',
          url: '/api/unknown',
          user: mockUser,
          ip: '127.0.0.1',
          params: {},
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        const handler = { name: 'unknownAction' };
        const controller = { name: 'UnknownController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(undefined);

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
          mockUser.role.name,
          AuditAction.CREATE,
          AuditEntityType.USER,
          undefined,
          undefined,
          undefined,
          'User create via unknownAction',
          request.ip,
          'Mozilla/5.0',
          request.url
        );
      });

      it('should default to UPDATE action for unrecognized HTTP method', () => {
        // Arrange
        const request = {
          method: 'UNKNOWN',
          url: '/api/concessions',
          user: mockUser,
          ip: '127.0.0.1',
          params: {},
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        const handler = { name: 'unknownAction' };
        const controller = { name: 'ConcessionController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(undefined);

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
          mockUser.role.name,
          AuditAction.UPDATE,
          AuditEntityType.CONCESSION,
          undefined,
          undefined,
          undefined,
          'Concession update via unknownAction',
          request.ip,
          'Mozilla/5.0',
          request.url
        );
      });
    });

    describe('Error Handling', () => {
      it('should log error when request fails', () => {
        // Arrange
        const request = {
          method: 'POST',
          url: '/api/concessions',
          user: mockUser,
          ip: '127.0.0.1',
          params: {},
          get: jest.fn(),
        };

        const handler = { name: 'createConcession' };
        const controller = { name: 'ConcessionController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({}, true); // This will cause an error

        reflector.get.mockReturnValue(undefined);

        const loggerSpy = jest.spyOn((interceptor as any).logger, 'error');

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe({
          error: (error) => {
            expect(loggerSpy).toHaveBeenCalledWith('Request failed: Test error');
            expect(auditService.logAdminAction).not.toHaveBeenCalled();
          }
        });
      });

      it('should handle audit service logging errors gracefully', async () => {
        // Arrange
        const request = {
          method: 'POST',
          url: '/api/concessions',
          user: mockUser,
          ip: '127.0.0.1',
          params: {},
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        const handler = { name: 'createConcession' };
        const controller = { name: 'ConcessionController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(undefined);
        auditService.logAdminAction.mockRejectedValue(new Error('Database error'));

        const loggerSpy = jest.spyOn((interceptor as any).logger, 'error');

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        // Wait for async logging
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(loggerSpy).toHaveBeenCalledWith('Failed to log audit action:', expect.any(Error));
      });
    });

    describe('Entity ID Parameter Extraction', () => {
      const testCases = [
        { param: 'id', value: '123', expected: 'id' },
        { param: 'bookingId', value: '456', expected: 'bookingId' },
        { param: 'movieId', value: '789', expected: 'movieId' },
        { param: 'showId', value: '101', expected: 'showId' },
        { param: 'userId', value: '202', expected: 'userId' },
        { param: 'concessionId', value: '303', expected: 'concessionId' },
        { param: 'categoryId', value: '404', expected: 'categoryId' },
      ];

      testCases.forEach(({ param, value, expected }) => {
        it(`should extract ${param} parameter`, () => {
          // Arrange
          const request = {
            method: 'POST',
            url: '/api/concessions',
            user: mockUser,
            ip: '127.0.0.1',
            params: { [param]: value },
            get: jest.fn().mockReturnValue('Mozilla/5.0'),
          };

          const handler = { name: 'createConcession' };
          const controller = { name: 'ConcessionController' };
          const context = createMockContext(request, handler, controller);
          const next = createMockCallHandler({ success: true });

          reflector.get.mockReturnValue(undefined);

          // Act
          const result = interceptor.intercept(context, next);

          // Assert
          result.subscribe();
          expect(auditService.logAdminAction).toHaveBeenCalledWith(
            mockUser.id,
            mockUser.email,
            mockUser.role.name,
            AuditAction.CREATE,
            AuditEntityType.CONCESSION,
            value,
            undefined,
            undefined,
            'Concession create via createConcession',
            request.ip,
            'Mozilla/5.0',
            request.url
          );
        });
      });

      it('should return undefined when no ID parameters found', () => {
        // Arrange
        const request = {
          method: 'POST',
          url: '/api/concessions',
          user: mockUser,
          ip: '127.0.0.1',
          params: { otherParam: 'value' },
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        const handler = { name: 'createConcession' };
        const controller = { name: 'ConcessionController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(undefined);

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
          mockUser.role.name,
          AuditAction.CREATE,
          AuditEntityType.CONCESSION,
          undefined,
          undefined,
          undefined,
          'Concession create via createConcession',
          request.ip,
          'Mozilla/5.0',
          request.url
        );
      });
    });

    describe('User Role Handling', () => {
      it('should handle user without role', () => {
        // Arrange
        const userWithoutRole = {
          id: 'user-123',
          email: 'test@example.com',
        };

        const request = {
          method: 'POST',
          url: '/api/concessions',
          user: userWithoutRole,
          ip: '127.0.0.1',
          params: {},
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        const handler = { name: 'createConcession' };
        const controller = { name: 'ConcessionController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(undefined);

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).toHaveBeenCalledWith(
          userWithoutRole.id,
          userWithoutRole.email,
          'USER',
          AuditAction.CREATE,
          AuditEntityType.CONCESSION,
          undefined,
          undefined,
          undefined,
          'Concession create via createConcession',
          request.ip,
          'Mozilla/5.0',
          request.url
        );
      });

      it('should handle user with undefined role name', () => {
        // Arrange
        const userWithUndefinedRole = {
          id: 'user-123',
          email: 'test@example.com',
          role: { name: undefined },
        };

        const request = {
          method: 'POST',
          url: '/api/concessions',
          user: userWithUndefinedRole,
          ip: '127.0.0.1',
          params: {},
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        const handler = { name: 'createConcession' };
        const controller = { name: 'ConcessionController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(undefined);

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).toHaveBeenCalledWith(
          userWithUndefinedRole.id,
          userWithUndefinedRole.email,
          'USER',
          AuditAction.CREATE,
          AuditEntityType.CONCESSION,
          undefined,
          undefined,
          undefined,
          'Concession create via createConcession',
          request.ip,
          'Mozilla/5.0',
          request.url
        );
      });
    });

    describe('HTTP Method Variations', () => {
      const methodTests = [
        { method: 'POST', expectedAction: AuditAction.CREATE },
        { method: 'PUT', expectedAction: AuditAction.UPDATE },
        { method: 'PATCH', expectedAction: AuditAction.UPDATE },
        { method: 'DELETE', expectedAction: AuditAction.DELETE },
      ];

      methodTests.forEach(({ method, expectedAction }) => {
        it(`should map ${method} to ${expectedAction}`, () => {
          // Arrange
          const request = {
            method,
            url: '/api/concessions',
            user: mockUser,
            ip: '127.0.0.1',
            params: {},
            get: jest.fn().mockReturnValue('Mozilla/5.0'),
          };

          const handler = { name: 'testMethod' };
          const controller = { name: 'ConcessionController' };
          const context = createMockContext(request, handler, controller);
          const next = createMockCallHandler({ success: true });

          reflector.get.mockReturnValue(undefined);

          // Act
          const result = interceptor.intercept(context, next);

          // Assert
          result.subscribe();
          expect(auditService.logAdminAction).toHaveBeenCalledWith(
            mockUser.id,
            mockUser.email,
            mockUser.role.name,
            expectedAction,
            AuditEntityType.CONCESSION,
            undefined,
            undefined,
            undefined,
            `Concession ${expectedAction.toLowerCase()} via testMethod`,
            request.ip,
            'Mozilla/5.0',
            request.url
          );
        });
      });
    });

    describe('Request Metadata', () => {
      it('should include IP address from request', () => {
        // Arrange
        const request = {
          method: 'POST',
          url: '/api/concessions',
          user: mockUser,
          ip: '192.168.1.100',
          params: {},
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        };

        const handler = { name: 'createConcession' };
        const controller = { name: 'ConcessionController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(undefined);

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
          mockUser.role.name,
          AuditAction.CREATE,
          AuditEntityType.CONCESSION,
          undefined,
          undefined,
          undefined,
          'Concession create via createConcession',
          '192.168.1.100',
          'Mozilla/5.0',
          request.url
        );
      });

      it('should handle missing User-Agent', () => {
        // Arrange
        const request = {
          method: 'POST',
          url: '/api/concessions',
          user: mockUser,
          ip: '127.0.0.1',
          params: {},
          get: jest.fn().mockReturnValue(undefined),
        };

        const handler = { name: 'createConcession' };
        const controller = { name: 'ConcessionController' };
        const context = createMockContext(request, handler, controller);
        const next = createMockCallHandler({ success: true });

        reflector.get.mockReturnValue(undefined);

        // Act
        const result = interceptor.intercept(context, next);

        // Assert
        result.subscribe();
        expect(auditService.logAdminAction).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
          mockUser.role.name,
          AuditAction.CREATE,
          AuditEntityType.CONCESSION,
          undefined,
          undefined,
          undefined,
          'Concession create via createConcession',
          request.ip,
          undefined,
          request.url
        );
      });
    });
  });
});
