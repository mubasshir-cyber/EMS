import { MigrationInterface, QueryRunner } from 'typeorm';

export class Standups1777898355338 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "standups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "date" DATE NOT NULL,
        "yesterdayWork" text NOT NULL,
        "todayWork" text NOT NULL,
        "blockers" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT "PK_standups_id" PRIMARY KEY ("id"),

        CONSTRAINT "FK_standups_user"
          FOREIGN KEY ("userId")
          REFERENCES "users"("id")
          ON DELETE CASCADE
      )
    `);

    // ✅ Prevent duplicate standup per user per date
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_standups_user_date"
      ON "standups" ("userId", "date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_standups_user_date"`);
    await queryRunner.query(`DROP TABLE "standups"`);
  }
}
