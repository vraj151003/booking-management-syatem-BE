import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PermissionService } from './permission.service';
import { Permission } from './entity/permission.entity';
import { Role } from '../role/entity/role.entity';

describe('PermissionService', () => {
  let service: PermissionService;
  let permissionRepo: Repository<Permission>;

  const mockPermission: Permission = {
    id: 1,
    name: 'CREATE_USER',
    description: 'Create user permission',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
  };

  const mockRole: Role = {
    id: 1,
    name: 'ADMIN',
    permissions: [],
  };

  const mockPermissionRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    manager: {
      getRepository: jest.fn(),
    },
  };

  const roleRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepo,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    permissionRepo = module.get<Repository<Permission>>(getRepositoryToken(Permission));
    mockPermissionRepo.manager.getRepository.mockReturnValue(roleRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    describe('Success cases', () => {
      it('should return all permissions with relations', async () => {
        // Arrange
        mockPermissionRepo.find.mockResolvedValue([mockPermission]);

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toEqual([mockPermission]);
        expect(permissionRepo.find).toHaveBeenCalledWith({ relations: ['roles'] });
      });

      it('should return empty array when no permissions exist', async () => {
        // Arrange
        mockPermissionRepo.find.mockResolvedValue([]);

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('Edge cases', () => {
      it('should handle repository errors gracefully', async () => {
        // Arrange
        mockPermissionRepo.find.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.findAll()).rejects.toThrow('Database error');
      });
    });
  });

  describe('findOne', () => {
    describe('Success cases', () => {
      it('should return a permission by id with relations', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(mockPermission);

        // Act
        const result = await service.findOne(1);

        // Assert
        expect(result).toEqual(mockPermission);
        expect(permissionRepo.findOne).toHaveBeenCalledWith({
          where: { id: 1 },
          relations: ['roles'],
        });
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when permission does not exist', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle zero id', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne(0)).rejects.toThrow(NotFoundException);
      });

      it('should handle negative id', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne(-1)).rejects.toThrow(NotFoundException);
      });

      it('should handle very large id', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne(999999)).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('remove', () => {
    describe('Success cases', () => {
      it('should remove a permission successfully', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(mockPermission);
        mockPermissionRepo.remove.mockResolvedValue(mockPermission);

        // Act
        const result = await service.remove(1);

        // Assert
        expect(result).toEqual(mockPermission);
        expect(permissionRepo.remove).toHaveBeenCalledWith(mockPermission);
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when permission does not exist', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle zero id', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.remove(0)).rejects.toThrow(NotFoundException);
      });

      it('should handle negative id', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.remove(-1)).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('assignPermissionToRole', () => {
    beforeEach(() => {
      // Mock the service's findOne method to return the mock permission
      jest.spyOn(service, 'findOne').mockImplementation(async (id: number) => {
        if (id === 999) {
          throw new NotFoundException('Permission not found');
        }
        return mockPermission;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('Success cases', () => {
      it('should assign multiple permissions to role successfully', async () => {
        // Arrange
        const permissionIds = [1, 2];
        roleRepo.findOne.mockResolvedValue(mockRole);
        roleRepo.save.mockResolvedValue(mockRole);

        // Act
        const result = await service.assignPermissionToRole(permissionIds, 1);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('assignedPermissions');
        expect(result).toHaveProperty('skipped');
        expect(roleRepo.findOne).toHaveBeenCalledWith({
          where: { id: 1 },
          relations: ['permissions'],
        });
        expect(roleRepo.save).toHaveBeenCalledWith(mockRole);
      });

      it('should assign single permission to role', async () => {
        // Arrange
        const permissionIds = [1];
        const roleWithEmptyPermissions = { ...mockRole, permissions: [] };
        roleRepo.findOne.mockResolvedValue(roleWithEmptyPermissions);
        roleRepo.save.mockResolvedValue(roleWithEmptyPermissions);

        // Act
        const result = await service.assignPermissionToRole(permissionIds, 1);

        // Assert
        expect(result.assignedPermissions.length).toBe(1);
      });

      it('should skip already assigned permissions', async () => {
        // Arrange
        const permissionIds = [1];
        const roleWithPermission = { ...mockRole, permissions: [mockPermission] };
        roleRepo.findOne.mockResolvedValue(roleWithPermission);
        roleRepo.save.mockResolvedValue(roleWithPermission);

        // Act
        const result = await service.assignPermissionToRole(permissionIds, 1);

        // Assert
        expect(result.assignedPermissions.length).toBe(0);
        expect(result.skipped).toBe(1);
      });

      it('should initialize permissions array if null', async () => {
        // Arrange
        const permissionIds = [1];
        const roleWithoutPermissions = { ...mockRole, permissions: null as any };
        roleRepo.findOne.mockResolvedValue(roleWithoutPermissions);
        roleRepo.save.mockResolvedValue(roleWithoutPermissions);

        // Act
        const result = await service.assignPermissionToRole(permissionIds, 1);

        // Assert
        expect(roleWithoutPermissions.permissions).toEqual([mockPermission]);
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when role does not exist', async () => {
        // Arrange
        const permissionIds = [1];
        roleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.assignPermissionToRole(permissionIds, 999)).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when permission does not exist', async () => {
        // Arrange
        const permissionIds = [999];
        roleRepo.findOne.mockResolvedValue(mockRole);

        // Act & Assert
        await expect(service.assignPermissionToRole(permissionIds, 1)).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty permissionIds array', async () => {
        // Arrange
        const permissionIds: number[] = [];
        roleRepo.findOne.mockResolvedValue(mockRole);
        roleRepo.save.mockResolvedValue(mockRole);

        // Act
        const result = await service.assignPermissionToRole(permissionIds, 1);

        // Assert
        expect(result.assignedPermissions.length).toBe(0);
        expect(result.skipped).toBe(0);
      });

      it('should handle null permissionIds', async () => {
        // Arrange
        roleRepo.findOne.mockResolvedValue(mockRole);
        roleRepo.save.mockResolvedValue(mockRole);

        // Act & Assert
        await expect(service.assignPermissionToRole(null as any, 1)).rejects.toThrow();
      });

      it('should handle undefined permissionIds', async () => {
        // Arrange
        roleRepo.findOne.mockResolvedValue(mockRole);
        roleRepo.save.mockResolvedValue(mockRole);

        // Act & Assert
        await expect(service.assignPermissionToRole(undefined as any, 1)).rejects.toThrow();
      });

      it('should handle zero roleId', async () => {
        // Arrange
        const permissionIds = [1];
        roleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.assignPermissionToRole(permissionIds, 0)).rejects.toThrow(NotFoundException);
      });

      it('should handle negative roleId', async () => {
        // Arrange
        const permissionIds = [1];
        roleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.assignPermissionToRole(permissionIds, -1)).rejects.toThrow(NotFoundException);
      });

      it('should handle very large roleId', async () => {
        // Arrange
        const permissionIds = [1];
        roleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.assignPermissionToRole(permissionIds, 999999)).rejects.toThrow(NotFoundException);
      });

      it('should handle duplicate permissionIds', async () => {
        // Arrange
        const permissionIds = [1, 1];
        const roleWithEmptyPermissions = { ...mockRole, permissions: [] };
        roleRepo.findOne.mockResolvedValue(roleWithEmptyPermissions);
        roleRepo.save.mockResolvedValue(roleWithEmptyPermissions);

        // Act
        const result = await service.assignPermissionToRole(permissionIds, 1);

        // Assert
        expect(result.assignedPermissions.length).toBe(1);
        expect(result.skipped).toBe(1);
      });
    });
  });

  describe('removePermissionFromRole', () => {
    describe('Success cases', () => {
      it('should remove permission from role successfully', async () => {
        // Arrange
        const roleWithPermission = { ...mockRole, permissions: [mockPermission] };
        mockPermissionRepo.findOne.mockResolvedValue(mockPermission);
        roleRepo.findOne.mockResolvedValue(roleWithPermission);
        roleRepo.save.mockResolvedValue(roleWithPermission);

        // Act
        const result = await service.removePermissionFromRole(1, 1);

        // Assert
        expect(result).toHaveProperty('message');
        expect(roleRepo.findOne).toHaveBeenCalledWith({
          where: { id: 1 },
          relations: ['permissions'],
        });
        expect(roleRepo.save).toHaveBeenCalledWith(roleWithPermission);
      });

      it('should filter out the removed permission', async () => {
        // Arrange
        const roleWithPermission = { ...mockRole, permissions: [mockPermission] };
        mockPermissionRepo.findOne.mockResolvedValue(mockPermission);
        roleRepo.findOne.mockResolvedValue(roleWithPermission);
        roleRepo.save.mockResolvedValue(roleWithPermission);

        // Act
        const result = await service.removePermissionFromRole(1, 1);

        // Assert
        expect(roleWithPermission.permissions).toEqual([]);
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when role does not exist', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(mockPermission);
        roleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.removePermissionFromRole(1, 999)).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when permission does not exist', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.removePermissionFromRole(999, 1)).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle when permission is not assigned to role', async () => {
        // Arrange
        const roleWithoutPermission = { ...mockRole, permissions: [] };
        mockPermissionRepo.findOne.mockResolvedValue(mockPermission);
        roleRepo.findOne.mockResolvedValue(roleWithoutPermission);
        roleRepo.save.mockResolvedValue(roleWithoutPermission);

        // Act
        const result = await service.removePermissionFromRole(1, 1);

        // Assert
        expect(roleWithoutPermission.permissions).toEqual([]);
      });

      it('should handle zero permissionId', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.removePermissionFromRole(0, 1)).rejects.toThrow(NotFoundException);
      });

      it('should handle negative permissionId', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.removePermissionFromRole(-1, 1)).rejects.toThrow(NotFoundException);
      });

      it('should handle zero roleId', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(mockPermission);
        roleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.removePermissionFromRole(1, 0)).rejects.toThrow(NotFoundException);
      });

      it('should handle negative roleId', async () => {
        // Arrange
        mockPermissionRepo.findOne.mockResolvedValue(mockPermission);
        roleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.removePermissionFromRole(1, -1)).rejects.toThrow(NotFoundException);
      });
    });
  });
});
