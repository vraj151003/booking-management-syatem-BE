import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFailedLoginAttemptsToUser1777444000000 implements MigrationInterface {
    name = 'AddFailedLoginAttemptsToUser1777444000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "failedLoginAttempts" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "user" ADD "lockedUntil" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "lockedUntil"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "failedLoginAttempts"`);
    }
}
