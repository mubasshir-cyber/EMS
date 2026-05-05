import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  Permission!: Permission;
}
