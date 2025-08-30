import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { Category } from '../categories/category.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
    @InjectRepository(Category) private readonly catRepo: Repository<Category>,
  ) {}

  /**
   * Hesap bazlı bakiyeler.
   * Kurallar:
   *  - INCOME  => +amount (account)
   *  - EXPENSE => -amount (account)
   *  - TRANSFER: fromAccount => -amount, toAccount => +amount
   */
  async getAccountBalances(ownerId: string) {
    // Aynı ifadeyi hem SELECT hem GROUP BY'da kullanacağız (alias yerine ifade)
    const exprId = "COALESCE(acc.id, fromAcc.id, toAcc.id)";
    const exprName = "COALESCE(acc.name, fromAcc.name, toAcc.name)";
    const exprCurrency = "COALESCE(acc.currency, fromAcc.currency, toAcc.currency)";

    const qb = this.txRepo.createQueryBuilder('t')
      .leftJoin('t.account', 'acc')
      .leftJoin('t.fromAccount', 'fromAcc')
      .leftJoin('t.toAccount', 'toAcc')
      .select([
        `${exprId} AS account_id`,
        `${exprName} AS account_name`,
        `${exprCurrency} AS currency`,
      ])
      .addSelect(
        `
        SUM(
          CASE
            WHEN t.type = 'INCOME'   AND acc.id      IS NOT NULL THEN CAST(t.amount AS NUMERIC)    -- + (pozitif)
            WHEN t.type = 'EXPENSE'  AND acc.id      IS NOT NULL THEN CAST(t.amount AS NUMERIC)    -- + (zaten negatif)
            WHEN t.type = 'TRANSFER' AND fromAcc.id  IS NOT NULL THEN -CAST(t.amount AS NUMERIC)   -- - (pozitif varsayımı)
            WHEN t.type = 'TRANSFER' AND toAcc.id    IS NOT NULL THEN  CAST(t.amount AS NUMERIC)   -- + (pozitif varsayımı)
            ELSE 0
          END
        )
        `,
        'balance',
      )

      .where('t.ownerId = :ownerId', { ownerId })
      // !!! Alias yerine ifadenin kendisiyle group by
      .groupBy(exprId)
      .addGroupBy(exprName)
      .addGroupBy(exprCurrency)
      .orderBy('account_name', 'ASC');

    const rows = await qb.getRawMany<{
      account_id: string | null;
      account_name: string | null;
      currency: string | null;
      balance: string;
    }>();

    // Sadece gerçekten hesapla ilişkili satırları döndür (null hesapları ele)
    return rows
      .filter(r => r.account_id) // null olanları at
      .map(r => ({
        accountId: r.account_id as string,
        name: r.account_name || '—',
        currency: r.currency || 'TRY',
        balance: r.balance,
      }));
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