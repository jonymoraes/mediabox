import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';

import { Quota } from '../../identity/entities/quota.entity-orm';
import { Account } from '../../identity/entities/account.entity-orm';

import {
  MediaStatus,
  MediaStatusType,
} from '@/src/domain/media/value-objects/media-status.vo';
import { MediaStatusTransformer } from '../../media/transformers/media-status.transformer';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  mimetype: string;

  @Column({ type: 'bigint' })
  filesize: string;

  @Column({
    type: 'enum',
    enum: MediaStatusType,
    default: MediaStatusType.TEMPORARY,
    transformer: new MediaStatusTransformer(),
  })
  status: MediaStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => Quota, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'quotaId' })
  quota?: Relation<Quota>;

  @Column({ type: 'uuid', nullable: true })
  quotaId?: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account?: Relation<Account>;

  @Column({ type: 'uuid' })
  accountId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
