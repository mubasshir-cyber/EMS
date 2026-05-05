import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRolesPermissions1777619090575 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert roles
    await queryRunner.query(`
      INSERT INTO roles (name) VALUES
      ('admin'),
      ('manager'),
      ('employee');
    `);

    // Insert permissions
    await queryRunner.query(`
      INSERT INTO permissions (name) VALUES
      ('create_user'),
      ('delete_user'),
      ('update_user'),
      ('view_user'),
      ('manage_roles');
    `);

    // Assign permissions to admin (all)
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.name = 'admin';
    `);

    // Manager permissions
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.name = 'manager'
      AND p.name IN ('create_user', 'update_user', 'view_user');
    `);

    // Employee permissions
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.name = 'employee'
      AND p.name = 'view_user';
    `);
  }

  public async down(): Promise<void> {
    // optional rollback
  }
}
