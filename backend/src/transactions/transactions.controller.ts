import { Controller, Get, Post, Body, Query, UseGuards, Patch, Param, Delete } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly tx: TransactionsService) {}

  @Get()
  list(
    @CurrentUser() u: { userId: string },
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: 'INCOME' | 'EXPENSE' | 'TRANSFER',
    @Query('accountId') accountId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: 'date' | 'amount',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.tx.list(
      { id: u.userId } as any,
      { page: Number(page ?? 1), pageSize: Number(pageSize ?? 20), from, to, type, accountId, categoryId, q, sort, order },
    );
  }

  @Post()
  create(
    @CurrentUser() u: { userId: string; email: string },
    @Body()
    dto:
      | {
          type: 'INCOME' | 'EXPENSE';
          title: string;
          amount: number;
          currency?: string;
          date: string;
          description?: string;
          accountId: string;
          categoryId: string;
        }
      | {
          type: 'TRANSFER';
          title: string;
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

  @Patch(':id')
  update(
    @CurrentUser() u: { userId: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.tx.update({ id: u.userId } as any, id, dto);
  }

  @Get(':id')
  get(
    @CurrentUser() u: { userId: string },
    @Param('id') id: string,
  ) {
    return this.tx.get({ id: u.userId } as any, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() u: { userId: string },
    @Param('id') id: string,
  ) {
    return this.tx.remove({ id: u.userId } as any, id);
  }
}