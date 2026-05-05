import { Task } from '../../task/entities/task.entity';
import { User } from '../../user/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  Pending = 'pending',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  project_name!: string;

  @Column({ nullable: true })
  project_description!: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.Pending,
  })
  status!: ProjectStatus;

  @Column({ type: 'timestamp', nullable: true })
  projectStartDate!: Date | null;

  @Column({ nullable: true })
  deadline!: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'project_members',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  team!: User[];

  @OneToMany(() => Task, (task) => task.project)
  tasks!: Task[];
}
