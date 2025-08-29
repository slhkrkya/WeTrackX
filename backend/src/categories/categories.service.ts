import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private repo: Repository<Category>) {}

  async list(owner: User, kind?: 'INCOME' | 'EXPENSE') {
    // Sistem kategorileri ve kullanıcının kendi kategorilerini birleştir
    const [systemCats, userCats] = await Promise.all([
      this.repo.find({
        where: { isSystem: true, ...(kind ? { kind } : {}) },
        order: { priority: 'DESC', name: 'ASC' },
      }),
      this.repo.find({
        where: { owner, isSystem: false, ...(kind ? { kind } : {}) },
        order: { priority: 'DESC', name: 'ASC' },
      }),
    ]);

    // Sistem kategorilerini önce, sonra kullanıcı kategorilerini ekle
    return [...systemCats, ...userCats];
  }

  create(owner: User, dto: { name: string; kind: 'INCOME' | 'EXPENSE'; color?: string; priority?: number; parentId?: string }) {
    const cat = this.repo.create({
      name: dto.name,
      kind: dto.kind,
      color: dto.color,
      priority: dto.priority ?? 0,
      isSystem: false, // Kullanıcı kategorisi
      owner,
      ...(dto.parentId ? ({ parent: { id: dto.parentId } as any }) : {}),
    });
    return this.repo.save(cat);
  }

  async update(owner: User, id: string, dto: Partial<{ name: string; kind: 'INCOME' | 'EXPENSE'; color?: string; priority?: number }>) {
    const cat = await this.repo.findOne({ where: { id, owner, isSystem: false } });
    if (!cat) return null;
    if (dto.name !== undefined) cat.name = dto.name;
    if (dto.kind !== undefined) cat.kind = dto.kind;
    if (dto.color !== undefined) cat.color = dto.color;
    if (dto.priority !== undefined) cat.priority = dto.priority;
    return this.repo.save(cat);
  }

  async remove(owner: User, id: string) {
    const cat = await this.repo.findOne({ where: { id, owner, isSystem: false } });
    if (!cat) return null;
    try {
      await this.repo.remove(cat);
      return true;
    } catch (e: any) {
      // Foreign key constraint (ilişkili transaction varsa)
      throw e;
    }
  }
}