import { MigrationInterface, QueryRunner } from 'typeorm';

export class Projects1777708370077 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    // 1. Create ENUM for project status
    await queryRunner.query(`
      CREATE TYPE "projects_status_enum" AS ENUM (
        'active',
        'completed',
        'on_hold',
        'pending'
      );
    `);

    // 2. Create projects table
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

        "project_name" VARCHAR NOT NULL UNIQUE,
        "project_description" TEXT,

        "status" "projects_status_enum" DEFAULT 'pending',

        "projectStartDate" TIMESTAMP,
        "deadline" TIMESTAMP,

        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now()
      );
    `);

    // 3. Create project_members join table
    await queryRunner.query(`
      CREATE TABLE "project_members" (
        "project_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        PRIMARY KEY ("project_id", "user_id"),
        CONSTRAINT "FK_project_members_project"
          FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_project_members_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop join table first (FK dependency)
    await queryRunner.query(`DROP TABLE "project_members"`);

    // Drop projects table
    await queryRunner.query(`DROP TABLE "projects"`);

    // Drop ENUM type
    await queryRunner.query(`DROP TYPE "projects_status_enum"`);
  }
}
