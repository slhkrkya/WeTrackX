import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

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
  constructor(@InjectRepository(Transaction) private repo: Repository<Transaction>) {}

  list(
  owner: User,
  opts?: {
    limit?: number;
    from?: string;
    to?: string;
    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    accountId?: string;
    categoryId?: string;
    q?: string; // title/description arama
  },
  ) {
    const limit = Math.max(1, Math.min(100, Number(opts?.limit ?? 20)));
    const qb = this.repo
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
      .orderBy('t.date', 'DESC')
      .limit(limit);

    if (opts?.from) qb.andWhere('t.date >= :from', { from: opts.from });
    if (opts?.to) qb.andWhere('t.date <= :to', { to: opts.to });
    if (opts?.type) qb.andWhere('t.type = :type', { type: opts.type });
    if (opts?.accountId) {
      // hem account hem transfer tarafları
      qb.andWhere('(account.id = :acc OR fromAccount.id = :acc OR toAccount.id = :acc)', { acc: opts.accountId });
    }
    if (opts?.categoryId) qb.andWhere('category.id = :cat', { cat: opts.categoryId });
    if (opts?.q) {
      qb.andWhere('(LOWER(t.title) LIKE :qq OR LOWER(t.description) LIKE :qq)', { qq: `%${opts.q.toLowerCase()}%` });
    }

    return qb.getMany();
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
    const t = this.repo.create({
      title: dto.title.trim(),
      type: dto.type,
      amount: dto.amount.toFixed(2),
      currency,
      date,
      description: dto.description,
      account: { id: dto.accountId } as any,
      category: { id: dto.categoryId } as any,
      owner,
    });
    return this.repo.save(t);
  }
}