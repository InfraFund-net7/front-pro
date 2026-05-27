-- AlterEnum
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'auditor';

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_account_roles" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_account_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_project_account_roles_project_user_role" ON "project_account_roles"("project_id", "user_id", "role");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_account_roles_user_role" ON "project_account_roles"("user_id", "role");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_account_roles_project_id" ON "project_account_roles"("project_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_account_roles_created_at" ON "project_account_roles"("created_at");

-- AddForeignKey when base tables exist.
DO $$
BEGIN
  IF to_regclass('public.projects') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'project_account_roles_project_id_fkey'
     ) THEN
    ALTER TABLE "project_account_roles" ADD CONSTRAINT "project_account_roles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'project_account_roles_user_id_fkey'
     ) THEN
    ALTER TABLE "project_account_roles" ADD CONSTRAINT "project_account_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
