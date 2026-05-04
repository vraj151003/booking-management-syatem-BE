import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeBookingTotalAmountToDecimal1777447000001 implements MigrationInterface {
    name = 'ChangeBookingTotalAmountToDecimal1777447000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Change totalAmount from integer to decimal
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "totalAmount" TYPE numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to integer
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "totalAmount" TYPE integer`);
    }
}
