import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePaymentTable1777011293635 implements MigrationInterface {
    name = 'CreatePaymentTable1777011293635'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "payments_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" integer NOT NULL, "currency" character varying NOT NULL, "paymentIntentId" character varying NOT NULL, "status" "payments_status_enum" NOT NULL DEFAULT 'PENDING', "method" character varying, "transactionId" character varying, "failureReason" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "bookingId" uuid, "userId" uuid, CONSTRAINT "PK_5d1e27e7b0e9c5b5e5e5e5e5e5e5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_bookingId" ON "payments" ("bookingId")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_userId" ON "payments" ("userId")`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_booking" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_user"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_booking"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_payments_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_payments_bookingId"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "payments_status_enum"`);
    }

}
