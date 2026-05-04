import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedAtToBooking1777273046413 implements MigrationInterface {
    name = 'AddCreatedAtToBooking1777273046413'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_user_role"`);
        await queryRunner.query(`ALTER TABLE "screens" DROP CONSTRAINT "FK_6fc6dbe4e88b7d605ff57389092"`);
        await queryRunner.query(`ALTER TABLE "shows" DROP CONSTRAINT "FK_c3b308f49df8783e504f63dc3f0"`);
        await queryRunner.query(`ALTER TABLE "shows" DROP CONSTRAINT "FK_63b262fee87fce34ad0462af4cc"`);
        await queryRunner.query(`ALTER TABLE "seat" DROP CONSTRAINT "FK_1140d3d30847c3a13faa0a43329"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_booking"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_user"`);
        await queryRunner.query(`ALTER TABLE "otp" DROP CONSTRAINT "FK_otp_user"`);
        await queryRunner.query(`ALTER TABLE "role_permission" DROP CONSTRAINT "FK_72e80be86cab0e93e67ed1a7a9a"`);
        await queryRunner.query(`ALTER TABLE "role_permission" DROP CONSTRAINT "FK_e3130a39c1e4a740d044e685730"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_payments_bookingId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_payments_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_otp_userId"`);
        // Check if column exists before adding
        const tableInfo = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'bookings' 
            AND column_name = 'createdAt'
            AND table_schema = 'public'
        `);
        
        if (tableInfo.length === 0) {
            await queryRunner.query(`ALTER TABLE "bookings" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        }
        await queryRunner.query(`ALTER TABLE "permission" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "permission" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        // Handle role table name column safely
        await queryRunner.query(`ALTER TABLE "role" DROP CONSTRAINT "UQ_ae4578dcaed5adff96595e61660"`);
        
        // Update null values with unique values
        await queryRunner.query(`
            UPDATE "role" 
            SET "name" = 'ROLE_' || id::text 
            WHERE "name" IS NULL
        `);
        
        await queryRunner.query(`ALTER TABLE "role" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "role" ADD CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "movies" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "movies" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "IDX_72e80be86cab0e93e67ed1a7a9" ON "role_permission" ("permissionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e3130a39c1e4a740d044e68573" ON "role_permission" ("roleId") `);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "screens" ADD CONSTRAINT "FK_6fc6dbe4e88b7d605ff57389092" FOREIGN KEY ("theaterOwnerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shows" ADD CONSTRAINT "FK_c3b308f49df8783e504f63dc3f0" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shows" ADD CONSTRAINT "FK_63b262fee87fce34ad0462af4cc" FOREIGN KEY ("screenId") REFERENCES "screens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "seat" ADD CONSTRAINT "FK_1140d3d30847c3a13faa0a43329" FOREIGN KEY ("screenId") REFERENCES "screens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_1ead3dc5d71db0ea822706e389d" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "otp" ADD CONSTRAINT "FK_db724db1bc3d94ad5ba38518433" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permission" ADD CONSTRAINT "FK_72e80be86cab0e93e67ed1a7a9a" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permission" ADD CONSTRAINT "FK_e3130a39c1e4a740d044e685730" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role_permission" DROP CONSTRAINT "FK_e3130a39c1e4a740d044e685730"`);
        await queryRunner.query(`ALTER TABLE "role_permission" DROP CONSTRAINT "FK_72e80be86cab0e93e67ed1a7a9a"`);
        await queryRunner.query(`ALTER TABLE "otp" DROP CONSTRAINT "FK_db724db1bc3d94ad5ba38518433"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_1ead3dc5d71db0ea822706e389d"`);
        await queryRunner.query(`ALTER TABLE "seat" DROP CONSTRAINT "FK_1140d3d30847c3a13faa0a43329"`);
        await queryRunner.query(`ALTER TABLE "shows" DROP CONSTRAINT "FK_63b262fee87fce34ad0462af4cc"`);
        await queryRunner.query(`ALTER TABLE "shows" DROP CONSTRAINT "FK_c3b308f49df8783e504f63dc3f0"`);
        await queryRunner.query(`ALTER TABLE "screens" DROP CONSTRAINT "FK_6fc6dbe4e88b7d605ff57389092"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_c28e52f758e7bbc53828db92194"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e3130a39c1e4a740d044e68573"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_72e80be86cab0e93e67ed1a7a9"`);
        await queryRunner.query(`ALTER TABLE "movies" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "movies" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "role" DROP CONSTRAINT "UQ_ae4578dcaed5adff96595e61660"`);
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "role" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "role" ADD CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "permission" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "permission" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "createdAt"`);
        await queryRunner.query(`CREATE INDEX "IDX_otp_userId" ON "otp" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_payments_userId" ON "payments" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_payments_bookingId" ON "payments" ("bookingId") `);
        await queryRunner.query(`ALTER TABLE "role_permission" ADD CONSTRAINT "FK_e3130a39c1e4a740d044e685730" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permission" ADD CONSTRAINT "FK_72e80be86cab0e93e67ed1a7a9a" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "otp" ADD CONSTRAINT "FK_otp_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_booking" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "seat" ADD CONSTRAINT "FK_1140d3d30847c3a13faa0a43329" FOREIGN KEY ("screenId") REFERENCES "screens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shows" ADD CONSTRAINT "FK_63b262fee87fce34ad0462af4cc" FOREIGN KEY ("screenId") REFERENCES "screens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shows" ADD CONSTRAINT "FK_c3b308f49df8783e504f63dc3f0" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "screens" ADD CONSTRAINT "FK_6fc6dbe4e88b7d605ff57389092" FOREIGN KEY ("theaterOwnerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_user_role" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
