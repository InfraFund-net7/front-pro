-- Repair project tables for databases where the init migration was recorded before project DDL existed.

DO $$
BEGIN
  CREATE TYPE "project_draft_step" AS ENUM ('crowdfunding_model', 'asset_symbol', 'contact_information', 'project_information', 'project_milestones', 'campaign_details', 'review', 'submitted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "project_status" AS ENUM ('planning', 'in_development', 'ready_to_launch', 'on_hold', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "project_type" AS ENUM ('renewable_energy');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "project_infrastructure_type" AS ENUM ('wind_energy', 'solar_power', 'hydroelectric', 'geothermal', 'nuclear', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "project_crowdfunding_model" AS ENUM ('pre_sale');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "project_submission_status" AS ENUM ('draft', 'submitted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "projects" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "owner_user_id" UUID NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,
    "type" "project_type" NOT NULL DEFAULT 'renewable_energy',
    "infrastructure_type" "project_infrastructure_type",
    "project_status" "project_status",
    "crowdfunding_model" "project_crowdfunding_model" NOT NULL DEFAULT 'pre_sale',
    "submission_status" "project_submission_status" NOT NULL DEFAULT 'draft',
    "current_step" "project_draft_step" NOT NULL DEFAULT 'crowdfunding_model',
    "digital_asset_symbol" VARCHAR(12),
    "target_investment_amount" DECIMAL(18,2),
    "target_investment_currency" VARCHAR(3) NOT NULL DEFAULT 'GBP',
    "raised_before" BOOLEAN,
    "website_url" VARCHAR(2048),
    "social_url" VARCHAR(2048),
    "submitted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_contacts" (
    "project_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "phone_number" VARCHAR(30),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_contacts_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_crowdfunding_campaigns" (
    "project_id" UUID NOT NULL,
    "token_name" VARCHAR(120),
    "digital_asset_supply" DECIMAL(30,8),
    "price" DECIMAL(18,8),
    "currency" VARCHAR(12) NOT NULL DEFAULT 'USDC',
    "min_raise" DECIMAL(18,2),
    "max_raise" DECIMAL(18,2),
    "min_contribution" DECIMAL(18,2),
    "max_contribution" DECIMAL(18,2),
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "general_contractor_wallet_address" VARCHAR(255),
    "pledge_address" VARCHAR(255),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_crowdfunding_campaigns_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_creation_milestones" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "project_id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "cost" DECIMAL(18,2),
    "end_date" TIMESTAMPTZ(6),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_creation_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_digital_twin_models" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "project_id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "asset_url" VARCHAR(2048) NOT NULL,
    "format" VARCHAR(20) NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_digital_twin_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_digital_twin_components" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "model_id" UUID NOT NULL,
    "external_id" VARCHAR(120) NOT NULL,
    "display_name" VARCHAR(180) NOT NULL,
    "node_name" VARCHAR(180),
    "category" VARCHAR(80) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_digital_twin_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_creation_milestone_components" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "milestone_id" UUID NOT NULL,
    "component_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_creation_milestone_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_documents" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "project_id" UUID NOT NULL,
    "kind" VARCHAR(50) NOT NULL,
    "file_name" VARCHAR(255),
    "mime_type" VARCHAR(100),
    "size_bytes" INTEGER,
    "checksum" VARCHAR(128),
    "storage_url" VARCHAR(2048),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_projects_owner_created" ON "projects"("owner_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_projects_submission_status" ON "projects"("submission_status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_projects_crowdfunding_model" ON "projects"("crowdfunding_model");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_projects_digital_asset_symbol" ON "projects"("digital_asset_symbol");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_contacts_email" ON "project_contacts"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_campaigns_start_date" ON "project_crowdfunding_campaigns"("start_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_campaigns_end_date" ON "project_crowdfunding_campaigns"("end_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_creation_milestones_project_order" ON "project_creation_milestones"("project_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "project_digital_twin_models_project_id_key" ON "project_digital_twin_models"("project_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_digital_twin_models_project_active" ON "project_digital_twin_models"("project_id", "is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_digital_twin_components_model_order" ON "project_digital_twin_components"("model_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_project_digital_twin_components_model_external" ON "project_digital_twin_components"("model_id", "external_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_creation_milestone_components_component_id" ON "project_creation_milestone_components"("component_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_creation_milestone_components_milestone_order" ON "project_creation_milestone_components"("milestone_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_project_creation_milestone_components_milestone_component" ON "project_creation_milestone_components"("milestone_id", "component_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_documents_project_kind" ON "project_documents"("project_id", "kind");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_owner_user_id_fkey') THEN
    ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_contacts_project_id_fkey') THEN
    ALTER TABLE "project_contacts" ADD CONSTRAINT "project_contacts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_crowdfunding_campaigns_project_id_fkey') THEN
    ALTER TABLE "project_crowdfunding_campaigns" ADD CONSTRAINT "project_crowdfunding_campaigns_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_creation_milestones_project_id_fkey') THEN
    ALTER TABLE "project_creation_milestones" ADD CONSTRAINT "project_creation_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_digital_twin_models_project_id_fkey') THEN
    ALTER TABLE "project_digital_twin_models" ADD CONSTRAINT "project_digital_twin_models_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_digital_twin_components_model_id_fkey') THEN
    ALTER TABLE "project_digital_twin_components" ADD CONSTRAINT "project_digital_twin_components_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "project_digital_twin_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_creation_milestone_components_component_id_fkey') THEN
    ALTER TABLE "project_creation_milestone_components" ADD CONSTRAINT "project_creation_milestone_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "project_digital_twin_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_creation_milestone_components_milestone_id_fkey') THEN
    ALTER TABLE "project_creation_milestone_components" ADD CONSTRAINT "project_creation_milestone_components_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "project_creation_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_documents_project_id_fkey') THEN
    ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF to_regclass('public.project_account_roles') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_account_roles_project_id_fkey') THEN
    ALTER TABLE "project_account_roles" ADD CONSTRAINT "project_account_roles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
