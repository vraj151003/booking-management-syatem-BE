import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entity/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async findAll() {
    return this.permissionRepo.find({ relations: ['roles'] });
  }

  async findOne(id: number) {
    const permission = await this.permissionRepo.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async remove(id: number) {
    const permission = await this.findOne(id);
    return this.permissionRepo.remove(permission);
  }

  async assignPermissionToRole(permissionId: number, roleId: number) {
    const permission = await this.findOne(permissionId);
    
    const { Role } = require('../role/entity/role.entity');
    const role = await this.permissionRepo.manager.getRepository(Role).findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (!role.permissions) {
      role.permissions = [];
    }

    if (role.permissions.some(p => p.id === permissionId)) {
      throw new BadRequestException('Permission already assigned to role');
    }

    role.permissions.push(permission);
    await this.permissionRepo.manager.getRepository(Role).save(role);

    return { message: 'Permission assigned to role successfully' };
  }

  async removePermissionFromRole(permissionId: number, roleId: number) {
    const permission = await this.findOne(permissionId);
    
    const { Role } = require('../role/entity/role.entity');
    const role = await this.permissionRepo.manager.getRepository(Role).findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    role.permissions = role.permissions.filter(p => p.id !== permissionId);
    await this.permissionRepo.manager.getRepository(Role).save(role);

    return { message: 'Permission removed from role successfully' };
  }
}
