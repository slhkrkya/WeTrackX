import { MigrationInterface, QueryRunner } from "typeorm";

export class INIT1756569668128 implements MigrationInterface {
    name = 'INIT1756569668128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" ADD "isSystemOverride" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "category" ADD "originalSystemId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "originalSystemId"`);
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "isSystemOverride"`);
    }

}
