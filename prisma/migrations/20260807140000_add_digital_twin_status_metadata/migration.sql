-- Digital Twin v2: adds a component status/color model and free-form
-- metadata so the viewer can render status-driven visuals and arbitrary
-- provider metadata instead of the old binary is_visible-only state.
-- All additions are nullable or defaulted, so no backfill is required for
-- schema validity; see scripts/backfill-digital-twin-status.mjs for the
-- one-off data reconciliation that preserves pre-migration visibility.
CREATE TYPE "digital_twin_component_status" AS ENUM ('not_started', 'in_progress', 'installed', 'delayed', 'blocked');

-- AlterTable
ALTER TABLE "project_digital_twin_models" ADD COLUMN "cesium_ion_asset_id" INTEGER,
ADD COLUMN "metadata" JSONB;

-- AlterTable
ALTER TABLE "project_digital_twin_components" ADD COLUMN "status" "digital_twin_component_status" NOT NULL DEFAULT 'not_started',
ADD COLUMN "status_color" VARCHAR(20),
ADD COLUMN "metadata" JSONB;
