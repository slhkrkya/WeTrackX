import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(
    @CurrentUser() u: { userId: string; email: string },
    @Query('kind') kind?: 'INCOME' | 'EXPENSE',
  ) {
    return this.categories.list({ id: u.userId } as any, kind);
  }

  @Post()
  create(
    @CurrentUser() u: { userId: string; email: string },
    @Body() dto: { name: string; kind: 'INCOME' | 'EXPENSE'; color?: string; parentId?: string },
  ) {
    return this.categories.create({ id: u.userId } as any, dto);
  }
}