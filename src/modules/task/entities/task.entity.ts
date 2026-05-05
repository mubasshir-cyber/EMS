import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { Project } from '../../project/entities/project.entity';
import { User } from '../../user/entities/user.entity';
import { TaskStatus } from '../../../common/enums/task-status.enum';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // 🔗 Relation to Project
  @ManyToOne(() => Project, (project) => project.tasks, {
    onDelete: 'CASCADE',
  })
  project!: Project;

  // 🔗 Assignee (User)
  @ManyToMany(() => User)
  @JoinTable({
    name: 'task_assignees',

    joinColumn: {
      name: 'taskId', // ✅ matches DB
      referencedColumnName: 'id',
    },

    inverseJoinColumn: {
      name: 'userId', // ✅ matches DB
      referencedColumnName: 'id',
    },
  })
  assignees!: User[];

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.IN_PROGRESS,
  })
  status!: TaskStatus;

  @Column({ type: 'timestamp', nullable: true })
  startTaskDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTaskDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
