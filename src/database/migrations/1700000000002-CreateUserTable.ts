import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserTable1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'firstName',
            type: 'varchar',
          },
          {
            name: 'lastName',
            type: 'varchar',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'mobileNumber',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'roleId',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'gender',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'dateOfBirth',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'profile',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'theatreName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'businessType',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'gstNumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'panNumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'pincode',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'bankName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'accountNumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'ifscCode',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'accountHolderName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'idProof',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'agreementDoc',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'isVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'adminVerified',
            type: 'boolean',
            default: false,
          },
        ],
      }),
      true,
    );

    // Create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "user" 
      ADD CONSTRAINT "FK_user_role" 
      FOREIGN KEY ("roleId") 
      REFERENCES "role"("id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" 
      DROP CONSTRAINT "FK_user_role"
    `);
    await queryRunner.dropTable('user');
  }
}
