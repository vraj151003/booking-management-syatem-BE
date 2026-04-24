import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

describe('PermissionController', () => {
  let controller: PermissionController;
  let service: PermissionService;

  const mockPermission = {
    id: 1,
    name: 'CREATE_USER',
    description: 'Create user permission',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
  };

  const mockPermissionService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    assignPermissionToRole: jest.fn(),
    removePermissionFromRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionController],
      providers: [
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    controller = module.get<PermissionController>(PermissionController);
    service = module.get<PermissionService>(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    describe('Success cases', () => {
      it('should return all permissions', async () => {
        // Arrange
        mockPermissionService.findAll.mockResolvedValue([mockPermission]);

        // Act
        const result = await controller.findAll();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual([mockPermission]);
        expect(service.findAll).toHaveBeenCalled();
      });

      it('should return empty array when no permissions exist', async () => {
        // Arrange
        mockPermissionService.findAll.mockResolvedValue([]);

        // Act
        const result = await controller.findAll();

        // Assert
        expect(result.data).toEqual([]);
      });
    });

    describe('Edge cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockPermissionService.findAll.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.findAll()).rejects.toThrow('Database error');
      });
    });
  });

  describe('findOne', () => {
    describe('Success cases', () => {
      it('should return a permission by id', async () => {
        // Arrange
        mockPermissionService.findOne.mockResolvedValue(mockPermission);

        // Act
        const result = await controller.findOne(1);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockPermission);
        expect(service.findOne).toHaveBeenCalledWith(1);
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockPermissionService.findOne.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.findOne(999)).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle zero id', async () => {
        // Arrange
        mockPermissionService.findOne.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.findOne(0)).rejects.toThrow('Not found');
      });

      it('should handle negative id', async () => {
        // Arrange
        mockPermissionService.findOne.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.findOne(-1)).rejects.toThrow('Not found');
      });

      it('should handle very large id', async () => {
        // Arrange
        mockPermissionService.findOne.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.findOne(999999)).rejects.toThrow('Not found');
      });
    });
  });

  describe('remove', () => {
    describe('Success cases', () => {
      it('should remove a permission successfully', async () => {
        // Arrange
        mockPermissionService.remove.mockResolvedValue(mockPermission);

        // Act
        const result = await controller.remove(1);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockPermission);
        expect(service.remove).toHaveBeenCalledWith(1);
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockPermissionService.remove.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.remove(999)).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle zero id', async () => {
        // Arrange
        mockPermissionService.remove.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.remove(0)).rejects.toThrow('Not found');
      });

      it('should handle negative id', async () => {
        // Arrange
        mockPermissionService.remove.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.remove(-1)).rejects.toThrow('Not found');
      });
    });
  });

  describe('assignToRole', () => {
    describe('Success cases', () => {
      it('should assign permissions to role successfully', async () => {
        // Arrange
        const dto: AssignPermissionsDto = { permissionIds: [1, 2] };
        const mockResult = {
          message: '2 permissions assigned to role successfully',
          assignedPermissions: [mockPermission],
          skipped: 1,
        };
        mockPermissionService.assignPermissionToRole.mockResolvedValue(mockResult);

        // Act
        const result = await controller.assignToRole(1, dto);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockResult);
        expect(service.assignPermissionToRole).toHaveBeenCalledWith([1, 2], 1);
      });

      it('should assign single permission to role', async () => {
        // Arrange
        const dto: AssignPermissionsDto = { permissionIds: [1] };
        const mockResult = {
          message: '1 permissions assigned to role successfully',
          assignedPermissions: [mockPermission],
          skipped: 0,
        };
        mockPermissionService.assignPermissionToRole.mockResolvedValue(mockResult);

        // Act
        const result = await controller.assignToRole(1, dto);

        // Assert
        expect(service.assignPermissionToRole).toHaveBeenCalledWith([1], 1);
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        const dto: AssignPermissionsDto = { permissionIds: [1] };
        mockPermissionService.assignPermissionToRole.mockRejectedValue(new Error('Role not found'));

        // Act & Assert
        await expect(controller.assignToRole(999, dto)).rejects.toThrow('Role not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty permissionIds array', async () => {
        // Arrange
        const dto: AssignPermissionsDto = { permissionIds: [] };
        const mockResult = {
          message: '0 permissions assigned to role successfully',
          assignedPermissions: [],
          skipped: 0,
        };
        mockPermissionService.assignPermissionToRole.mockResolvedValue(mockResult);

        // Act
        const result = await controller.assignToRole(1, dto);

        // Assert
        expect(service.assignPermissionToRole).toHaveBeenCalledWith([], 1);
      });

      it('should handle null dto', async () => {
        // Arrange
        mockPermissionService.assignPermissionToRole.mockRejectedValue(new TypeError('Cannot read properties of null'));

        // Act & Assert
        await expect(controller.assignToRole(1, null as any)).rejects.toThrow(TypeError);
      });

      it('should handle undefined dto', async () => {
        // Arrange
        mockPermissionService.assignPermissionToRole.mockRejectedValue(new TypeError('Cannot read properties of undefined'));

        // Act & Assert
        await expect(controller.assignToRole(1, undefined as any)).rejects.toThrow(TypeError);
      });

      it('should handle zero roleId', async () => {
        // Arrange
        const dto: AssignPermissionsDto = { permissionIds: [1] };
        mockPermissionService.assignPermissionToRole.mockRejectedValue(new Error('Role not found'));

        // Act & Assert
        await expect(controller.assignToRole(0, dto)).rejects.toThrow('Role not found');
      });

      it('should handle negative roleId', async () => {
        // Arrange
        const dto: AssignPermissionsDto = { permissionIds: [1] };
        mockPermissionService.assignPermissionToRole.mockRejectedValue(new Error('Role not found'));

        // Act & Assert
        await expect(controller.assignToRole(-1, dto)).rejects.toThrow('Role not found');
      });

      it('should handle very large roleId', async () => {
        // Arrange
        const dto: AssignPermissionsDto = { permissionIds: [1] };
        mockPermissionService.assignPermissionToRole.mockRejectedValue(new Error('Role not found'));

        // Act & Assert
        await expect(controller.assignToRole(999999, dto)).rejects.toThrow('Role not found');
      });
    });
  });

  describe('removeFromRole', () => {
    describe('Success cases', () => {
      it('should remove permission from role successfully', async () => {
        // Arrange
        const mockResult = { message: 'Permission removed from role successfully' };
        mockPermissionService.removePermissionFromRole.mockResolvedValue(mockResult);

        // Act
        const result = await controller.removeFromRole(1, 1);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockResult);
        expect(service.removePermissionFromRole).toHaveBeenCalledWith(1, 1);
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockPermissionService.removePermissionFromRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.removeFromRole(999, 1)).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle zero permissionId', async () => {
        // Arrange
        mockPermissionService.removePermissionFromRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.removeFromRole(0, 1)).rejects.toThrow('Not found');
      });

      it('should handle negative permissionId', async () => {
        // Arrange
        mockPermissionService.removePermissionFromRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.removeFromRole(-1, 1)).rejects.toThrow('Not found');
      });

      it('should handle zero roleId', async () => {
        // Arrange
        mockPermissionService.removePermissionFromRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.removeFromRole(1, 0)).rejects.toThrow('Not found');
      });

      it('should handle negative roleId', async () => {
        // Arrange
        mockPermissionService.removePermissionFromRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.removeFromRole(1, -1)).rejects.toThrow('Not found');
      });
    });
  });
});
