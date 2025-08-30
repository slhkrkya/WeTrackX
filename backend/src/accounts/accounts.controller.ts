import { Controller, Get, Post, Body, UseGuards, Delete, Param, ConflictException, Patch } from '@nestjs/common';
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

  @Get(':id')
  get(@CurrentUser() u: { userId: string; email: string }, @Param('id') id: string) {
    return this.accounts.get({ id: u.userId } as any, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() u: { userId: string; email: string },
    @Param('id') id: string,
    @Body() dto: Partial<{ name: string; type?: AccountType; currency?: string }>,
  ) {
    return this.accounts.update({ id: u.userId } as any, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() u: { userId: string; email: string },
    @Param('id') id: string,
  ) {
    try {
      const ok = await this.accounts.remove({ id: u.userId } as any, id);
      if (!ok) return { statusCode: 404, message: 'Account not found' };
      return { statusCode: 204 } as any;
    } catch (e: any) {
      // FK constraint ile ilişkili transaction varsa 409
      throw new ConflictException('Account has related transactions');
    }
  }
}