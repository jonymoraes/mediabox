import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1775516255852 implements MigrationInterface {
    name = 'Initial1775516255852'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "apikey" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'active', "name" character varying NOT NULL, "domain" character varying, "folder" character varying, "storagePath" character varying, "usedBytes" bigint NOT NULL DEFAULT '0', "role" character varying NOT NULL DEFAULT 'User', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8df4c50faa04d05513ab644388" ON "accounts" ("apikey") `);
        await queryRunner.query(`CREATE TABLE "quotas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "transferredBytes" bigint NOT NULL DEFAULT '0', "totalRequests" integer NOT NULL DEFAULT '0', "last_reset_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_8c90b31b4d63b0d0d66eb42fa0" UNIQUE ("accountId"), CONSTRAINT "PK_5f54877798333ca833245a100d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8c90b31b4d63b0d0d66eb42fa0" ON "quotas" ("accountId") `);
        await queryRunner.query(`CREATE TYPE "public"."videos_status_enum" AS ENUM('temporary', 'active')`);
        await queryRunner.query(`CREATE TABLE "videos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "mimetype" character varying NOT NULL, "filesize" bigint NOT NULL, "status" "public"."videos_status_enum" NOT NULL DEFAULT 'temporary', "expiresAt" TIMESTAMP, "quotaId" uuid, "accountId" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4c86c0cf95aff16e9fb8220f6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."images_status_enum" AS ENUM('temporary', 'active')`);
        await queryRunner.query(`CREATE TABLE "images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "mimetype" character varying NOT NULL, "filesize" bigint NOT NULL, "status" "public"."images_status_enum" NOT NULL DEFAULT 'temporary', "expiresAt" TIMESTAMP, "quotaId" uuid, "accountId" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1fe148074c6a1a91b63cb9ee3c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "quotas" ADD CONSTRAINT "FK_8c90b31b4d63b0d0d66eb42fa0d" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "videos" ADD CONSTRAINT "FK_7e4562792eb18dd8652fbbfa5dd" FOREIGN KEY ("quotaId") REFERENCES "quotas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "videos" ADD CONSTRAINT "FK_416b19a25360ca3b728ad534a5d" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "images" ADD CONSTRAINT "FK_4bc9cb80a384de47cca08b7e373" FOREIGN KEY ("quotaId") REFERENCES "quotas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "images" ADD CONSTRAINT "FK_efcea6f4c432bac76ad19be6365" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "images" DROP CONSTRAINT "FK_efcea6f4c432bac76ad19be6365"`);
        await queryRunner.query(`ALTER TABLE "images" DROP CONSTRAINT "FK_4bc9cb80a384de47cca08b7e373"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP CONSTRAINT "FK_416b19a25360ca3b728ad534a5d"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP CONSTRAINT "FK_7e4562792eb18dd8652fbbfa5dd"`);
        await queryRunner.query(`ALTER TABLE "quotas" DROP CONSTRAINT "FK_8c90b31b4d63b0d0d66eb42fa0d"`);
        await queryRunner.query(`DROP TABLE "images"`);
        await queryRunner.query(`DROP TYPE "public"."images_status_enum"`);
        await queryRunner.query(`DROP TABLE "videos"`);
        await queryRunner.query(`DROP TYPE "public"."videos_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8c90b31b4d63b0d0d66eb42fa0"`);
        await queryRunner.query(`DROP TABLE "quotas"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8df4c50faa04d05513ab644388"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
    }

}
