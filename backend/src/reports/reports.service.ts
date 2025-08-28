import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
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
            WHEN t.type = 'INCOME'  AND acc.id      IS NOT NULL THEN CAST(t.amount AS NUMERIC)
            WHEN t.type = 'EXPENSE' AND acc.id      IS NOT NULL THEN -CAST(t.amount AS NUMERIC)
            WHEN t.type = 'TRANSFER' AND fromAcc.id IS NOT NULL THEN -CAST(t.amount AS NUMERIC)
            WHEN t.type = 'TRANSFER' AND toAcc.id   IS NOT NULL THEN  CAST(t.amount AS NUMERIC)
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
      .select(`
        SUM(CASE WHEN t.type = 'INCOME'  THEN CAST(t.amount AS NUMERIC) ELSE 0 END)
      `, 'income')
      .addSelect(`
        SUM(CASE WHEN t.type = 'EXPENSE' THEN CAST(t.amount AS NUMERIC) ELSE 0 END)
      `, 'expense')
      .where('t.ownerId = :ownerId', { ownerId });

    if (from) qb.andWhere('t.date >= :from', { from });
    if (to)   qb.andWhere('t.date <= :to',   { to   });

    const row = await qb.getRawOne<{ income: string; expense: string }>();
    const income = row?.income ?? '0';
    const expense = row?.expense ?? '0';

    // net = income - expense (transfer’ler nakit akışına dahil edilmez)
    return { income, expense, net: (Number(income) - Number(expense)).toFixed(2) };
  }

  /**
   * Kategori toplamları (INCOME/EXPENSE), tarih filtresi ile.
   * Transfer kategorisiz sayıldığı için dahil etmiyoruz.
   */
  async getCategoryTotals(ownerId: string, kind: 'INCOME' | 'EXPENSE', from?: string, to?: string) {
    const qb = this.txRepo.createQueryBuilder('t')
      .leftJoin('t.category', 'c')
      .select(['c.id AS category_id', 'c.name AS category_name'])
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
      .orderBy('total', 'DESC');

    const rows = await qb.getRawMany<{ category_id: string; category_name: string; total: string }>();
    return rows.map(r => ({
      categoryId: r.category_id,
      name: r.category_name,
      total: r.total,
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