-- Remove the crowdfunding_model/asset_symbol values from project_draft_step.
-- This assumed no row had ever reached either value, since
-- createProjectDraft always sets current_step straight to
-- contact_information on creation -- wrong: a small number of legacy
-- project rows (pre-dating that behavior) still hold them. Reset those
-- rows to contact_information before narrowing the enum so the column
-- type swap below doesn't fail with "invalid input value for enum".
UPDATE "projects" SET "current_step" = 'contact_information'
  WHERE "current_step" IN ('crowdfunding_model', 'asset_symbol');

ALTER TABLE "projects" ALTER COLUMN "current_step" DROP DEFAULT;

ALTER TYPE "project_draft_step" RENAME TO "project_draft_step_old";

CREATE TYPE "project_draft_step" AS ENUM (
    'contact_information',
    'project_information',
    'project_milestones',
    'campaign_details',
    'review',
    'submitted'
);

ALTER TABLE "projects"
  ALTER COLUMN "current_step" TYPE "project_draft_step"
  USING ("current_step"::text::"project_draft_step");

ALTER TABLE "projects" ALTER COLUMN "current_step" SET DEFAULT 'contact_information';

DROP TYPE "project_draft_step_old";
