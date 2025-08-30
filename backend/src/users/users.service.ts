import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly rounds = 10;

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

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.repo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Kullanıcı bulunamadı');
    }

    // Eski şifreyi kontrol et
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Mevcut şifre yanlış');
    }

    // Yeni şifreyi hash'le
    const newPasswordHash = await bcrypt.hash(newPassword, this.rounds);
    
    // Şifreyi güncelle
    user.passwordHash = newPasswordHash;
    await this.repo.save(user);

    return { success: true };
  }
}