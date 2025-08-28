import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS (Next dev için)
  app.enableCors({
    origin: true, // Geliştirmede origin true; prod’ta domain whitelist yapacağız
    credentials: true,
  });

  const config = app.get(ConfigService);
  const port = Number(config.get('PORT') ?? 4000);
  await app.listen(port);
}
bootstrap();
