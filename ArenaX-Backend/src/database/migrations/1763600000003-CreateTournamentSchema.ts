import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTournamentSchema1763600000003 implements MigrationInterface {
  name = 'CreateTournamentSchema1763600000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "tournament_format" AS ENUM ('SINGLE_ELIMINATION', 'ROUND_ROBIN')`);
    await queryRunner.query(`CREATE TYPE "tournament_status" AS ENUM ('DRAFT', 'OPEN', 'ONGOING', 'COMPLETED')`);
    await queryRunner.query(`CREATE TYPE "registration_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED')`);
    await queryRunner.query(`CREATE TYPE "match_status" AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED')`);

    await queryRunner.query(`
      CREATE TABLE "teams" (
        "id" SERIAL NOT NULL,
        "name" character varying(60) NOT NULL,
        "tag" character varying(10) NOT NULL,
        "captain_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_teams_name" UNIQUE ("name"),
        CONSTRAINT "PK_teams" PRIMARY KEY ("id"),
        CONSTRAINT "FK_teams_captain" FOREIGN KEY ("captain_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "team_members" (
        "team_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "in_game_role" character varying(30),
        "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_team_members" PRIMARY KEY ("team_id", "user_id"),
        CONSTRAINT "FK_team_members_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_team_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tournaments" (
        "id" SERIAL NOT NULL,
        "game_id" integer NOT NULL,
        "organizer_id" integer NOT NULL,
        "title" character varying(120) NOT NULL,
        "description" text,
        "format" "tournament_format" NOT NULL,
        "max_teams" integer NOT NULL,
        "registration_deadline" TIMESTAMP WITH TIME ZONE NOT NULL,
        "start_date" TIMESTAMP WITH TIME ZONE,
        "prize_pool" integer,
        "status" "tournament_status" NOT NULL DEFAULT 'DRAFT',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tournaments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tournaments_game" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_tournaments_organizer" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tournament_registrations" (
        "id" SERIAL NOT NULL,
        "tournament_id" integer NOT NULL,
        "team_id" integer NOT NULL,
        "status" "registration_status" NOT NULL DEFAULT 'PENDING',
        "seed" integer,
        "registered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_registration_tournament_team" UNIQUE ("tournament_id", "team_id"),
        CONSTRAINT "PK_tournament_registrations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_registrations_tournament" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_registrations_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "matches" (
        "id" SERIAL NOT NULL,
        "tournament_id" integer NOT NULL,
        "round" integer NOT NULL,
        "match_no" integer NOT NULL,
        "team_a_id" integer,
        "team_b_id" integer,
        "score_a" integer,
        "score_b" integer,
        "winner_id" integer,
        "status" "match_status" NOT NULL DEFAULT 'PENDING',
        "scheduled_at" TIMESTAMP WITH TIME ZONE,
        "next_match_id" integer,
        "next_slot" character varying(1),
        CONSTRAINT "CHK_matches_scores" CHECK ("score_a" >= 0 AND "score_b" >= 0),
        CONSTRAINT "PK_matches" PRIMARY KEY ("id"),
        CONSTRAINT "FK_matches_tournament" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_matches_team_a" FOREIGN KEY ("team_a_id") REFERENCES "teams"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_matches_team_b" FOREIGN KEY ("team_b_id") REFERENCES "teams"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_matches_winner" FOREIGN KEY ("winner_id") REFERENCES "teams"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_matches_next_match" FOREIGN KEY ("next_match_id") REFERENCES "matches"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "standings" (
        "tournament_id" integer NOT NULL,
        "team_id" integer NOT NULL,
        "played" integer NOT NULL DEFAULT 0,
        "wins" integer NOT NULL DEFAULT 0,
        "draws" integer NOT NULL DEFAULT 0,
        "losses" integer NOT NULL DEFAULT 0,
        "points" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_standings" PRIMARY KEY ("tournament_id", "team_id"),
        CONSTRAINT "FK_standings_tournament" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_standings_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "standings"`);
    await queryRunner.query(`DROP TABLE "matches"`);
    await queryRunner.query(`DROP TABLE "tournament_registrations"`);
    await queryRunner.query(`DROP TABLE "tournaments"`);
    await queryRunner.query(`DROP TABLE "team_members"`);
    await queryRunner.query(`DROP TABLE "teams"`);
    await queryRunner.query(`DROP TYPE "match_status"`);
    await queryRunner.query(`DROP TYPE "registration_status"`);
    await queryRunner.query(`DROP TYPE "tournament_status"`);
    await queryRunner.query(`DROP TYPE "tournament_format"`);
  }
}
