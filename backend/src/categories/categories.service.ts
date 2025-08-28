import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private repo: Repository<Category>) {}

  list(owner: User, kind?: 'INCOME' | 'EXPENSE') {
    return this.repo.find({
      where: { owner, ...(kind ? { kind } : {}) },
      order: { name: 'ASC' },
    });
  }

  create(owner: User, dto: { name: string; kind: 'INCOME' | 'EXPENSE'; color?: string; parentId?: string }) {
    const cat = this.repo.create({
      name: dto.name,
      kind: dto.kind,
      color: dto.color,
      owner,
      ...(dto.parentId ? ({ parent: { id: dto.parentId } as any }) : {}),
    });
    return this.repo.save(cat);
  }
}