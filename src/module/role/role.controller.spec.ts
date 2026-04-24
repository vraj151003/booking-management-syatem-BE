import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

describe('RoleController', () => {
  let controller: RoleController;
  let service: RoleService;

  const mockRole = {
    id: 1,
    name: 'ADMIN',
    permissions: [],
  };

  const mockRoleService = {
    createRole: jest.fn(),
    getRoles: jest.fn(),
    updateRole: jest.fn(),
    deleteRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
    service = module.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRole', () => {
    describe('Success cases', () => {
      it('should create a role successfully', async () => {
        // Arrange
        const dto: CreateRoleDto = { name: 'ADMIN' };
        mockRoleService.createRole.mockResolvedValue(mockRole);

        // Act
        const result = await controller.createRole(dto);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockRole);
        expect(service.createRole).toHaveBeenCalledWith('ADMIN');
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        const dto: CreateRoleDto = { name: 'ADMIN' };
        mockRoleService.createRole.mockRejectedValue(new Error('Service error'));

        // Act & Assert
        await expect(controller.createRole(dto)).rejects.toThrow('Service error');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty dto', async () => {
        // Arrange
        const dto = {} as CreateRoleDto;
        mockRoleService.createRole.mockRejectedValue(new Error('Validation error'));

        // Act & Assert
        await expect(controller.createRole(dto)).rejects.toThrow('Validation error');
      });

      it('should handle null dto', async () => {
        // Arrange
        mockRoleService.createRole.mockRejectedValue(new TypeError('Cannot read properties of null'));

        // Act & Assert
        await expect(controller.createRole(null as any)).rejects.toThrow(TypeError);
      });

      it('should handle undefined dto', async () => {
        // Arrange
        mockRoleService.createRole.mockRejectedValue(new TypeError('Cannot read properties of undefined'));

        // Act & Assert
        await expect(controller.createRole(undefined as any)).rejects.toThrow(TypeError);
      });

      it('should handle empty string name', async () => {
        // Arrange
        const dto: CreateRoleDto = { name: '' };
        mockRoleService.createRole.mockResolvedValue(mockRole);

        // Act
        const result = await controller.createRole(dto);

        // Assert
        expect(service.createRole).toHaveBeenCalledWith('');
      });

      it('should handle very long name', async () => {
        // Arrange
        const dto: CreateRoleDto = { name: 'A'.repeat(1000) };
        mockRoleService.createRole.mockResolvedValue(mockRole);

        // Act
        const result = await controller.createRole(dto);

        // Assert
        expect(service.createRole).toHaveBeenCalledWith('A'.repeat(1000));
      });
    });
  });

  describe('getAllRoles', () => {
    describe('Success cases', () => {
      it('should return all roles', async () => {
        // Arrange
        mockRoleService.getRoles.mockResolvedValue([mockRole]);

        // Act
        const result = await controller.getAllRoles();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual([mockRole]);
        expect(service.getRoles).toHaveBeenCalled();
      });

      it('should return empty array when no roles exist', async () => {
        // Arrange
        mockRoleService.getRoles.mockResolvedValue([]);

        // Act
        const result = await controller.getAllRoles();

        // Assert
        expect(result.data).toEqual([]);
      });
    });

    describe('Edge cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockRoleService.getRoles.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.getAllRoles()).rejects.toThrow('Database error');
      });
    });
  });

  describe('updateRole', () => {
    describe('Success cases', () => {
      it('should update a role successfully', async () => {
        // Arrange
        const dto: UpdateRoleDto = { name: 'UPDATED_ROLE' };
        mockRoleService.updateRole.mockResolvedValue(mockRole);

        // Act
        const result = await controller.updateRole(1, dto);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockRole);
        expect(service.updateRole).toHaveBeenCalledWith(1, 'UPDATED_ROLE');
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        const dto: UpdateRoleDto = { name: 'UPDATED_ROLE' };
        mockRoleService.updateRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.updateRole(999, dto)).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty dto', async () => {
        // Arrange
        const dto: UpdateRoleDto = {};
        mockRoleService.updateRole.mockResolvedValue(mockRole);

        // Act
        const result = await controller.updateRole(1, dto);

        // Assert
        expect(service.updateRole).toHaveBeenCalledWith(1, undefined);
      });

      it('should handle null dto', async () => {
        // Arrange
        mockRoleService.updateRole.mockRejectedValue(new TypeError('Cannot read properties of null'));

        // Act & Assert
        await expect(controller.updateRole(1, null as any)).rejects.toThrow(TypeError);
      });

      it('should handle undefined dto', async () => {
        // Arrange
        mockRoleService.updateRole.mockRejectedValue(new TypeError('Cannot read properties of undefined'));

        // Act & Assert
        await expect(controller.updateRole(1, undefined as any)).rejects.toThrow(TypeError);
      });

      it('should handle zero id', async () => {
        // Arrange
        const dto: UpdateRoleDto = { name: 'UPDATED_ROLE' };
        mockRoleService.updateRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.updateRole(0, dto)).rejects.toThrow('Not found');
      });

      it('should handle negative id', async () => {
        // Arrange
        const dto: UpdateRoleDto = { name: 'UPDATED_ROLE' };
        mockRoleService.updateRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.updateRole(-1, dto)).rejects.toThrow('Not found');
      });

      it('should handle very large id', async () => {
        // Arrange
        const dto: UpdateRoleDto = { name: 'UPDATED_ROLE' };
        mockRoleService.updateRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.updateRole(999999, dto)).rejects.toThrow('Not found');
      });
    });
  });

  describe('deleteRole', () => {
    describe('Success cases', () => {
      it('should delete a role successfully', async () => {
        // Arrange
        mockRoleService.deleteRole.mockResolvedValue(mockRole);

        // Act
        const result = await controller.deleteRole(1);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockRole);
        expect(service.deleteRole).toHaveBeenCalledWith(1);
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockRoleService.deleteRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.deleteRole(999)).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle zero id', async () => {
        // Arrange
        mockRoleService.deleteRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.deleteRole(0)).rejects.toThrow('Not found');
      });

      it('should handle negative id', async () => {
        // Arrange
        mockRoleService.deleteRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.deleteRole(-1)).rejects.toThrow('Not found');
      });

      it('should handle very large id', async () => {
        // Arrange
        mockRoleService.deleteRole.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.deleteRole(999999)).rejects.toThrow('Not found');
      });
    });
  });
});

