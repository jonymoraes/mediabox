import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1773484515040 implements MigrationInterface {
    name = 'Initial1773484515040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."videos_status_enum" RENAME TO "videos_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."videos_status_enum" AS ENUM('temporary', 'active')`);
        await queryRunner.query(`ALTER TABLE "videos" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "videos" ALTER COLUMN "status" TYPE "public"."videos_status_enum" USING "status"::"text"::"public"."videos_status_enum"`);
        await queryRunner.query(`ALTER TABLE "videos" ALTER COLUMN "status" SET DEFAULT 'temporary'`);
        await queryRunner.query(`DROP TYPE "public"."videos_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."images_status_enum" RENAME TO "images_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."images_status_enum" AS ENUM('temporary', 'active')`);
        await queryRunner.query(`ALTER TABLE "images" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "images" ALTER COLUMN "status" TYPE "public"."images_status_enum" USING "status"::"text"::"public"."images_status_enum"`);
        await queryRunner.query(`ALTER TABLE "images" ALTER COLUMN "status" SET DEFAULT 'temporary'`);
        await queryRunner.query(`DROP TYPE "public"."images_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."images_status_enum_old" AS ENUM('temporary', 'active', 'deleted')`);
        await queryRunner.query(`ALTER TABLE "images" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "images" ALTER COLUMN "status" TYPE "public"."images_status_enum_old" USING "status"::"text"::"public"."images_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "images" ALTER COLUMN "status" SET DEFAULT 'temporary'`);
        await queryRunner.query(`DROP TYPE "public"."images_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."images_status_enum_old" RENAME TO "images_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."videos_status_enum_old" AS ENUM('temporary', 'active', 'deleted')`);
        await queryRunner.query(`ALTER TABLE "videos" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "videos" ALTER COLUMN "status" TYPE "public"."videos_status_enum_old" USING "status"::"text"::"public"."videos_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "videos" ALTER COLUMN "status" SET DEFAULT 'temporary'`);
        await queryRunner.query(`DROP TYPE "public"."videos_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."videos_status_enum_old" RENAME TO "videos_status_enum"`);
    }

}
