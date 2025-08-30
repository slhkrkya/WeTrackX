import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private repo: Repository<Category>) {}

  async list(owner: User, kind?: 'INCOME' | 'EXPENSE') {
    // Sistem kategorileri, kullanıcının sistem kopyaları ve kullanıcının kendi kategorilerini birleştir
    const [systemCats, userSystemOverrides, userCats] = await Promise.all([
      this.repo.find({
        where: { isSystem: true, isSystemOverride: false, ...(kind ? { kind } : {}) },
        order: { priority: 'DESC', name: 'ASC' },
      }),
      this.repo.find({
        where: { owner, isSystemOverride: true, ...(kind ? { kind } : {}) },
        order: { priority: 'DESC', name: 'ASC' },
      }),
      this.repo.find({
        where: { owner, isSystem: false, isSystemOverride: false, ...(kind ? { kind } : {}) },
        order: { priority: 'DESC', name: 'ASC' },
      }),
    ]);

    // Sistem kategorilerini kullanıcı kopyalarıyla birleştir
    const mergedSystemCats = systemCats.map(systemCat => {
      const override = userSystemOverrides.find(override => override.originalSystemId === systemCat.id);
      return override || systemCat;
    });

    // Sistem kategorilerini önce, sonra kullanıcı kategorilerini ekle
    return [...mergedSystemCats, ...userCats];
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
    // Önce kullanıcının kendi kategorisini ara
    let cat = await this.repo.findOne({ where: { id, owner, isSystem: false, isSystemOverride: false } });
    let isSystemCategory = false;
    let isSystemOverride = false;
    
    // Eğer bulunamazsa, kullanıcının sistem kopyasını ara
    if (!cat) {
      cat = await this.repo.findOne({ where: { id, owner, isSystemOverride: true } });
      if (cat) {
        isSystemOverride = true;
      }
    }
    
    // Eğer bulunamazsa, sistem kategorilerinde ara
    if (!cat) {
      cat = await this.repo.findOne({ where: { id, isSystem: true, isSystemOverride: false } });
      if (cat) {
        isSystemCategory = true;
      }
    }
    
    if (!cat) return null;
    
    // Sistem kategorileri için kullanıcı kopyası oluştur
    if (isSystemCategory) {
      // Önce bu kullanıcı için bu sistem kategorisinin kopyası var mı kontrol et
      const existingOverride = await this.repo.findOne({
        where: { 
          owner, 
          originalSystemId: cat.id, 
          isSystemOverride: true 
        }
      });
      
      if (existingOverride) {
        // Mevcut kopya varsa onu güncelle
        if (dto.name !== undefined) existingOverride.name = dto.name;
        if (dto.color !== undefined) existingOverride.color = dto.color;
        if (dto.priority !== undefined) existingOverride.priority = dto.priority;
        
        return this.repo.save(existingOverride);
      } else {
        // Kopya yoksa yeni oluştur
        const systemOverride = this.repo.create({
          name: cat.name,
          kind: cat.kind,
          color: cat.color,
          priority: cat.priority,
          isSystem: true,
          isSystemOverride: true,
          originalSystemId: cat.id,
          owner,
        });
        
        // Kopyayı kaydet
        const savedOverride = await this.repo.save(systemOverride);
        
        // Kopya üzerinde güncelleme yap
        if (dto.name !== undefined) savedOverride.name = dto.name;
        if (dto.color !== undefined) savedOverride.color = dto.color;
        if (dto.priority !== undefined) savedOverride.priority = dto.priority;
        
        return this.repo.save(savedOverride);
      }
    }
    
    // Normal güncelleme
    if (dto.name !== undefined) cat.name = dto.name;
    if (dto.kind !== undefined) cat.kind = dto.kind;
    if (dto.color !== undefined) cat.color = dto.color;
    if (dto.priority !== undefined) cat.priority = dto.priority;
    return this.repo.save(cat);
  }

  async get(owner: User, id: string) {
    // Önce kullanıcının kendi kategorisini ara
    let cat = await this.repo.findOne({ 
      where: { id, owner, isSystem: false, isSystemOverride: false } 
    });
    
    // Eğer bulunamazsa, kullanıcının sistem kopyasını ara
    if (!cat) {
      cat = await this.repo.findOne({ 
        where: { id, owner, isSystemOverride: true } 
      });
    }
    
    // Eğer bulunamazsa, sistem kategorilerinde ara
    if (!cat) {
      cat = await this.repo.findOne({ 
        where: { id, isSystem: true, isSystemOverride: false } 
      });
    }
    
    if (!cat) throw new Error('Category not found');
    return cat;
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