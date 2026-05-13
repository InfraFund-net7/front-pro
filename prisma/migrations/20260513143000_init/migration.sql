-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_type" AS ENUM ('individual', 'organization');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'moderator', 'support', 'project_owner', 'investor', 'contractor', 'governance');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'inactive', 'suspended', 'pending_kyc');

-- CreateEnum
CREATE TYPE "contact_status" AS ENUM ('new', 'in_progress', 'answered', 'waiting_customer', 'resolved', 'closed', 'spam');

-- CreateEnum
CREATE TYPE "non_resident_waitlist_type" AS ENUM ('individual', 'company');

-- CreateEnum
CREATE TYPE "project_draft_step" AS ENUM ('crowdfunding_model', 'asset_symbol', 'contact_information', 'project_information', 'project_milestones', 'campaign_details', 'review', 'submitted');

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('planning', 'in_development', 'ready_to_launch', 'on_hold', 'completed');

-- CreateEnum
CREATE TYPE "project_type" AS ENUM ('renewable_energy');

-- CreateEnum
CREATE TYPE "project_infrastructure_type" AS ENUM ('wind_energy', 'solar_power', 'hydroelectric', 'geothermal', 'nuclear', 'other');

-- CreateEnum
CREATE TYPE "project_crowdfunding_model" AS ENUM ('pre_sale');

-- CreateEnum
CREATE TYPE "project_submission_status" AS ENUM ('draft', 'submitted');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "openfort_user_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "phone_number" VARCHAR(20),
    "kyc_verified" BOOLEAN DEFAULT false,
    "kyc_verified_at" TIMESTAMPTZ(6),
    "kyb_verified" BOOLEAN DEFAULT false,
    "kyb_verified_at" TIMESTAMPTZ(6),
    "type" "user_type" NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'investor',
    "status" "user_status" NOT NULL DEFAULT 'pending_kyc',
    "data_deletion_requested_at" TIMESTAMPTZ(6),
    "data_deletion_scheduled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_organizations" (
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255)
);

-- CreateTable
CREATE TABLE "wallets" (
    "user_id" UUID NOT NULL,
    "chain" VARCHAR(100) NOT NULL,
    "public_address" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("user_id","chain","public_address")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID,
    "refresh_token_hash" BYTEA NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "platform" VARCHAR(50),
    "browser" VARCHAR(100),
    "device" VARCHAR(100),
    "is_trusted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activity_timeout_at" TIMESTAMPTZ(6) NOT NULL,
    "absolute_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_reason" VARCHAR(100),
    "revoked_by_user_id" UUID,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_lockouts" (
    "user_id" UUID NOT NULL,
    "failed_attempts" SMALLINT NOT NULL DEFAULT 0,
    "last_failed_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMPTZ(6),
    "locked_until" TIMESTAMPTZ(6),
    "locked_reason" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_lockouts_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "lockout_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "attempt_count" SMALLINT,
    "locked_reason" VARCHAR(50),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lockout_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_forms" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "status" "contact_status" NOT NULL DEFAULT 'new',
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "iso" VARCHAR(2) NOT NULL,
    "iso3" VARCHAR(3),
    "code" SMALLINT,
    "phone_code" INTEGER NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_resident_waitlists" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "company_name" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "country_id" INTEGER,
    "type" "non_resident_waitlist_type" NOT NULL DEFAULT 'individual',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "non_resident_waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
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
CREATE TABLE "project_contacts" (
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
CREATE TABLE "project_crowdfunding_campaigns" (
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
CREATE TABLE "project_creation_milestones" (
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
CREATE TABLE "project_digital_twin_models" (
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
CREATE TABLE "project_digital_twin_components" (
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
CREATE TABLE "project_creation_milestone_components" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "milestone_id" UUID NOT NULL,
    "component_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_creation_milestone_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_documents" (
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
CREATE UNIQUE INDEX "users_openfort_user_id_key" ON "users"("openfort_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "idx_users_type" ON "users"("type");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_status" ON "users"("status");

-- CreateIndex
CREATE INDEX "idx_users_created_at" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "idx_users_updated_at" ON "users"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_organizations_user_id_key" ON "user_organizations"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_organizations_name" ON "user_organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_public_address_key" ON "wallets"("public_address");

-- CreateIndex
CREATE INDEX "idx_wallets_chain" ON "wallets"("chain");

-- CreateIndex
CREATE INDEX "idx_wallets_created_at" ON "wallets"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "idx_sessions_user_created" ON "sessions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_account_lockouts_last_failed_attempt" ON "account_lockouts"("last_failed_attempt_at");

-- CreateIndex
CREATE INDEX "idx_lockout_audit_logs_user_id" ON "lockout_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_lockout_audit_logs_created_at" ON "lockout_audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_email_key" ON "waitlist"("email");

-- CreateIndex
CREATE INDEX "idx_waitlist_created_at" ON "waitlist"("created_at");

-- CreateIndex
CREATE INDEX "idx_contact_forms_status" ON "contact_forms"("status");

-- CreateIndex
CREATE INDEX "idx_contact_forms_created_at" ON "contact_forms"("created_at");

-- CreateIndex
CREATE INDEX "idx_contact_forms_email" ON "contact_forms"("email");

-- CreateIndex
CREATE INDEX "idx_countries_name" ON "countries"("name");

-- CreateIndex
CREATE INDEX "idx_countries_iso" ON "countries"("iso");

-- CreateIndex
CREATE INDEX "idx_countries_iso3" ON "countries"("iso3");

-- CreateIndex
CREATE INDEX "idx_countries_code" ON "countries"("code");

-- CreateIndex
CREATE INDEX "idx_countries_phone_code" ON "countries"("phone_code");

-- CreateIndex
CREATE UNIQUE INDEX "non_resident_waitlists_email_key" ON "non_resident_waitlists"("email");

-- CreateIndex
CREATE INDEX "idx_non_resident_waitlists_type" ON "non_resident_waitlists"("type");

-- CreateIndex
CREATE INDEX "idx_non_resident_waitlists_country_id" ON "non_resident_waitlists"("country_id");

-- CreateIndex
CREATE INDEX "idx_non_resident_waitlists_created_at_id" ON "non_resident_waitlists"("created_at" DESC, "id");

-- CreateIndex
CREATE INDEX "idx_projects_owner_created" ON "projects"("owner_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_projects_submission_status" ON "projects"("submission_status");

-- CreateIndex
CREATE INDEX "idx_projects_crowdfunding_model" ON "projects"("crowdfunding_model");

-- CreateIndex
CREATE INDEX "idx_projects_digital_asset_symbol" ON "projects"("digital_asset_symbol");

-- CreateIndex
CREATE INDEX "idx_project_contacts_email" ON "project_contacts"("email");

-- CreateIndex
CREATE INDEX "idx_project_campaigns_start_date" ON "project_crowdfunding_campaigns"("start_date");

-- CreateIndex
CREATE INDEX "idx_project_campaigns_end_date" ON "project_crowdfunding_campaigns"("end_date");

-- CreateIndex
CREATE INDEX "idx_project_creation_milestones_project_order" ON "project_creation_milestones"("project_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "project_digital_twin_models_project_id_key" ON "project_digital_twin_models"("project_id");

-- CreateIndex
CREATE INDEX "idx_project_digital_twin_models_project_active" ON "project_digital_twin_models"("project_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_project_digital_twin_components_model_order" ON "project_digital_twin_components"("model_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_project_digital_twin_components_model_external" ON "project_digital_twin_components"("model_id", "external_id");

-- CreateIndex
CREATE INDEX "idx_project_creation_milestone_components_component_id" ON "project_creation_milestone_components"("component_id");

-- CreateIndex
CREATE INDEX "idx_project_creation_milestone_components_milestone_order" ON "project_creation_milestone_components"("milestone_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_project_creation_milestone_components_milestone_component" ON "project_creation_milestone_components"("milestone_id", "component_id");

-- CreateIndex
CREATE INDEX "idx_project_documents_project_kind" ON "project_documents"("project_id", "kind");

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_lockouts" ADD CONSTRAINT "account_lockouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lockout_audit_logs" ADD CONSTRAINT "lockout_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_resident_waitlists" ADD CONSTRAINT "non_resident_waitlists_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_contacts" ADD CONSTRAINT "project_contacts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_crowdfunding_campaigns" ADD CONSTRAINT "project_crowdfunding_campaigns_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_creation_milestones" ADD CONSTRAINT "project_creation_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_digital_twin_models" ADD CONSTRAINT "project_digital_twin_models_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_digital_twin_components" ADD CONSTRAINT "project_digital_twin_components_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "project_digital_twin_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_creation_milestone_components" ADD CONSTRAINT "project_creation_milestone_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "project_digital_twin_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_creation_milestone_components" ADD CONSTRAINT "project_creation_milestone_components_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "project_creation_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

