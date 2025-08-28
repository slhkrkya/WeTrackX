import { MigrationInterface, QueryRunner } from "typeorm";

export class INIT1756401235416 implements MigrationInterface {
    name = 'INIT1756401235416'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" ADD "title" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "note" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "note"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "title"`);
    }

}
