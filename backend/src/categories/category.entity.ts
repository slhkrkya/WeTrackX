import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export type CategoryKind = 'INCOME' | 'EXPENSE';

@Entity()
@Index(['owner', 'name', 'kind'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 8 })
  kind: CategoryKind; // INCOME | EXPENSE

  @Column({ nullable: true })
  color?: string; // UI amaçlı

  @ManyToOne(() => Category, (c) => c.children, { nullable: true })
  parent?: Category;

  @OneToMany(() => Category, (c) => c.parent)
  children: Category[];

  @ManyToOne(() => User, { nullable: false })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}