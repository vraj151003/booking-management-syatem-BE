import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCouponFieldsToBooking1777273500000 implements MigrationInterface {
    name = 'AddCouponFieldsToBooking1777273500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" ADD COLUMN "couponId" uuid`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD COLUMN "discountAmount" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_coupon_booking" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_coupon_booking"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "discountAmount"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "couponId"`);
    }
}
