import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOtpTable1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'otp',
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
            name: 'code',
            type: 'varchar',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'isUsed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "otp" 
      ADD CONSTRAINT "FK_otp_user" 
      FOREIGN KEY ("userId") 
      REFERENCES "user"("id") 
      ON DELETE CASCADE
    `);

    // Create index for faster OTP lookup
    await queryRunner.query(`
      CREATE INDEX "IDX_otp_userId" ON "otp"("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_otp_userId"
    `);
    await queryRunner.query(`
      ALTER TABLE "otp" 
      DROP CONSTRAINT "FK_otp_user"
    `);
    await queryRunner.dropTable('otp');
  }
}
