import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReviewTable1777273700000 implements MigrationInterface {
    name = 'CreateReviewTable1777273700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "reviewable_type_enum" AS ENUM('MOVIE', 'THEATER')`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "reviewableType" "reviewable_type_enum" NOT NULL, "reviewableId" uuid NOT NULL, "rating" numeric NOT NULL, "comment" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_reviews" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_reviewable" ON "reviews" ("userId", "reviewableType", "reviewableId")`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_reviewable"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TYPE "reviewable_type_enum"`);
    }
}
