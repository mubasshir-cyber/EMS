import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatedAtTimestamp1779008914219 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "createdAt"
      SET DEFAULT CURRENT_TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "updatedAt"
      SET DEFAULT CURRENT_TIMESTAMP
    `);

    // Fix existing null values if any
    await queryRunner.query(`
      UPDATE "users"
      SET "createdAt" = CURRENT_TIMESTAMP
      WHERE "createdAt" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "updatedAt" = CURRENT_TIMESTAMP
      WHERE "updatedAt" IS NULL
    `);

    // Make sure columns stay NOT NULL
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "createdAt"
      SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "updatedAt"
      SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "createdAt"
      DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "updatedAt"
      DROP DEFAULT
    `);
  }
}
