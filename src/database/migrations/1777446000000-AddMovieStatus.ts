import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMovieStatus1777446000000 implements MigrationInterface {
    name = 'AddMovieStatus1777446000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."movies_status_enum" AS ENUM('UPCOMING', 'RUNNING', 'ENDED')`);
        await queryRunner.query(`ALTER TABLE "movies" ADD "status" "public"."movies_status_enum" NOT NULL DEFAULT 'UPCOMING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movies" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."movies_status_enum"`);
    }
}
