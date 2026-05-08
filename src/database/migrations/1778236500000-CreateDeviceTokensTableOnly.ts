import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDeviceTokensTableOnly1778236500000 implements MigrationInterface {
    name = 'CreateDeviceTokensTableOnly1778236500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "device_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "user_id" uuid NOT NULL, 
                "device_token" character varying NOT NULL, 
                "device_type" character varying NOT NULL, 
                "is_active" boolean NOT NULL DEFAULT true, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_device_tokens" PRIMARY KEY ("id")
            )
        `);
        
        await queryRunner.query(`
            ALTER TABLE "device_tokens" 
            ADD CONSTRAINT "FK_device_tokens_user_id" 
            FOREIGN KEY ("user_id") REFERENCES "user"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create indexes for performance
        await queryRunner.query(`CREATE INDEX "IDX_device_tokens_user_id" ON "device_tokens" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_device_tokens_token" ON "device_tokens" ("device_token")`);
        await queryRunner.query(`CREATE INDEX "IDX_device_tokens_is_active" ON "device_tokens" ("is_active")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "device_tokens"`);
    }
}
