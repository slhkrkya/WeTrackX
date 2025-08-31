import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Account } from './account.entity';
import { Transaction } from '../transactions/transaction.entity';
import { Category } from '../categories/category.entity';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { TransactionsService } from '../transactions/transactions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Transaction, Category]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AccountsController],
  providers: [AccountsService, TransactionsService],
  exports: [AccountsService],
})
export class AccountsModule {}