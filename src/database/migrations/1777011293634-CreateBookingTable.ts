import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBookingTable1777011293634 implements MigrationInterface {
    name = 'CreateBookingTable1777011293634'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "totalAmount" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "paymentIntentId" character varying, "paymentStatus" character varying NOT NULL DEFAULT 'PENDING', "userId" uuid, "showId" uuid, CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bookings_seats_seat" ("bookingsId" uuid NOT NULL, "seatId" uuid NOT NULL, CONSTRAINT "PK_83a44b3bb54f9d9f8e2c70c8c0c" PRIMARY KEY ("bookingsId", "seatId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4d42ef2ca0a7366317ac929967" ON "bookings_seats_seat" ("bookingsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_98dc7fd7050d8046c9cdc42e46" ON "bookings_seats_seat" ("seatId") `);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_38a69a58a323647f2e75eb994de" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_51b36e84caa13dfb2913cc7551d" FOREIGN KEY ("showId") REFERENCES "shows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings_seats_seat" ADD CONSTRAINT "FK_4d42ef2ca0a7366317ac9299679" FOREIGN KEY ("bookingsId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "bookings_seats_seat" ADD CONSTRAINT "FK_98dc7fd7050d8046c9cdc42e464" FOREIGN KEY ("seatId") REFERENCES "seat"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings_seats_seat" DROP CONSTRAINT "FK_98dc7fd7050d8046c9cdc42e464"`);
        await queryRunner.query(`ALTER TABLE "bookings_seats_seat" DROP CONSTRAINT "FK_4d42ef2ca0a7366317ac9299679"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_51b36e84caa13dfb2913cc7551d"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_38a69a58a323647f2e75eb994de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_98dc7fd7050d8046c9cdc42e46"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4d42ef2ca0a7366317ac929967"`);
        await queryRunner.query(`DROP TABLE "bookings_seats_seat"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
    }

}
