import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuditLogsTable1777964087884 implements MigrationInterface {
    name = 'CreateAuditLogsTable1777964087884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'BOOKING_CREATED', 'BOOKING_UPDATED', 'BOOKING_CANCELLED', 'PAYMENT_PROCESSED', 'PAYMENT_REFUNDED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'ROLE_ASSIGNED', 'PERMISSION_GRANTED')`);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_entitytype_enum" AS ENUM('USER', 'BOOKING', 'PAYMENT', 'MOVIE', 'SHOW', 'THEATER', 'ROLE', 'PERMISSION')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" "public"."audit_logs_action_enum" NOT NULL, "entityType" "public"."audit_logs_entitytype_enum", "entityId" character varying, "oldValues" jsonb, "newValues" jsonb, "userId" uuid NOT NULL, "userEmail" character varying, "userRole" character varying, "ipAddress" character varying NOT NULL, "userAgent" character varying, "endpoint" character varying, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entityType" ON "audit_logs" ("entityType")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entityId" ON "audit_logs" ("entityId")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_userId" ON "audit_logs" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_createdAt" ON "audit_logs" ("createdAt")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_createdAt"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_entityId"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_entityType"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_action"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_entitytype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
    }

}
