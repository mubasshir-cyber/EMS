import { CorrectionStatus } from '../../../common/enums/CorrectionStatus.enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';

@Entity('attendance_corrections')
export class Correction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // 🔗 User who requested
  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  // 🔗 Attendance record
  @Column()
  attendanceId!: string;

  @ManyToOne(() => Attendance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attendanceId' })
  attendance!: Attendance;

  // ✅ Requested changes
  @Column({ type: 'timestamp', nullable: true })
  requestedCheckIn?: Date;

  @Column({ type: 'timestamp', nullable: true })
  requestedCheckOut?: Date;

  @Column()
  reason!: string;

  @Column({
    type: 'enum',
    enum: CorrectionStatus,
    default: CorrectionStatus.PENDING,
  })
  status!: CorrectionStatus;

  // 🔗 Reviewer (admin/manager)
  @Column({ nullable: true })
  reviewedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer?: User;

  @CreateDateColumn()
  createdAt!: Date;
}