import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCategoryUniqueConstraints1756504407930 implements MigrationInterface {
    name = 'FixCategoryUniqueConstraints1756504407930'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing unique constraints if they exist
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_7da8c13926d1ee4b87ef023f2d"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_8a8c13926d1ee4b87ef023f2d"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_category_owner_name_kind"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_category_system_name_kind"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_category_owner_original_system"`);
        
        // Create new conditional unique constraints
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_category_owner_name_kind" ON "category" ("ownerId", "name", "kind") WHERE "isSystemOverride" = false`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_category_system_name_kind" ON "category" ("isSystem", "name", "kind") WHERE "isSystemOverride" = false`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_category_owner_original_system" ON "category" ("ownerId", "originalSystemId") WHERE "isSystemOverride" = true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop new constraints
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_category_owner_name_kind"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_category_system_name_kind"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_category_owner_original_system"`);
        
        // Restore original constraints
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7da8c13926d1ee4b87ef023f2d" ON "category" ("ownerId", "name", "kind")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8a8c13926d1ee4b87ef023f2d" ON "category" ("isSystem", "name", "kind")`);
    }
}
