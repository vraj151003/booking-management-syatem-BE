import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, PrimaryGeneratedColumn, ManyToMany } from "typeorm";
import { Permission } from "../../permission/entity/permission.entity";


@Entity()
export class Role {
    @ApiProperty({ example: 1, description: 'The unique identifier of the role' })
    @PrimaryGeneratedColumn()
    id : number;

    @ApiProperty({
        example: 'ADMIN',
        description: 'The name of the role (e.g., ADMIN, MANAGER, CUSTOMER)'
    })
    @Column({
        type : 'varchar',
        unique : true,
    })
    name : string;

    @ManyToMany(() => Permission, (permission) => permission.roles)
    permissions: Permission[];

}