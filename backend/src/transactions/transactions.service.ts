import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';

type UpsertIncomeExpense = {
  type: 'INCOME' | 'EXPENSE';
  title: string;
  amount: number;
  currency?: string;
  date: string | Date;
  description?: string;
  accountId: string;
  categoryId: string;
};

type UpsertTransfer = {
  type: 'TRANSFER';
  title: string;
  amount: number;
  currency?: string;
  date: string | Date;
  description?: string;
  fromAccountId: string;
  toAccountId: string;
};

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private repo: Repository<Transaction>,
    @InjectRepository(Category) private readonly catRepo: Repository<Category>,
  ) {}

  async list(
    owner: User,
    opts?: {
      page?: number;
      pageSize?: number;
      from?: string;
      to?: string;
      type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      accountId?: string;
      categoryId?: string;
      q?: string; // title/description arama
      sort?: 'date' | 'amount';
      order?: 'asc' | 'desc';
    },
  ) {
    const pageSize = Math.max(1, Math.min(100, Number(opts?.pageSize ?? 20)));
    const page = Math.max(1, Number(opts?.page ?? 1));
    const orderBy = opts?.sort === 'amount' ? 't.amount' : 't.date';
    const orderDir = (opts?.order ?? 'desc').toUpperCase() as 'ASC' | 'DESC';

    const baseQb = this.repo
      .createQueryBuilder('t')
      .leftJoin('t.account', 'account')
      .leftJoin('t.fromAccount', 'fromAccount')
      .leftJoin('t.toAccount', 'toAccount')
      .leftJoin('t.category', 'category')
      .addSelect([
        'account.id', 'account.name',
        'fromAccount.id', 'fromAccount.name',
        'toAccount.id', 'toAccount.name',
        'category.id', 'category.name',
      ])
      .where('t.ownerId = :ownerId', { ownerId: (owner as any).id })
      .andWhere('t.deletedAt IS NULL') // Silinmiş işlemleri gösterme
      .orderBy(orderBy, orderDir);

    if (opts?.from) baseQb.andWhere('t.date >= :from', { from: opts.from });
    if (opts?.to) baseQb.andWhere('t.date <= :to', { to: opts.to });
    if (opts?.type) baseQb.andWhere('t.type = :type', { type: opts.type });
    if (opts?.accountId) {
      // hem account hem transfer tarafları
      baseQb.andWhere('(account.id = :acc OR fromAccount.id = :acc OR toAccount.id = :acc)', { acc: opts.accountId });
    }
    if (opts?.categoryId) baseQb.andWhere('category.id = :cat', { cat: opts.categoryId });
    if (opts?.q) {
      baseQb.andWhere('(LOWER(t.title) LIKE :qq OR LOWER(t.description) LIKE :qq)', { qq: `%${opts.q.toLowerCase()}%` });
    }

    const total = await baseQb.getCount();
    const items = await baseQb
      .clone()
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getMany();

    return { items, total, page, pageSize };
  }
  
  async create(owner: User, dto: UpsertIncomeExpense | UpsertTransfer) {
    const currency = dto.currency ?? 'TRY';
    const date = new Date(dto.date);

    if (dto.type === 'TRANSFER') {
      if (!dto.fromAccountId || !dto.toAccountId) {
        throw new BadRequestException('fromAccountId ve toAccountId zorunlu');
      }
      if (dto.fromAccountId === dto.toAccountId) {
        throw new BadRequestException('Aynı hesaplar arasında transfer olmaz');
      }
      const t = this.repo.create({
        title: dto.title.trim(),
        type: 'TRANSFER',
        amount: dto.amount.toFixed(2),
        currency,
        date,
        description: dto.description,
        fromAccount: { id: dto.fromAccountId } as any,
        toAccount: { id: dto.toAccountId } as any,
        owner,
      });
      return this.repo.save(t);
    }

    // INCOME | EXPENSE
    if (!dto.accountId || !dto.categoryId) {
      throw new BadRequestException('accountId ve categoryId zorunlu');
    }
    // Kategori tipini kontrol et ve işaret doğrulaması yap
    const cat = await this.catRepo.findOne({ where: { id: dto.categoryId } });
    if (!cat) throw new BadRequestException('Geçersiz categoryId');
    if (cat.kind !== dto.type) throw new BadRequestException('Kategori tipi ile işlem tipi uyumsuz');
    if (dto.amount <= 0) throw new BadRequestException('Tutar pozitif olmalı');
    
    // EXPENSE için tutarı negatif yap
    const finalAmount = dto.type === 'EXPENSE' ? -Math.abs(dto.amount) : Math.abs(dto.amount);
    const t = this.repo.create({
      title: dto.title.trim(),
      type: dto.type,
      amount: finalAmount.toFixed(2),
      currency,
      date,
      description: dto.description,
      account: { id: dto.accountId } as any,
      category: { id: dto.categoryId } as any,
      owner,
    });
    return this.repo.save(t);
  }

  async update(owner: User, id: string, dto: Partial<UpsertIncomeExpense | UpsertTransfer>) {
    const tx = await this.repo.findOne({ where: { id, owner } });
    if (!tx) throw new NotFoundException('Transaction not found');

    if (dto.type === 'TRANSFER' || tx.type === 'TRANSFER') {
      // Basit yaklaşım: transfer güncelleme minimum — opsiyonel kapsam
      if (dto.type && dto.type !== 'TRANSFER') throw new BadRequestException('TRANSFER tipi değiştirilemez');
      if (dto.amount !== undefined && !(dto.amount > 0)) throw new BadRequestException('TRANSFER tutar pozitif olmalı');
      if (dto.title) tx.title = dto.title.trim();
      if (dto.amount !== undefined) tx.amount = dto.amount.toFixed(2);
      if (dto.currency) tx.currency = dto.currency;
      if (dto.date) tx.date = new Date(dto.date);
      if ((dto as any).fromAccountId) (tx as any).fromAccount = { id: (dto as any).fromAccountId } as any;
      if ((dto as any).toAccountId) (tx as any).toAccount = { id: (dto as any).toAccountId } as any;
      if (dto.description !== undefined) tx.description = dto.description;
      return this.repo.save(tx);
    }

    // INCOME/EXPENSE update
    const newType = (dto as any).type ?? tx.type;
    const newAmount = (dto as any).amount ?? Number(tx.amount);
    const newCategoryId = (dto as any).categoryId ?? (tx as any).category?.id;
    if (!newCategoryId) throw new BadRequestException('categoryId zorunlu');
    const cat = await this.catRepo.findOne({ where: { id: newCategoryId } });
    if (!cat) throw new BadRequestException('Geçersiz categoryId');
    if (cat.kind !== newType) throw new BadRequestException('Kategori tipi ile işlem tipi uyumsuz');
    if (newAmount <= 0) throw new BadRequestException('Tutar pozitif olmalı');
    
    // EXPENSE için tutarı negatif yap
    const finalAmount = newType === 'EXPENSE' ? -Math.abs(newAmount) : Math.abs(newAmount);

    if ((dto as any).title) tx.title = (dto as any).title.trim();
    if ((dto as any).type) (tx as any).type = (dto as any).type as any;
    if ((dto as any).amount !== undefined) (tx as any).amount = finalAmount.toFixed(2);
    if ((dto as any).currency) (tx as any).currency = (dto as any).currency;
    if ((dto as any).date) (tx as any).date = new Date((dto as any).date);
    if ((dto as any).description !== undefined) (tx as any).description = (dto as any).description;
    if ((dto as any).accountId) (tx as any).account = { id: (dto as any).accountId } as any;
    if ((dto as any).categoryId) (tx as any).category = { id: (dto as any).categoryId } as any;
    return this.repo.save(tx);
  }

  async get(owner: User, id: string) {
    const tx = await this.repo
      .createQueryBuilder('t')
      .leftJoin('t.account', 'account')
      .leftJoin('t.fromAccount', 'fromAccount')
      .leftJoin('t.toAccount', 'toAccount')
      .leftJoin('t.category', 'category')
      .addSelect([
        'account.id', 'account.name',
        'fromAccount.id', 'fromAccount.name',
        'toAccount.id', 'toAccount.name',
        'category.id', 'category.name',
      ])
      .where('t.id = :id', { id })
      .andWhere('t.ownerId = :ownerId', { ownerId: (owner as any).id })
      .andWhere('t.deletedAt IS NULL') // Silinmiş işlemleri gösterme
      .getOne();

    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async remove(owner: User, id: string) {
    const tx = await this.repo.findOne({ where: { id, owner } });
    if (!tx) throw new NotFoundException('Transaction not found');
    await this.repo.softRemove(tx);
    return true;
  }

  // Hesaba bağlı tüm işlemleri soft delete yap
  async softDeleteByAccount(owner: User, accountId: string) {
    try {
      // Hesaba bağlı tüm işlemleri bul (account, fromAccount, toAccount)
      const transactions = await this.repo.find({
        where: [
          { owner, account: { id: accountId } as any },
          { owner, fromAccount: { id: accountId } as any },
          { owner, toAccount: { id: accountId } as any }
        ],
        withDeleted: false
      });

      if (transactions.length > 0) {
        // Tüm işlemleri soft delete yap
        await this.repo.softRemove(transactions);
        console.log(`${transactions.length} adet işlem soft delete yapıldı (hesap: ${accountId})`);
      }

      return transactions.length;
    } catch (error) {
      console.error('İşlemleri soft delete yaparken hata:', error);
      throw error;
    }
  }

  // Hesaba bağlı tüm işlemleri geri yükle
  async restoreByAccount(owner: User, accountId: string) {
    try {
      // Hesaba bağlı tüm silinmiş işlemleri bul
      const deletedTransactions = await this.repo.find({
        where: [
          { owner, account: { id: accountId } as any },
          { owner, fromAccount: { id: accountId } as any },
          { owner, toAccount: { id: accountId } as any }
        ],
        withDeleted: true
      });

      const transactionsToRestore = deletedTransactions.filter(tx => tx.deletedAt !== null);

      if (transactionsToRestore.length > 0) {
        // Tüm işlemlerin ID'lerini al
        const transactionIds = transactionsToRestore.map(tx => tx.id);
        
        // Raw SQL ile deletedAt'i NULL yap
        await this.repo.query('UPDATE "transaction" SET "deletedAt" = NULL WHERE "id" = ANY($1)', [transactionIds]);
        
        console.log(`${transactionsToRestore.length} adet işlem geri yüklendi (hesap: ${accountId})`);
      }

      return transactionsToRestore.length;
    } catch (error) {
      console.error('İşlemleri geri yüklerken hata:', error);
      throw error;
    }
  }
}