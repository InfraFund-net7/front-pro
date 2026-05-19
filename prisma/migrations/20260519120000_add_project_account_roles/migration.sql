-- AlterEnum
ALTER TYPE "user_role" ADD VALUE 'auditor';

-- CreateTable
CREATE TABLE "project_account_roles" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_account_roles_pkey" PRIMARY KEY ("id")
);

-- Backfill existing project owners
INSERT INTO "project_account_roles" ("project_id", "user_id", "role", "created_at", "updated_at")
SELECT "projects"."id", "projects"."owner_user_id", "users"."role", "projects"."created_at", CURRENT_TIMESTAMP
FROM "projects"
JOIN "users" ON "users"."id" = "projects"."owner_user_id"
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "uniq_project_account_roles_project_user_role" ON "project_account_roles"("project_id", "user_id", "role");

-- CreateIndex
CREATE INDEX "idx_project_account_roles_user_role" ON "project_account_roles"("user_id", "role");

-- CreateIndex
CREATE INDEX "idx_project_account_roles_project_id" ON "project_account_roles"("project_id");

-- CreateIndex
CREATE INDEX "idx_project_account_roles_created_at" ON "project_account_roles"("created_at");

-- AddForeignKey
ALTER TABLE "project_account_roles" ADD CONSTRAINT "project_account_roles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_account_roles" ADD CONSTRAINT "project_account_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
