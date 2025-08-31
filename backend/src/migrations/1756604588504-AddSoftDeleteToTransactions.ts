import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteToTransactions1756604588504 implements MigrationInterface {
    name = 'AddSoftDeleteToTransactions1756604588504'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_3d6e89b14baa44a71870450d14d"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_1d251b00f7fc5ea00cb48623dbd"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_ac8efff1e2135ddfd0ab1796c5a"`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_3d6e89b14baa44a71870450d14d" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_1d251b00f7fc5ea00cb48623dbd" FOREIGN KEY ("fromAccountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_ac8efff1e2135ddfd0ab1796c5a" FOREIGN KEY ("toAccountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_ac8efff1e2135ddfd0ab1796c5a"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_1d251b00f7fc5ea00cb48623dbd"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_3d6e89b14baa44a71870450d14d"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_ac8efff1e2135ddfd0ab1796c5a" FOREIGN KEY ("toAccountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_1d251b00f7fc5ea00cb48623dbd" FOREIGN KEY ("fromAccountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_3d6e89b14baa44a71870450d14d" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
