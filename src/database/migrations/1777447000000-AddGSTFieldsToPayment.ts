import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGSTFieldsToPayment1777447000000 implements MigrationInterface {
    name = 'AddGSTFieldsToPayment1777447000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new GST columns
        await queryRunner.query(`ALTER TABLE "payments" ADD COLUMN "baseAmount" numeric NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "payments" ADD COLUMN "gstRate" numeric NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "payments" ADD COLUMN "gstAmount" numeric NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "payments" ADD COLUMN "totalAmount" numeric NOT NULL DEFAULT 0`);

        // Migrate existing data: copy amount to baseAmount and totalAmount, set gstRate and gstAmount to 0
        await queryRunner.query(`UPDATE "payments" SET "baseAmount" = "amount", "totalAmount" = "amount" WHERE "baseAmount" = 0`);

        // Drop the old amount column
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "amount"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add back the old amount column
        await queryRunner.query(`ALTER TABLE "payments" ADD COLUMN "amount" numeric NOT NULL DEFAULT 0`);

        // Migrate data back: copy totalAmount to amount
        await queryRunner.query(`UPDATE "payments" SET "amount" = "totalAmount" WHERE "amount" = 0`);

        // Drop the new GST columns
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "totalAmount"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "gstAmount"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "gstRate"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "baseAmount"`);
    }
}
