import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteToAccounts1756600462518 implements MigrationInterface {
    name = 'AddSoftDeleteToAccounts1756600462518'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Accounts için soft delete kolonu ekle
        await queryRunner.query(`ALTER TABLE "account" ADD "deletedAt" TIMESTAMP`);
        
        // Transactions için soft delete kolonu ekle
        await queryRunner.query(`ALTER TABLE "transaction" ADD "deletedAt" TIMESTAMP`);
        
        // Mevcut foreign key constraint'leri kaldır (eğer varsa)
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "FK_3d6e89b14baa44a71870450d14d"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "FK_1d251b00f7fc5ea00cb48623dbd"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "FK_ac8efff1e2135ddfd0ab1796c5a"`);
        
        // Soft delete ile uyumlu foreign key constraint'leri ekle (NO ACTION)
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_3d6e89b14baa44a71870450d14d" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_1d251b00f7fc5ea00cb48623dbd" FOREIGN KEY ("fromAccountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_ac8efff1e2135ddfd0ab1796c5a" FOREIGN KEY ("toAccountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Foreign key constraint'leri kaldır
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "FK_ac8efff1e2135ddfd0ab1796c5a"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "FK_1d251b00f7fc5ea00cb48623dbd"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "FK_3d6e89b14baa44a71870450d14d"`);
        
        // Soft delete kolonlarını kaldır
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "deletedAt"`);
        
        // Eski cascade delete constraint'leri geri ekle
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_ac8efff1e2135ddfd0ab1796c5a" FOREIGN KEY ("toAccountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_1d251b00f7fc5ea00cb48623dbd" FOREIGN KEY ("fromAccountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_3d6e89b14baa44a71870450d14d" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
