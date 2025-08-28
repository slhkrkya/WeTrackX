import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly tx: TransactionsService) {}

  @Get()
  list(
    @CurrentUser() u: { userId: string; email: string },
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.tx.list({ id: u.userId } as any, Number(limit ?? 20), from, to);
  }

  @Post()
  create(
    @CurrentUser() u: { userId: string; email: string },
    @Body()
    dto:
      | {
          type: 'INCOME' | 'EXPENSE';
          amount: number;
          currency?: string;
          date: string;
          description?: string;
          accountId: string;
          categoryId: string;
        }
      | {
          type: 'TRANSFER';
          amount: number;
          currency?: string;
          date: string;
          description?: string;
          fromAccountId: string;
          toAccountId: string;
        },
  ) {
    return this.tx.create({ id: u.userId } as any, dto as any);
  }
}