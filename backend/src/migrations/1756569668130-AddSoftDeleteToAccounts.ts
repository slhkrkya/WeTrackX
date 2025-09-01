import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteToAccounts1756569668130 implements MigrationInterface {
    name = 'AddSoftDeleteToAccounts1756569668130'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Bu migration artık gerekli değil çünkü kolonlar zaten mevcut
        // Migration'ı boş bırakıyoruz ama geriye dönük uyumluluk için koruyoruz
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Bu migration artık gerekli değil
    }
}
