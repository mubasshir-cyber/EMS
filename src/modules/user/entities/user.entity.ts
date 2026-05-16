import { Role } from '../../role/entities/role.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { Task } from '../../../modules/task/entities/task.entity';
import { Attendance } from '../../../modules/attendance/entities/attendance.entity';
import { Standup } from '../../../modules/standups/entities/standup.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @Column({ nullable: true })
  mobile!: string;

  @Column({ unique: true })
  email!: string;

  @Exclude()
  @Column()
  password!: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  hashedRefreshToken?: string | null;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ nullable: true })
  lastLoginAt!: Date;

  @OneToMany(() => Attendance, (attendance) => attendance.user)
  attendances!: Attendance[];

  @OneToMany(() => Standup, (standup) => standup.user)
  standups!: Standup[];

  @Column()
  createdAt!: Date;

  @Column()
  updatedAt!: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  @ManyToMany(() => Task, (task) => task.assignees)
  tasks!: Task[];
}
