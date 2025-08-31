import { MigrationInterface, QueryRunner } from "typeorm";

export class INIT1756600706664 implements MigrationInterface {
    name = 'INIT1756600706664'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_category_owner_name_kind"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_category_system_name_kind"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_category_owner_original_system"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_df13edef99b02ab688bb9fb692"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5b9a0e64781f59477f6807bb3a" ON "category" ("ownerId", "originalSystemId") WHERE "isSystemOverride" = true`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3dd380462595bd86df0534ae84" ON "category" ("isSystem", "name", "kind") WHERE "isSystemOverride" = false`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_72673fdfd4729636f476bd2b17" ON "category" ("ownerId", "name", "kind") WHERE "isSystemOverride" = false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_72673fdfd4729636f476bd2b17"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3dd380462595bd86df0534ae84"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b9a0e64781f59477f6807bb3a"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_df13edef99b02ab688bb9fb692" ON "category" ("kind", "name", "ownerId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_category_owner_original_system" ON "category" ("originalSystemId", "ownerId") WHERE ("isSystemOverride" = true)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_category_system_name_kind" ON "category" ("isSystem", "kind", "name") WHERE ("isSystemOverride" = false)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_category_owner_name_kind" ON "category" ("kind", "name", "ownerId") WHERE ("isSystemOverride" = false)`);
    }

}
