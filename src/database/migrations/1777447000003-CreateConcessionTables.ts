import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateConcessionTables1777447000003 implements MigrationInterface {
    name = 'CreateConcessionTables1777447000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create concession_categories table
        await queryRunner.query(`CREATE TABLE "concession_categories" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "displayOrder" integer NOT NULL DEFAULT 0, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_concession_categories" PRIMARY KEY ("id"))`);
        
        // Create concessions table
        await queryRunner.query(`CREATE TABLE "concessions" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "stockQuantity" integer NOT NULL DEFAULT 0, "minStockLevel" integer NOT NULL DEFAULT 10, "status" character varying(50) NOT NULL DEFAULT 'ACTIVE', "imageUrl" character varying(500), "preparationTime" integer NOT NULL DEFAULT 5, "isPreOrderable" boolean NOT NULL DEFAULT true, "theaterOwnerId" uuid NOT NULL, "categoryId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_concessions" PRIMARY KEY ("id"))`);
        
        // Create concession_orders table
        await queryRunner.query(`CREATE TABLE "concession_orders" ("id" SERIAL NOT NULL, "bookingId" uuid NOT NULL, "userId" uuid NOT NULL, "totalAmount" numeric(10,2) NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'PENDING', "pickupTime" character varying(50), "showStartTime" TIMESTAMP, "estimatedPreparationTime" integer NOT NULL DEFAULT 0, "specialInstructions" text, "paymentReference" character varying(255), "isPaid" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_concession_orders" PRIMARY KEY ("id"))`);
        
        // Create concession_order_items table
        await queryRunner.query(`CREATE TABLE "concession_order_items" ("id" SERIAL NOT NULL, "concessionOrderId" integer NOT NULL, "concessionId" integer NOT NULL, "quantity" integer NOT NULL DEFAULT 1, "unitPrice" numeric(10,2) NOT NULL, "totalPrice" numeric(10,2) NOT NULL, "customization" text, "isPrepared" boolean NOT NULL DEFAULT false, "isPickedUp" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_concession_order_items" PRIMARY KEY ("id"))`);
        
        // Create foreign key constraints
        await queryRunner.query(`ALTER TABLE "concessions" ADD CONSTRAINT "FK_concessions_theaterOwner" FOREIGN KEY ("theaterOwnerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "concessions" ADD CONSTRAINT "FK_concessions_category" FOREIGN KEY ("categoryId") REFERENCES "concession_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "concession_orders" ADD CONSTRAINT "FK_concession_orders_booking" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "concession_orders" ADD CONSTRAINT "FK_concession_orders_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "concession_order_items" ADD CONSTRAINT "FK_concession_order_items_order" FOREIGN KEY ("concessionOrderId") REFERENCES "concession_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "concession_order_items" ADD CONSTRAINT "FK_concession_order_items_concession" FOREIGN KEY ("concessionId") REFERENCES "concessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        // Create indexes for performance
        await queryRunner.query(`CREATE INDEX "IDX_CONCESSION_THEATER_OWNER" ON "concessions" ("theaterOwnerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_CONCESSION_CATEGORY" ON "concessions" ("categoryId")`);
        await queryRunner.query(`CREATE INDEX "IDX_CONCESSION_STATUS" ON "concessions" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_CONCESSION_ORDER_BOOKING" ON "concession_orders" ("bookingId")`);
        await queryRunner.query(`CREATE INDEX "IDX_CONCESSION_ORDER_USER" ON "concession_orders" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_CONCESSION_ORDER_STATUS" ON "concession_orders" ("status")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "concession_order_items"`);
        await queryRunner.query(`DROP TABLE "concession_orders"`);
        await queryRunner.query(`DROP TABLE "concessions"`);
        await queryRunner.query(`DROP TABLE "concession_categories"`);
    }
}
