import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class ChangeRoleNameToString1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "role" 
      ALTER COLUMN "name" TYPE varchar(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "role" 
      ALTER COLUMN "name" TYPE integer USING "name"::integer
    `);
  }
}
