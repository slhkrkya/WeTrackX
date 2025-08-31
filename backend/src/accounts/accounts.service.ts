// src/accounts/accounts.service.ts
import { Injectable } from '@nestjs/common';
import { Repository, Not, IsNull } from 'typeorm';
import { Account, AccountType } from './account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

type CreateAccountDto = {
  name: string;
  type?: AccountType;
  currency?: string;
};

@Injectable()
export class AccountsService {
  constructor(@InjectRepository(Account) private repo: Repository<Account>) {}

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
    if (!acc) throw new Error('Account not found');
    return acc;
  }

  async update(owner: User, id: string, dto: Partial<CreateAccountDto>) {
    const acc = await this.repo.findOne({ 
      where: { id, owner },
      withDeleted: false // Silinmiş hesapları gösterme
    });
    if (!acc) throw new Error('Account not found');
    
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
      // Soft delete - hesabı silinmiş olarak işaretle
      await this.repo.softRemove(acc);
      return true;
    } catch (e: any) {
      console.error('Hesap silme hatası:', e);
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
      // Manuel olarak deletedAt'i NULL yap
      await this.repo.query('UPDATE "account" SET "deletedAt" = NULL WHERE "id" = $1', [id]);
      
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
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 7);
      
      const result = await this.repo
        .createQueryBuilder('account')
        .delete()
        .where('deletedAt IS NOT NULL AND deletedAt < :date', { date: thirtyDaysAgo })
        .execute();
      
      console.log(`${result.affected} adet eski silinmiş hesap temizlendi`);
      return result.affected || 0;
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