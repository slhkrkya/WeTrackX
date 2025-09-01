import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1756716391100 implements MigrationInterface {
    name = 'Initial1756716391100'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "name" character varying NOT NULL DEFAULT '', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "kind" character varying(8) NOT NULL, "color" character varying, "priority" integer NOT NULL DEFAULT '0', "isSystem" boolean NOT NULL DEFAULT false, "isSystemOverride" boolean NOT NULL DEFAULT false, "originalSystemId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "parentId" uuid, "ownerId" uuid, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5b9a0e64781f59477f6807bb3a" ON "category" ("ownerId", "originalSystemId") WHERE "isSystemOverride"= true`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3dd380462595bd86df0534ae84" ON "category" ("isSystem", "name", "kind") WHERE "isSystemOverride" = false`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_72673fdfd4729636f476bd2b17" ON "category" ("ownerId", "name", "kind") WHERE "isSystemOverride" = false`);
        await queryRunner.query(`CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(100) NOT NULL, "note" text, "type" character varying(8) NOT NULL, "amount" numeric(14,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'TRY', "date" TIMESTAMP WITH TIME ZONE NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "accountId" uuid, "fromAccountId" uuid, "toAccountId" uuid, "categoryId" uuid, "ownerId" uuid NOT NULL, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cea3afc59b2249741b8b7c0b2c" ON "transaction" ("ownerId", "date") `);
        await queryRunner.query(`CREATE TABLE "account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" character varying(16) NOT NULL DEFAULT 'BANK', "currency" character varying(3) NOT NULL DEFAULT 'TRY', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "ownerId" uuid NOT NULL, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_dc22a1794ef075028191b801d3" ON "account" ("ownerId", "name") `);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "FK_d5456fd7e4c4866fec8ada1fa10" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "FK_ffcf79002e1738147305ea57664" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_3d6e89b14baa44a71870450d14d" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_1d251b00f7fc5ea00cb48623dbd" FOREIGN KEY ("fromAccountId") REFERENCES "account"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_ac8efff1e2135ddfd0ab1796c5a" FOREIGN KEY ("toAccountId") REFERENCES "account"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_d3951864751c5812e70d033978d" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_4c8758c388632a5cc0dde24060a" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account" ADD CONSTRAINT "FK_72719f338bfbe9aa98f4439d2b4" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT "FK_72719f338bfbe9aa98f4439d2b4"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_4c8758c388632a5cc0dde24060a"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_d3951864751c5812e70d033978d"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_ac8efff1e2135ddfd0ab1796c5a"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_1d251b00f7fc5ea00cb48623dbd"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_3d6e89b14baa44a71870450d14d"`);
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_ffcf79002e1738147305ea57664"`);
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_d5456fd7e4c4866fec8ada1fa10"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc22a1794ef075028191b801d3"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cea3afc59b2249741b8b7c0b2c"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_72673fdfd4729636f476bd2b17"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3dd380462595bd86df0534ae84"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b9a0e64781f59477f6807bb3a"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
