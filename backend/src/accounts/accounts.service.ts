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
    const acc = this.repo.create({
      name: dto.name,
      type: dto.type ?? 'BANK',
      currency: dto.currency ?? 'TRY',
      // DeepPartial<User> beklentisine tam uysun diye owner'ı id ile veriyoruz
      owner: { id: owner.id } as any,
    });
    return this.repo.save(acc);
  }
}