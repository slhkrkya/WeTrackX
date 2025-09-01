import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCategoryUniqueConstraints1756569668129 implements MigrationInterface {
    name = 'FixCategoryUniqueConstraints1756569668129'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Bu migration artık gerekli değil çünkü indexler INIT migration'ında oluşturuluyor
        // Migration'ı boş bırakıyoruz ama geriye dönük uyumluluk için koruyoruz
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Bu migration artık gerekli değil
    }
}
