import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';

import { Account } from './account.entity-orm';

@Entity('quotas')
export class Quota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Account, (account) => account.quotas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account?: Relation<Account>;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'bigint', default: '0' })
  transferredBytes: string;

  @Column({ type: 'int', default: 0 })
  totalRequests: number;

  @Column({
    type: 'timestamp',
    name: 'last_reset_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastResetAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
