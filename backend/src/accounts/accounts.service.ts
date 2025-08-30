// src/accounts/accounts.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Account, AccountType } from './account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

type CreateAccountDto = {
  name: string;
  type?: AccountType;
  currency?: string;
};

@Injectable()
export class AccountsService {
  constructor(@InjectRepository(Account) private repo: Repository<Account>) {}

  list(owner: User) {
    return this.repo.find({ where: { owner }, order: { createdAt: 'DESC' } });
  }

  async create(owner: User, dto: CreateAccountDto) {
    const currency = dto.currency ?? 'TRY';
    const acc = this.repo.create({
      name: dto.name,
      type: dto.type ?? 'BANK',
      currency: currency,
      // DeepPartial<User> beklentisine tam uysun diye owner'ı id ile veriyoruz
      owner: { id: owner.id } as any,
    });
    return this.repo.save(acc);
  }

  async get(owner: User, id: string) {
    const acc = await this.repo.findOne({ where: { id, owner } });
    if (!acc) throw new Error('Account not found');
    return acc;
  }

  async update(owner: User, id: string, dto: Partial<CreateAccountDto>) {
    const acc = await this.repo.findOne({ where: { id, owner } });
    if (!acc) throw new Error('Account not found');
    
    if (dto.name !== undefined) acc.name = dto.name;
    if (dto.type !== undefined) acc.type = dto.type;
    if (dto.currency !== undefined) acc.currency = dto.currency;
    
    return this.repo.save(acc);
  }

  async remove(owner: User, id: string) {
    const acc = await this.repo.findOne({ where: { id, owner } });
    if (!acc) return null;
    try {
      await this.repo.remove(acc);
      return true;
    } catch (e: any) {
      // Foreign key constraint (ilişkili transaction varsa)
      throw e;
    }
  }
}