import { MigrationInterface, QueryRunner } from 'typeorm';

export class User1777635476427 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        first_name VARCHAR NOT NULL,
        last_name VARCHAR NOT NULL,
        mobile VARCHAR,
        email VARCHAR UNIQUE NOT NULL,
        password VARCHAR NOT NULL,

        role_id UUID,

        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),

        CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE SET NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE users`);
  }
}
