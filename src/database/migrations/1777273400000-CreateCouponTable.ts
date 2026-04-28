import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCouponTable1777273400000 implements MigrationInterface {
    name = 'CreateCouponTable1777273400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "coupon_type_enum" AS ENUM('PERCENTAGE', 'FIXED')`);
        await queryRunner.query(`CREATE TYPE "coupon_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "coupons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "type" "coupon_type_enum" NOT NULL, "discountValue" numeric(10,2) NOT NULL, "maxUses" integer NOT NULL DEFAULT 1, "usedCount" integer NOT NULL DEFAULT 0, "minOrderAmount" numeric(10,2), "maxDiscountAmount" numeric(10,2), "validFrom" date NOT NULL, "validUntil" date NOT NULL, "status" "coupon_status_enum" NOT NULL DEFAULT 'ACTIVE', "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6f0e3e8e2e2e2e2e2e2e2e2e2e2e2e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_coupon_code" ON "coupons" ("code")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_coupon_code"`);
        await queryRunner.query(`DROP TABLE "coupons"`);
        await queryRunner.query(`DROP TYPE "coupon_status_enum"`);
        await queryRunner.query(`DROP TYPE "coupon_type_enum"`);
    }
}
