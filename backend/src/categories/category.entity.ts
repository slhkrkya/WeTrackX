import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export type CategoryKind = 'INCOME' | 'EXPENSE';

@Entity()
@Index(['owner', 'name', 'kind'], { unique: true, where: 'isSystemOverride = false' })
@Index(['isSystem', 'name', 'kind'], { unique: true, where: 'isSystemOverride = false' })
@Index(['owner', 'originalSystemId'], { unique: true, where: 'isSystemOverride = true' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 8 })
  kind: CategoryKind; // INCOME | EXPENSE

  @Column({ nullable: true })
  color?: string; // UI amaçlı

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean; // Sistem kategorisi mi?

  @Column({ type: 'boolean', default: false })
  isSystemOverride: boolean; // Sistem kategorisinin kullanıcı kopyası mı?

  @Column({ nullable: true })
  originalSystemId?: string; // Orijinal sistem kategorisinin ID'si

  @ManyToOne(() => Category, (c) => c.children, { nullable: true })
  parent?: Category;

  @OneToMany(() => Category, (c) => c.parent)
  children: Category[];

  @ManyToOne(() => User, { nullable: true })
  owner?: User; // Sistem kategorileri için null

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}