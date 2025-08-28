import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly rounds = 10;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string, name?: string) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new BadRequestException('Email zaten kayıtlı');

    const passwordHash = await bcrypt.hash(password, this.rounds);
    const user = await this.users.create(email, passwordHash, name ?? '');
    const token = await this.signToken(user.id, user.email);
    return { user: this.safeUser(user), token };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Email veya şifre hatalı');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Email veya şifre hatalı');

    const token = await this.signToken(user.id, user.email);
    return { user: this.safeUser(user), token };
  }

  async signToken(userId: string, email: string) {
    return this.jwt.signAsync({ sub: userId, email });
  }

  safeUser(user: any) {
    // passwordHash'i dışarı vermeyelim
    const { passwordHash, ...rest } = user;
    return rest;
  }
}