import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { Controller, Get, Put, Body, UseGuards, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() u: { userId: string; email: string }) {
    return this.users.findById(u.userId).then(user => user ? { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt } : null);
  }

  @Put('me')
  updateMe(
    @CurrentUser() u: { userId: string; email: string },
    @Body() dto: { name?: string },
  ) {
    return this.users.updateProfile(u.userId, { name: dto.name });
  }

  @Post('me/change-password')
  changePassword(
    @CurrentUser() u: { userId: string; email: string },
    @Body() dto: { oldPassword: string; newPassword: string },
  ) {
    return this.users.changePassword(u.userId, dto.oldPassword, dto.newPassword);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
