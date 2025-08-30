import { Controller, Get, Post, Query, Body, UseGuards, Patch, Param, Delete, ConflictException, HttpCode } from '@nestjs/common';
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
    @Query('kind') kindLegacy?: 'INCOME' | 'EXPENSE',
    @Query('type') type?: 'INCOME' | 'EXPENSE',
  ) {
    const kind = type ?? kindLegacy;
    return this.categories.list({ id: u.userId } as any, kind);
  }

  @Post()
  create(
    @CurrentUser() u: { userId: string; email: string },
    @Body() dto: { name: string; kind?: 'INCOME' | 'EXPENSE'; type?: 'INCOME' | 'EXPENSE'; color?: string; priority?: number; parentId?: string },
  ) {
    const kind = dto.type ?? dto.kind;
    if (!kind) throw new Error('type is required');
    return this.categories.create({ id: u.userId } as any, { ...dto, kind }).catch((e) => {
      // Unique violation (name+kind per owner)
      if (e && (e.code === '23505' || /unique/i.test(String(e.detail ?? e.message)))) {
        throw new ConflictException('Category already exists');
      }
      throw e;
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() u: { userId: string; email: string },
    @Param('id') id: string,
    @Body() dto: Partial<{ name: string; kind?: 'INCOME' | 'EXPENSE'; type?: 'INCOME' | 'EXPENSE'; color?: string; priority?: number }>,
  ) {
    const kind = dto.type ?? dto.kind;
    const updated = await this.categories.update({ id: u.userId } as any, id, { ...dto, kind });
    if (!updated) return { statusCode: 404, message: 'Category not found or cannot be modified' };
    return updated;
  }

  @Get(':id')
  get(
    @CurrentUser() u: { userId: string; email: string },
    @Param('id') id: string,
  ) {
    return this.categories.get({ id: u.userId } as any, id);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() u: { userId: string; email: string },
    @Param('id') id: string,
  ) {
    try {
      const ok = await this.categories.remove({ id: u.userId } as any, id);
      if (!ok) return { statusCode: 404, message: 'Category not found or cannot be deleted' };
      return { statusCode: 204 } as any;
    } catch (e: any) {
      // FK constraint ile ilişkili transaction varsa 409
      throw new ConflictException('Category has related transactions');
    }
  }
}