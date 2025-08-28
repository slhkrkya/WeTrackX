import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn, Index, OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Transaction } from '../transactions/transaction.entity';

export type AccountType = 'CASH' | 'BANK' | 'CARD' | 'WALLET';

@Entity()
@Index(['owner', 'name'], { unique: true }) // aynı kullanıcıda aynı isim tek olsun 
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 16, default: 'BANK' })
  type: AccountType;

  @Column({ type: 'varchar', length: 3, default: 'TRY' })
  currency: string; // ISO 4217: TRY, USD, EUR

  @ManyToOne(() => User, { eager: false, nullable: false })
  owner: User;

  @OneToMany(() => Transaction, (t) => t.account)
  transactions: Transaction[];

  @OneToMany(() => Transaction, (t) => t.fromAccount)
  outgoingTransfers: Transaction[];

  @OneToMany(() => Transaction, (t) => t.toAccount)
  incomingTransfers: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}