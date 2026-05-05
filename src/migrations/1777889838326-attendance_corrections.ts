import { MigrationInterface, QueryRunner } from 'typeorm';

export class AttendanceCorrections1777889838326 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "correction_status_enum" AS ENUM (
        'pending',
        'approved',
        'rejected'
      )
    `);

    // ✅ TABLE
    await queryRunner.query(`
      CREATE TABLE "attendance_corrections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),

        "userId" uuid NOT NULL,
        "attendanceId" uuid NOT NULL,

        "requestedCheckIn" TIMESTAMP,
        "requestedCheckOut" TIMESTAMP,

        "reason" varchar NOT NULL,

        "status" "correction_status_enum" NOT NULL DEFAULT 'pending',

        "reviewedBy" uuid,

        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT "PK_attendance_corrections_id"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_correction_user"
          FOREIGN KEY ("userId")
          REFERENCES "users"("id")
          ON DELETE CASCADE,

        CONSTRAINT "FK_correction_attendance"
          FOREIGN KEY ("attendanceId")
          REFERENCES "attendance"("id")
          ON DELETE CASCADE,

        CONSTRAINT "FK_correction_reviewer"
          FOREIGN KEY ("reviewedBy")
          REFERENCES "users"("id")
          ON DELETE SET NULL
      )
    `);

    // ✅ INDEXES (recommended)
    await queryRunner.query(`
      CREATE INDEX "IDX_correction_user"
      ON "attendance_corrections" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_correction_attendance"
      ON "attendance_corrections" ("attendanceId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_correction_attendance"`);
    await queryRunner.query(`DROP INDEX "IDX_correction_user"`);
    await queryRunner.query(`DROP TABLE "attendance_corrections"`);
    await queryRunner.query(`DROP TYPE "correction_status_enum"`);
  }
}
