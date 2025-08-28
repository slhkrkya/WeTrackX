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
}