import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsUsedColumn1777273300000 implements MigrationInterface {
    name = 'AddIsUsedColumn1777273300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "isUsed" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "isUsed"`);
    }
}
