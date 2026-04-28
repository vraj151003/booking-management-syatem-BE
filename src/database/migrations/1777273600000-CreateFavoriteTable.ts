import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFavoriteTable1777273600000 implements MigrationInterface {
    name = 'CreateFavoriteTable1777273600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "favoritable_type_enum" AS ENUM('MOVIE', 'THEATER')`);
        await queryRunner.query(`CREATE TABLE "favorites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "favoritableType" "favoritable_type_enum" NOT NULL, "favoritableId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_favorites" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_favoritable" ON "favorites" ("userId", "favoritableType", "favoritableId")`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_favorites_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_favorites_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_favoritable"`);
        await queryRunner.query(`DROP TABLE "favorites"`);
        await queryRunner.query(`DROP TYPE "favoritable_type_enum"`);
    }
}
