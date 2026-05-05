import { MigrationInterface, QueryRunner } from 'typeorm';

export class Attendance1777889087724 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "attendance_status_enum" AS ENUM (
        'present',
        'absent',
        'late',
        'halfDay',
         'wfh',
         'leave'
      )
    `);

    // ✅ Create table
    await queryRunner.query(`
      CREATE TABLE "attendance" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "date" DATE NOT NULL,
        "checkIn" TIMESTAMP,
        "checkOut" TIMESTAMP,
        "earlyCheckoutReason" varchar,
        "overtimeMinutes" integer NOT NULL DEFAULT 0,
        "status" "attendance_status_enum" NOT NULL DEFAULT 'present',
        "checkInLocation" varchar,
        "checkOutLocation" varchar,
        "isAutoCheckout" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT "PK_attendance_id" PRIMARY KEY ("id"),

        CONSTRAINT "FK_attendance_user"
          FOREIGN KEY ("userId")
          REFERENCES "users"("id")
          ON DELETE CASCADE
      )
    `);

    // ✅ Unique index (userId + date)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_attendance_user_date"
      ON "attendance" ("userId", "date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_attendance_user_date"`);
    await queryRunner.query(`DROP TABLE "attendance"`);
    await queryRunner.query(`DROP TYPE "attendance_status_enum"`);
  }
}
