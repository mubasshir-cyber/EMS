import { MigrationInterface, QueryRunner } from "typeorm";

export class Task1777834417302 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "description" text,
        "status" "task_status_enum" NOT NULL DEFAULT 'inProgress',
        "startTaskDate" TIMESTAMP,
        "endTaskDate" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "projectId" uuid,
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tasks_project" FOREIGN KEY ("projectId")
          REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "task_assignees" (
        "taskId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_task_assignees" PRIMARY KEY ("taskId", "userId"),
        CONSTRAINT "FK_task" FOREIGN KEY ("taskId")
          REFERENCES "tasks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "task_assignees"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE "task_status_enum"`);
  }
}
