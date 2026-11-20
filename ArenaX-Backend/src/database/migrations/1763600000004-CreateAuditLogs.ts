import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1763600000004 implements MigrationInterface {
  name = 'CreateAuditLogs1763600000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" SERIAL NOT NULL,
        "user_id" integer,
        "action" character varying(10) NOT NULL,
        "entity" character varying(50) NOT NULL,
        "entity_id" character varying(100),
        "old_value" jsonb,
        "new_value" jsonb,
        "ip_address" character varying(64),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entity" ON "audit_logs" ("entity", "entity_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_entity"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
