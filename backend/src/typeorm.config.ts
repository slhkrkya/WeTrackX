import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Account } from './accounts/account.entity';
import { Category } from './categories/category.entity';
import { Transaction } from './transactions/transaction.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,

  // CLI, TS entity'leri görsün
  entities: [User, Account, Transaction,Category],

  // TS migration’ları
  migrations: ['src/migrations/*.ts'],

  // Logging geliştirmede işimize yarar
  logging: ['error', 'warn'],
});
