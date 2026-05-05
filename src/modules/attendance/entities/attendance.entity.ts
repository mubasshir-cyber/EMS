
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { AttendanceStatus } from '../../../common/enums/AttendanceStatus.enum';


@Entity('attendance')

@Index(['userId', 'date'], { unique: true }) 
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  // ✅ RELATION (this fixes your error)
  @ManyToOne(() => User, (user) => user.attendances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'timestamp', nullable: true })
  checkIn!: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOut!: Date;

  @Column({ nullable: true })
  earlyCheckoutReason!: string;

  @Column({ default: 0 })
  overtimeMinutes!: number;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status!: AttendanceStatus;

  @Column({ nullable: true })
  checkInLocation?: string;

  @Column({ nullable: true })
  checkOutLocation?: string;

  @Column({ default: false })
  isAutoCheckout!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

} 

