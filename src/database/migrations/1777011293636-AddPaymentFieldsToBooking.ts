import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentFieldsToBooking1777011293636 implements MigrationInterface {
    name = 'AddPaymentFieldsToBooking1777011293636'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" ADD COLUMN "paymentIntentId" character varying`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD COLUMN "paymentStatus" character varying NOT NULL DEFAULT 'PENDING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "paymentStatus"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "paymentIntentId"`);
    }

}
