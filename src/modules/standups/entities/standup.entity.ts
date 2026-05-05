import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';

@Entity('standups')
@Index(['userId', 'date'], { unique: true }) // ✅ prevent duplicate per day
export class Standup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.standups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'text', nullable: true })
  yesterdayWork?: string;

  @Column({ type: 'text' })
  todayWork!: string;

  @Column({ type: 'text', nullable: true })
  blockers?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
