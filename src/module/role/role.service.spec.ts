import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleService } from './role.service';
import { Role } from './entity/role.entity';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepo: Repository<Role>;

  const mockRole: Role = {
    id: 1,
    name: 'ADMIN',
    permissions: [],
  };

  const mockRoleRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepo,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    roleRepo = module.get<Repository<Role>>(getRepositoryToken(Role));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRole', () => {
    describe('Success cases', () => {
      it('should create a role successfully', async () => {
        // Arrange
        mockRoleRepo.create.mockReturnValue(mockRole);
        mockRoleRepo.save.mockResolvedValue(mockRole);

        // Act
        const result = await service.createRole('ADMIN');

        // Assert
        expect(result).toEqual(mockRole);
        expect(roleRepo.create).toHaveBeenCalledWith({ name: 'ADMIN' });
        expect(roleRepo.save).toHaveBeenCalledWith(mockRole);
      });

      it('should create role with valid name', async () => {
        // Arrange
        mockRoleRepo.create.mockReturnValue(mockRole);
        mockRoleRepo.save.mockResolvedValue(mockRole);

        // Act
        const result = await service.createRole('CUSTOMER');

        // Assert
        expect(roleRepo.create).toHaveBeenCalledWith({ name: 'CUSTOMER' });
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string name', async () => {
        // Arrange
        mockRoleRepo.create.mockReturnValue(mockRole);
        mockRoleRepo.save.mockResolvedValue(mockRole);

        // Act
        const result = await service.createRole('');

        // Assert
        expect(roleRepo.create).toHaveBeenCalledWith({ name: '' });
      });

      it('should handle very long name', async () => {
        // Arrange
        const longName = 'A'.repeat(1000);
        mockRoleRepo.create.mockReturnValue(mockRole);
        mockRoleRepo.save.mockResolvedValue(mockRole);

        // Act
        const result = await service.createRole(longName);

        // Assert
        expect(roleRepo.create).toHaveBeenCalledWith({ name: longName });
      });

      it('should handle null name', async () => {
        // Arrange
        mockRoleRepo.create.mockReturnValue(mockRole);
        mockRoleRepo.save.mockResolvedValue(mockRole);

        // Act
        const result = await service.createRole(null as any);

        // Assert
        expect(roleRepo.create).toHaveBeenCalledWith({ name: null });
      });

      it('should handle undefined name', async () => {
        // Arrange
        mockRoleRepo.create.mockReturnValue(mockRole);
        mockRoleRepo.save.mockResolvedValue(mockRole);

        // Act
        const result = await service.createRole(undefined as any);

        // Assert
        expect(roleRepo.create).toHaveBeenCalledWith({ name: undefined });
      });
    });
  });

  describe('getRoles', () => {
    describe('Success cases', () => {
      it('should return all roles', async () => {
        // Arrange
        mockRoleRepo.find.mockResolvedValue([mockRole]);

        // Act
        const result = await service.getRoles();

        // Assert
        expect(result).toEqual([mockRole]);
        expect(roleRepo.find).toHaveBeenCalled();
      });

      it('should return empty array when no roles exist', async () => {
        // Arrange
        mockRoleRepo.find.mockResolvedValue([]);

        // Act
        const result = await service.getRoles();

        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('Edge cases', () => {
      it('should handle repository errors gracefully', async () => {
        // Arrange
        mockRoleRepo.find.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.getRoles()).rejects.toThrow('Database error');
      });
    });
  });

  describe('updateRole', () => {
    describe('Success cases', () => {
      it('should update a role successfully', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(mockRole);
        mockRoleRepo.save.mockResolvedValue(mockRole);

        // Act
        const result = await service.updateRole(1, 'UPDATED_ROLE');

        // Assert
        expect(result).toEqual(mockRole);
        expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(roleRepo.save).toHaveBeenCalledWith(mockRole);
        expect(mockRole.name).toBe('UPDATED_ROLE');
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when role does not exist', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.updateRole(999, 'UPDATED_ROLE')).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string name', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(mockRole);
        mockRoleRepo.save.mockResolvedValue(mockRole);

        // Act
        const result = await service.updateRole(1, '');

        // Assert
        expect(mockRole.name).toBe('');
      });

      it('should handle null name', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(mockRole);
        mockRoleRepo.save.mockResolvedValue(mockRole);

        // Act
        const result = await service.updateRole(1, null as any);

        // Assert
        expect(mockRole.name).toBe(null);
      });

      it('should handle undefined name', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(mockRole);
        mockRoleRepo.save.mockResolvedValue(mockRole);

        // Act
        const result = await service.updateRole(1, undefined as any);

        // Assert
        expect(mockRole.name).toBe(undefined);
      });

      it('should handle zero id', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.updateRole(0, 'UPDATED_ROLE')).rejects.toThrow(NotFoundException);
      });

      it('should handle negative id', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.updateRole(-1, 'UPDATED_ROLE')).rejects.toThrow(NotFoundException);
      });

      it('should handle very large id', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.updateRole(999999, 'UPDATED_ROLE')).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('deleteRole', () => {
    describe('Success cases', () => {
      it('should delete a role successfully', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(mockRole);
        mockRoleRepo.remove.mockResolvedValue(mockRole);

        // Act
        const result = await service.deleteRole(1);

        // Assert
        expect(result).toEqual(mockRole);
        expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(roleRepo.remove).toHaveBeenCalledWith(mockRole);
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when role does not exist', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.deleteRole(999)).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle zero id', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.deleteRole(0)).rejects.toThrow(NotFoundException);
      });

      it('should handle negative id', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.deleteRole(-1)).rejects.toThrow(NotFoundException);
      });

      it('should handle very large id', async () => {
        // Arrange
        mockRoleRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.deleteRole(999999)).rejects.toThrow(NotFoundException);
      });
    });
  });
});

