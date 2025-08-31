// src/accounts/accounts.service.ts
import { Injectable } from '@nestjs/common';
import { Repository, Not, IsNull, LessThan } from 'typeorm';
import { Account, AccountType } from './account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransactionsService } from '../transactions/transactions.service';

type CreateAccountDto = {
  name: string;
  type?: AccountType;
  currency?: string;
};

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account) private repo: Repository<Account>,
    private transactionsService: TransactionsService
  ) {}

  list(owner: User) {
    return this.repo.find({ 
      where: { owner }, 
      order: { createdAt: 'DESC' },
      withDeleted: false // Silinmiş hesapları gösterme
    });
  }

  async create(owner: User, dto: CreateAccountDto) {
    const currency = dto.currency ?? 'TRY';
    const acc = this.repo.create({
      name: dto.name,
      type: dto.type ?? 'BANK',
      currency: currency,
      // DeepPartial<User> beklentisine tam uysun diye owner'ı id ile veriyoruz
      owner: { id: owner.id } as any,
    });
    return this.repo.save(acc);
  }

  async get(owner: User, id: string) {
    const acc = await this.repo.findOne({ 
      where: { id, owner },
      withDeleted: false // Silinmiş hesapları gösterme
    });
    if (!acc) throw new Error('Hesap bulunamadı');
    return acc;
  }

  async update(owner: User, id: string, dto: Partial<CreateAccountDto>) {
    const acc = await this.repo.findOne({ 
      where: { id, owner },
      withDeleted: false // Silinmiş hesapları gösterme
    });
    if (!acc) throw new Error('Hesap bulunamadı');
    
    if (dto.name !== undefined) acc.name = dto.name;
    if (dto.type !== undefined) acc.type = dto.type;
    if (dto.currency !== undefined) acc.currency = dto.currency;
    
    return this.repo.save(acc);
  }

  async remove(owner: User, id: string) {
    const acc = await this.repo.findOne({ 
      where: { id, owner },
      withDeleted: false // Silinmiş hesapları gösterme
    });
    if (!acc) return null;
    
    try {
      // Transaction içinde işlemleri yap
      await this.repo.manager.transaction(async (transactionalEntityManager) => {
        // Önce hesaba bağlı tüm işlemleri soft delete yap
        const deletedTransactionsCount = await this.transactionsService.softDeleteByAccountWithManager(transactionalEntityManager, owner, id);
        console.log(`Hesap silinmeden önce ${deletedTransactionsCount} adet işlem soft delete yapıldı`);
        
        // Sonra hesabı soft delete yap
        await transactionalEntityManager.softRemove(acc);
        console.log(`Hesap soft delete yapıldı: ${acc.name} (${id})`);
      });
      
      return true;
    } catch (e: any) {
      console.error('Hesap silme hatası:', e);
      
      // Foreign key constraint hatası ise daha detaylı mesaj ver
      if (e.message && e.message.includes('foreign key constraint')) {
        throw new Error('Bu hesaba ait işlemler bulunduğu için silinemiyor. Önce işlemleri silin veya başka bir hesaba aktarın.');
      }
      
      throw new Error('Hesap silinirken beklenmeyen bir hata oluştu');
    }
  }

  // Silinmiş hesapları listele
  async listDeleted(owner: User) {
    try {
      // Önce tüm hesapları al (silinmiş olanlar dahil)
      const allAccounts = await this.repo.find({ 
        where: { owner },
        withDeleted: true
      });
      
      // Sadece silinmiş olanları filtrele
      const deletedAccounts = allAccounts.filter(account => account.deletedAt !== null);
      
      return deletedAccounts;
    } catch (error) {
      console.error('listDeleted hatası:', error);
      throw error;
    }
  }

  // Hesabı geri yükle (restore)
  async restore(owner: User, id: string) {
    const acc = await this.repo.findOne({ 
      where: { id, owner },
      withDeleted: true // Silinmiş hesapları da göster
    });
    if (!acc) throw new Error('Hesap bulunamadı');
    if (!acc.deletedAt) throw new Error('Bu hesap zaten aktif durumda');
    
    try {
      // Önce hesabı geri yükle
      await this.repo.query('UPDATE "account" SET "deletedAt" = NULL WHERE "id" = $1', [id]);
      
      // Sonra hesaba bağlı tüm işlemleri geri yükle
      const restoredTransactionsCount = await this.transactionsService.restoreByAccount(owner, id);
      console.log(`Hesap geri yüklendikten sonra ${restoredTransactionsCount} adet işlem geri yüklendi`);
      
      // Güncellenmiş hesabı döndür
      const restoredAccount = await this.repo.findOne({ 
        where: { id, owner },
        withDeleted: true
      });
      
      if (!restoredAccount) {
        throw new Error('Hesap geri yüklendi ancak bulunamadı');
      }
      
      // deletedAt null ise hesap başarıyla geri yüklenmiş demektir
      if (restoredAccount.deletedAt !== null) {
        throw new Error('Hesap geri yüklenemedi');
      }
      
      return restoredAccount;
    } catch (error) {
      console.error('Hesap geri yükleme hatası:', error);
      throw new Error('Hesap geri yüklenirken beklenmeyen bir hata oluştu');
    }
  }

  // Kalıcı silme (hard delete) - sadece admin için
  async hardRemove(owner: User, id: string) {
    const acc = await this.repo.findOne({ 
      where: { id, owner },
      withDeleted: true // Silinmiş hesapları da göster
    });
    if (!acc) return null;
    
    try {
      // Kalıcı silme
      await this.repo.remove(acc);
      return true;
    } catch (e: any) {
      console.error('Hesap kalıcı silme hatası:', e);
      throw new Error('Hesap kalıcı olarak silinirken beklenmeyen bir hata oluştu');
    }
  }

  // Eski silinmiş hesapları otomatik temizle (7 günden eski)
  async cleanupOldDeletedAccounts() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Önce silinecek hesapları bul
      const accountsToDelete = await this.repo.find({
        where: {
          deletedAt: LessThan(sevenDaysAgo)
        },
        withDeleted: true
      });

      if (accountsToDelete.length > 0) {
        let totalDeletedTransactions = 0;

        // Her hesap için bağlı işlemleri de kalıcı sil
        for (const account of accountsToDelete) {
          try {
            // Hesaba bağlı silinmiş işlemleri kalıcı sil
            const deletedTransactionsResult = await this.repo.query(
              'DELETE FROM "transaction" WHERE ("accountId" = $1 OR "fromAccountId" = $1 OR "toAccountId" = $1) AND "deletedAt" IS NOT NULL',
              [account.id]
            );
            
            const deletedCount = deletedTransactionsResult.rowCount || 0;
            totalDeletedTransactions += deletedCount;
            
            console.log(`Hesap ${account.name} (${account.id}) için ${deletedCount} adet silinmiş işlem kalıcı silindi`);
          } catch (error) {
            console.error(`Hesap ${account.id} için işlem silme hatası:`, error);
            // Hata olsa bile devam et
          }
        }

        // Sonra hesapları kalıcı sil
        const result = await this.repo
          .createQueryBuilder('account')
          .delete()
          .where('deletedAt IS NOT NULL AND deletedAt < :date', { date: sevenDaysAgo })
          .execute();

        const deletedAccountsCount = result.affected || 0;
        console.log(`${deletedAccountsCount} adet eski silinmiş hesap ve ${totalDeletedTransactions} adet bağlı işlem kalıcı olarak temizlendi`);
        return deletedAccountsCount;
      }

      return 0;
    } catch (error) {
      console.error('Eski hesapları temizleme hatası:', error);
      throw error;
    }
  }

  // Her gün gece yarısı çalışacak scheduled task
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanupTask() {
    console.log('🕐 Eski silinmiş hesaplar temizleniyor...');
    try {
      const cleanedCount = await this.cleanupOldDeletedAccounts();
      if (cleanedCount > 0) {
        console.log(`✅ Başarıyla ${cleanedCount} adet eski hesap temizlendi`);
      } else {
        console.log('ℹ️ Temizlenecek eski hesap bulunamadı');
      }
    } catch (error) {
      console.error('❌ Scheduled cleanup task hatası:', error);
    }
  }
}