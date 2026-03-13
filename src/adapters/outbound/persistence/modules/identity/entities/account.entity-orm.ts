import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  Relation,
} from 'typeorm';
import { Quota } from './quota.entity-orm';
import { Role, RoleType } from '@/src/domain/identity/value-objects/role.vo';
import { RoleTransformer } from '../transformers/role.transformer';
import {
  ApiKeyStatus,
  ApiKeyStatusType,
} from '@/src/domain/identity/value-objects/api-key-status.vo';
import { ApiKeyStatusTransformer } from '../transformers/api-key-status.transformer';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  apikey: string;

  @Column({
    type: 'varchar',
    name: 'status',
    default: ApiKeyStatusType.ACTIVE,
    transformer: new ApiKeyStatusTransformer(),
  })
  status: ApiKeyStatus;

  @Column()
  name: string;

  @Column({ nullable: true })
  domain?: string;

  @Column({ nullable: true })
  folder?: string;

  @Column({ nullable: true })
  storagePath?: string;

  @Column({ type: 'bigint', default: '0' })
  usedBytes: string;

  @Column({
    type: 'varchar',
    name: 'role',
    default: RoleType.USER,
    transformer: new RoleTransformer(),
  })
  role: Role;

  @OneToMany(() => Quota, (quota) => quota.account)
  quotas?: Relation<Quota>[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
