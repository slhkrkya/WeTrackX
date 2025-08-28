import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccountType } from './account.entity'; // <-- tipi kullan

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(@CurrentUser() u: { userId: string; email: string }) {
    return this.accounts.list({ id: u.userId } as any);
  }

  @Post()
  create(
    @CurrentUser() u: { userId: string; email: string },
    @Body() dto: { name: string; type?: AccountType; currency?: string }, // <-- burada da düzelt
  ) {
    return this.accounts.create({ id: u.userId } as any, dto);
  }
}