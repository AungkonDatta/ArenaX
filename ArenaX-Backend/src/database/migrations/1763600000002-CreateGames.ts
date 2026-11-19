import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGames1763600000002 implements MigrationInterface {
  name = 'CreateGames1763600000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "games" (
        "id" SERIAL NOT NULL,
        "name" character varying(60) NOT NULL,
        "genre" character varying(40),
        "team_size" integer NOT NULL,
        CONSTRAINT "UQ_games_name" UNIQUE ("name"),
        CONSTRAINT "CHK_games_team_size" CHECK ("team_size" > 0),
        CONSTRAINT "PK_games" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "games"`);
  }
}
