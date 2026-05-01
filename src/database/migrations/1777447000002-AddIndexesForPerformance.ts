import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesForPerformance1777447000002 implements MigrationInterface {
  name = 'AddIndexesForPerformance1777447000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Movie indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_movies_name" ON "movies" ("name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_movies_genre" ON "movies" ("genre")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_movies_rating" ON "movies" ("rating")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_movies_language" ON "movies" ("language")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_movies_releaseDate" ON "movies" ("releaseDate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_movies_isActive" ON "movies" ("isActive")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_movies_status" ON "movies" ("status")`);

    // Booking indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bookings_status" ON "bookings" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bookings_paymentStatus" ON "bookings" ("paymentStatus")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bookings_isUsed" ON "bookings" ("isUsed")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bookings_couponId" ON "bookings" ("couponId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bookings_createdAt" ON "bookings" ("createdAt")`);

    // Show indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_shows_showDate" ON "shows" ("showDate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_shows_startTime" ON "shows" ("startTime")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_shows_isActive" ON "shows" ("isActive")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Movie indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movies_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movies_genre"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movies_rating"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movies_language"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movies_releaseDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movies_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movies_status"`);

    // Booking indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_paymentStatus"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_isUsed"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_couponId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_createdAt"`);

    // Show indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shows_showDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shows_startTime"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shows_isActive"`);
  }
}
