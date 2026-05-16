import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHashedRefreshToken1778965372773 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "hashedRefreshToken" VARCHAR
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "hashedRefreshToken"
    `);
  }
}
