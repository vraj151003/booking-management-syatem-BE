import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entity/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async createRole(name: string) {
    const role = this.roleRepo.create({ name });
    return this.roleRepo.save(role);
  }

  async getRoles() {
    return this.roleRepo.find();
  }

  async updateRole(id: number, name: string) {
    const role = await this.roleRepo.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    role.name = name;
    return this.roleRepo.save(role);
  }

  async deleteRole(id: number) {
    const role = await this.roleRepo.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.roleRepo.remove(role);
  }
}
