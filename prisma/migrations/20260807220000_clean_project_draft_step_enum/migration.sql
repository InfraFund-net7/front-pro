-- Remove the crowdfunding_model/asset_symbol values from project_draft_step:
-- createProjectDraft always sets current_step straight to
-- contact_information on creation, so no row has ever actually had either
-- value (they only existed as never-reached states in the enum + the
-- column's old default).
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
