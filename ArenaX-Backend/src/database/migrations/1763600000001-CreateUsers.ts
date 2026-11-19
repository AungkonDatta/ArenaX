import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1763600000001 implements MigrationInterface {
  name = 'CreateUsers1763600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "user_role" AS ENUM ('PLAYER', 'ORGANIZER', 'ADMIN')`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "email" character varying(150) NOT NULL,
        "password_hash" character varying NOT NULL,
        "role" "user_role" NOT NULL DEFAULT 'PLAYER',
        "student_id" character varying(20),
        "in_game_name" character varying(50),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_role"`);
  }
}