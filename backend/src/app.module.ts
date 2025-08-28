import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // .env yükleme
    ConfigModule.forRoot({ isGlobal: true }),

    // TypeORM Postgres bağlantısı
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST'),
        port: cfg.get<number>('DB_PORT'),
        username: cfg.get<string>('DB_USER'),
        password: cfg.get<string>('DB_PASS'),
        database: cfg.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // Sadece geliştirme aşamasında. Prod’da migration’a geçeceğiz.
      }),
    }),

    // İleride repository injection için entity modüllerini burada import edeceğiz (UsersModule vs.)
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [HealthController],
})
export class AppModule {}