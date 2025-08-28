import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Account } from '../accounts/account.entity';
import { Category } from '../categories/category.entity';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

@Entity()
@Index(['owner', 'date'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  note?: string; 
  
  @Column({ type: 'varchar', length: 8 })
  type: TransactionType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string; // TypeORM numeric -> JS string

  @Column({ type: 'varchar', length: 3, default: 'TRY' })
  currency: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Income/Expense için tek hesap
  @ManyToOne(() => Account, (a) => a.transactions, { nullable: true })
  account?: Account;

  // Transfer için çift hesap
  @ManyToOne(() => Account, (a) => a.outgoingTransfers, { nullable: true })
  fromAccount?: Account;

  @ManyToOne(() => Account, (a) => a.incomingTransfers, { nullable: true })
  toAccount?: Account;

  // Income/Expense için kategori
  @ManyToOne(() => Category, { nullable: true })
  category?: Category;

  @ManyToOne(() => User, { nullable: false })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}