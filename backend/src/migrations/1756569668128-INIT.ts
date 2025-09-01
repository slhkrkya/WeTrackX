import { MigrationInterface, QueryRunner } from "typeorm";

export class INIT1756569668128 implements MigrationInterface {
    name = 'INIT1756569668128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Users tablosu
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        
        // Categories tablosu
        await queryRunner.query(`CREATE TABLE "category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "kind" character varying(8) NOT NULL, "color" character varying, "priority" integer NOT NULL DEFAULT '0', "isSystem" boolean NOT NULL DEFAULT false, "isSystemOverride" boolean NOT NULL DEFAULT false, "originalSystemId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "parentId" uuid, "ownerId" uuid, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
        
        // Accounts tablosu
        await queryRunner.query(`CREATE TABLE "account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" character varying NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'TRY', "balance" numeric(15,2) NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid, CONSTRAINT "PK_b0151cea52d185dc4f4d4c7c4d8" PRIMARY KEY ("id"))`);
        
        // Transactions tablosu
        await queryRunner.query(`CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(15,2) NOT NULL, "description" character varying, "date" TIMESTAMP NOT NULL, "type" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "accountId" uuid, "fromAccountId" uuid, "toAccountId" uuid, "categoryId" uuid, "ownerId" uuid, CONSTRAINT "PK_89eadb93a168105ad3f9f35b3b3" PRIMARY KEY ("id"))`);
        
        // Foreign key constraints
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "FK_d5456fd7e4a4864c7741e8f3bf9" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "FK_32b856438d400bf9f9392c61517" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account" ADD CONSTRAINT "FK_60328bf27019ff49f769c75b6c3" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_3d6e89b14baa44a71870450d14d" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_1d251b00f7fc5ea00cb48623dbd" FOREIGN KEY ("fromAccountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_ac8efff1e2135ddfd0ab1796c5a" FOREIGN KEY ("toAccountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_d0a7f4a76c0e285a332b163b8e5" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_6f72a7ce8c5649c5c5c5c5c5c5c5" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        // Indexes
        await queryRunner.query(`CREATE INDEX "IDX_category_owner_name_kind" ON "category" ("ownerId", "name", "kind") WHERE "isSystemOverride" = false`);
        await queryRunner.query(`CREATE INDEX "IDX_category_system_name_kind" ON "category" ("isSystem", "name", "kind") WHERE "isSystemOverride" = false`);
        await queryRunner.query(`CREATE INDEX "IDX_category_owner_original_system" ON "category" ("ownerId", "originalSystemId") WHERE "isSystemOverride" = true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_6f72a7ce8c5649c5c5c5c5c5c5c5"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_d0a7f4a76c0e285a332b163b8e5"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_ac8efff1e2135ddfd0ab1796c5a"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_1d251b00f7fc5ea00cb48623dbd"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_3d6e89b14baa44a71870450d14d"`);
        await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT "FK_60328bf27019ff49f769c75b6c3"`);
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_32b856438d400bf9f9392c61517"`);
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_d5456fd7e4a4864c7741e8f3bf9"`);
        
        // Drop tables
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }
}
