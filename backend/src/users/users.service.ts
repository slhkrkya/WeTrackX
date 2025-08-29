import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(email: string, passwordHash: string, name = '') {
    const u = this.repo.create({ email, passwordHash, name });
    return this.repo.save(u);
  }

  async updateProfile(userId: string, dto: Partial<{ name: string }>) {
    const u = await this.repo.findOne({ where: { id: userId } });
    if (!u) return null;
    if (dto.name !== undefined) u.name = dto.name;
    return this.repo.save(u);
  }
}