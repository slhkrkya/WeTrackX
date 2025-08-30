import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { Category } from '../categories/category.entity';
import { Account } from '../accounts/account.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
    @InjectRepository(Category) private readonly catRepo: Repository<Category>,
  ) {}

  /**
   * Hesap bakiyeleri: her hesap için toplam bakiye (income + expense + transfer).
   * İşlem yapılmamış hesaplar da dahil edilir.
   */
  async getBalances(ownerId: string) {
    // Önce tüm hesapları al
    const accountRepo = this.txRepo.manager.getRepository(Account);
    
    const allAccounts = await accountRepo.find({
      where: { owner: { id: ownerId } },
      order: { name: 'ASC' }
    });

    // Her hesap için bakiye hesapla
    const balances = await Promise.all(
      allAccounts.map(async (account) => {
        const qb = this.txRepo.createQueryBuilder('t')
          .leftJoin('t.account', 'acc')
          .leftJoin('t.fromAccount', 'fromAcc')
          .leftJoin('t.toAccount', 'toAcc')
          .select(`
            SUM(
              CASE
                WHEN t.type = 'INCOME'   AND acc.id      = :accountId THEN CAST(t.amount AS NUMERIC)
                WHEN t.type = 'EXPENSE'  AND acc.id      = :accountId THEN CAST(t.amount AS NUMERIC)
                WHEN t.type = 'TRANSFER' AND fromAcc.id  = :accountId THEN -CAST(t.amount AS NUMERIC)
                WHEN t.type = 'TRANSFER' AND toAcc.id    = :accountId THEN  CAST(t.amount AS NUMERIC)
                ELSE 0
              END
            )
          `, 'balance')
          .where('t.ownerId = :ownerId', { ownerId })
          .andWhere('(acc.id = :accountId OR fromAcc.id = :accountId OR toAcc.id = :accountId)', { accountId: account.id });

        const result = await qb.getRawOne<{ balance: string }>();
        const balance = result?.balance ? Number(result.balance) : 0;

        return {
          accountId: account.id,
          name: account.name,
          currency: account.currency,
          balance: balance.toFixed(2),
        };
      })
    );

    return balances;
  }

  /**
   * Nakit akışı (tarih aralığına göre): toplam income, toplam expense, net.
   */
  async getCashflow(ownerId: string, from?: string, to?: string) {
  const qb = this.txRepo.createQueryBuilder('t')
    .select(
      `SUM(CASE WHEN t.type = 'INCOME' THEN CAST(t.amount AS NUMERIC) ELSE 0 END)`,
      'income',
    )
    .addSelect(
      `SUM(CASE WHEN t.type = 'EXPENSE' THEN CAST(t.amount AS NUMERIC) ELSE 0 END)`,
      'expense',
    )
    .where('t.ownerId = :ownerId', { ownerId });

    if (from) qb.andWhere('t.date >= :from', { from });
    if (to)   qb.andWhere('t.date <= :to',   { to });

    const row = await qb.getRawOne<{ income: string; expense: string }>();
    const incomeNum = Number(row?.income ?? 0);
    const expenseSum = Number(row?.expense ?? 0); // NEGATİF toplam (EXPENSE)

    const net = incomeNum + expenseSum;           // ← kritik: TOPLAMA
    return {
      income: incomeNum.toFixed(2),
      expense: Math.abs(expenseSum).toFixed(2),   // UI’da “Gider” pozitif gözüksün
      net: net.toFixed(2),
    };
  }

  /**
   * Kategori toplamları (INCOME/EXPENSE), tarih filtresi ile.
   * Transfer kategorisiz sayıldığı için dahil etmiyoruz.
   * İşlem olmasa bile sistem kategorilerini göster.
   */
  async getCategoryTotals(ownerId: string, kind: 'INCOME' | 'EXPENSE', from?: string, to?: string) {
    // Önce işlem bazlı kategori toplamlarını al
    const qb = this.txRepo.createQueryBuilder('t')
      .leftJoin('t.category', 'c')
      .select(['c.id AS category_id', 'c.name AS category_name', 'c.color AS category_color'])
      .addSelect(`
        SUM(CAST(t.amount AS NUMERIC))
      `, 'total')
      .where('t.ownerId = :ownerId', { ownerId })
      .andWhere("t.type = :kind", { kind });

    if (from) qb.andWhere('t.date >= :from', { from });
    if (to)   qb.andWhere('t.date <= :to',   { to   });

    qb.andWhere('c.id IS NOT NULL')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.color')
      .orderBy('total', 'DESC');

    const rows = await qb.getRawMany<{ category_id: string; category_name: string; category_color: string; total: string }>();
    
    // Eğer işlem varsa, sadece onları döndür
    if (rows.length > 0) {
      return rows.map(r => ({
        categoryId: r.category_id,
        name: r.category_name,
        color: r.category_color,
        total: r.total,
      }));
    }
    
    // İşlem yoksa, sistem kategorilerini göster (0 toplamla)
    const systemCategories = await this.catRepo.find({
      where: { isSystem: true, kind },
      order: { priority: 'DESC' }
    });
    
    return systemCategories.map(cat => ({
      categoryId: cat.id,
      name: cat.name,
      color: cat.color,
      total: '0', // İşlem yok, toplam 0
    }));
  }

  /**
   * Aylık seri (son N ay): income/expense toplamları, YYYY-MM bazında.
   */
  async getMonthlySeries(ownerId: string, months = 6) {
    // Son N ay için gruplama: PostgreSQL DATE_TRUNC('month', t.date)
    const qb = this.txRepo.createQueryBuilder('t')
      .select(`to_char(date_trunc('month', t.date), 'YYYY-MM')`, 'month')
      .addSelect(`
        SUM(CASE WHEN t.type = 'INCOME'  THEN CAST(t.amount AS NUMERIC) ELSE 0 END)
      `, 'income')
      .addSelect(`
        SUM(CASE WHEN t.type = 'EXPENSE' THEN CAST(t.amount AS NUMERIC) ELSE 0 END)
      `, 'expense')
      .where('t.ownerId = :ownerId', { ownerId })
      .andWhere(`t.date >= (CURRENT_DATE - INTERVAL '${months} months')`)
      .groupBy(`date_trunc('month', t.date)`)
      .orderBy(`date_trunc('month', t.date)`, 'ASC');

    const rows = await qb.getRawMany<{ month: string; income: string; expense: string }>();
    return rows.map(r => ({ month: r.month, income: r.income, expense: r.expense }));
  }
}