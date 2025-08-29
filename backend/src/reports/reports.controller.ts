import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('balances')
  balances(@CurrentUser() u: { userId: string }) {
    return this.reports.getAccountBalances(u.userId);
  }

  @Get('cashflow')
  cashflow(
    @CurrentUser() u: { userId: string },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.getCashflow(u.userId, from, to);
  }

  @Get('category-totals')
  categoryTotals(
    @CurrentUser() u: { userId: string },
    @Query('kind') kind: 'INCOME' | 'EXPENSE' = 'EXPENSE',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.getCategoryTotals(u.userId, kind, from, to);
  }

  @Get('monthly-series')
  monthlySeries(
    @CurrentUser() u: { userId: string },
    @Query('months') months = '6',
  ) {
    const m = Math.max(1, Math.min(24, Number(months) || 6));
    return this.reports.getMonthlySeries(u.userId, m);
  }

  // İster uyumu: /reports/summary?from&to -> { income, expense, balance }
  @Get('summary')
  summary(
    @CurrentUser() u: { userId: string },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.getCashflow(u.userId, from, to);
  }

  // İster uyumu: /reports/by-category?period=month&date=YYYY-MM
  // Basit adapter: period=month ve date=YYYY-MM verildiğinde ilgili ayın başlangıç/bitiş aralığına göre category totals.
  @Get('by-category')
  async byCategory(
    @CurrentUser() u: { userId: string },
    @Query('period') period: 'month' = 'month',
    @Query('date') date?: string, // YYYY-MM
  ) {
    const kind: 'INCOME' | 'EXPENSE' = 'EXPENSE';
    let from: string | undefined;
    let to: string | undefined;
    if (period === 'month' && date) {
      const [y, m] = date.split('-').map(Number);
      if (y && m) {
        const start = new Date(Date.UTC(y, m - 1, 1));
        const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
        from = start.toISOString();
        to = end.toISOString();
      }
    }
    const totals = await this.reports.getCategoryTotals(u.userId, kind, from, to);
    // İster: [ { categoryId, name, type, total } ] — mevcut servis type döndürmüyor, burada EXPENSE olarak sabitliyoruz.
    return totals.map((t: any) => ({ ...t, type: kind }));
  }
}