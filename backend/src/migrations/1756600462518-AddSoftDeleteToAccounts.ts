import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteToAccounts1756600462518 implements MigrationInterface {
    name = 'AddSoftDeleteToAccounts1756600462518'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Sadece soft delete için deletedAt kolonu ekle
        await queryRunner.query(`ALTER TABLE "account" ADD "deletedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // deletedAt kolonunu kaldır
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "deletedAt"`);
    }
}
