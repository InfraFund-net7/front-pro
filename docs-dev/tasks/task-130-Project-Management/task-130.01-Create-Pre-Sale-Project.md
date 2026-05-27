<!-- cspell:words glTF Infrafund Openfort project_owner presale Pre-Sale USDC uuidv Timestamptz prebuild -->

# Task 130.01 — Create Pre-Sale Project

**Date:** 2026-05-12  
**Status:** In progress  
**Area:** Project Management / Create Project  
**Primary route:** `/create-project`

## Summary

The main process to implement is **Create Pre-Sale Project**: a database-backed project creation flow where an eligible user applies for setup of a new renewable energy project using the Pre-Sale crowdfunding path.

Only authenticated users with backend role `project_owner` are allowed to execute this process.

The flow must save progress after each form page and stop after review/submission. The payment flow that follows in Figma is intentionally skipped for this task.

Main implementation references:

- `docs-dev/resources/sitemap/client-flow.md`
- Figma via MCP, using the page-specific links below
- `DESIGN.md`

Pages to implement:

| Page | Figma reference | Notes |
| --- | --- | --- |
| Contact Information | [node `936:19227`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=936-19227&m=dev&t=guwcQKwwK36XrKXX-1) | Collect project contact details. |
| Project Information | [node `936:19395`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=936-19395&m=dev&t=guwcQKwwK36XrKXX-1) | Renewable Energy project details. |
| Milestones | Extracted from Crowdfunding Campaign Details | Separate page for milestone list: name, cost, end date. |
| Crowdfunding Campaign Details | [node `936:19613`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=936-19613&m=dev&t=guwcQKwwK36XrKXX-1) | Token/campaign fields only, without milestones. |
| Project Summary | [node `2959:33803`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=2959-33803&m=dev&t=guwcQKwwK36XrKXX-1) | Review persisted details before final submit. |

This task is the first part of a broader project database model that will later cover:

1. Initial project creation.
2. Construction phase milestones, milestone statuses, and linked Milestone Progress Reports.
3. Operation phase reports and sensor time-series data, especially generated power over time.

This document preserves the context, requirements, references, and implementation guidance for continuing the Create Project work.

## Role and access requirement

Only authenticated users whose backend account role is `project_owner` may create or apply for setup of a new project.

Required behavior:

- API routes that create or mutate project drafts must reject non-`project_owner` users with `FORBIDDEN`.
- Sidebar navigation should enable the `Create Project` menu item only for `project_owner` users.
- Non-`project_owner` users should see Create Project as locked/disabled in the menu.
- If a non-`project_owner` user directly opens `/create-project`, the page should block project creation and explain that a project owner account is required.

Existing auth context:

- User roles are represented by `UserRole` in `prisma/schema.prisma`.
- `client` is normalized to `project_owner` in `src/server/services/auth.ts`.
- Client session state is exposed through `useAuthSession()` in `src/components/auth/auth-session-provider.tsx`.

## Design and implementation rules

Follow the project-level design system and Figma-first policy.

Primary design guidance:

- `DESIGN.md`
- `.factory/skills/design/SKILL.md`
- Existing project instructions in `AGENTS.md` / `CLAUDE.md`

Design principles to preserve:

- Figma is the visual source of truth.
- Use the dark cinematic dashboard shell language.
- Use glass-like panels, subtle borders, and the established radius scale.
- Use Chakra Petch for page titles, section titles, navigation, and buttons.
- Use IBM Plex Mono for labels, metadata, helper text, and structured data.
- Preserve visible focus states and keyboard-friendly form behavior.
- Avoid one-off visual styles when a design-system primitive or pattern exists.

## Sitemap references

Relevant sitemap file:

- `docs-dev/resources/sitemap/client-flow.md`

Relevant sitemap rows:

- `client-create-project-start`
  - Title: Create Project
  - Route: `/client/projects/create`
  - Figma node: `13:14044`
  - Related repeated Pre-sale node: `703:33920`
- `client-create-project-ticker-a/b/c`
  - Original ticker/symbol setup screens.
  - These were reviewed but later removed from the shipping flow for now.
- `client-review-offering`
  - Title: Review & confirm your offering
  - Route: `/client/projects/create/review`
  - Figma node: `13:14162`
  - Related repeated Pre-sale node: `703:34038`
- `client-portal-contact-form`
  - Title: Investment Portal / Forms / Contact information
  - Route: `/client/investment-portal/contact`
  - Figma node: `13:14393`
  - Related repeated Pre-sale node: `703:34269`
- `client-portal-project-form`
  - Title: Investment Portal / Forms / Project information
  - Route: `/client/investment-portal/project`
  - Figma node: `13:14452`
  - Related repeated Pre-sale node: `703:34328`

The sitemap notes that the Figma file contains repeated asset-class sections for Pre-sale, Loan, Equity, and Debt. For this task, use only the Pre-sale path.

## Figma references by page

Primary Figma file:

- [InfraFund-local](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local)

Use these Figma references for the Create Project flow:

### 1. Choose crowdfunding model

Use for the initial model selection page.

- Primary sitemap node: `13:14044`
- Repeated Pre-sale section node: `703:33920`
- User-provided Pre-sale path reference: [node `897:19421`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=897-19421&m=dev&t=guwcQKwwK36XrKXX-1)

Implementation decision:

- Only **Pre-Sale** is enabled.
- Charity, Equity, and Debt can remain visible as disabled/future options if useful for matching Figma, but must not start a flow.

### 2. Ticker / asset symbol

Original Figma and sitemap references:

- `13:14125`
- `13:14302`
- `13:14348`
- Repeated nodes: `703:34001`, `703:42771`, `703:51541`

Implementation decision:

- This step was removed from the current shipping flow.
- Do not ask for ticker/digital asset symbol for now.
- The database still has `digitalAssetSymbol` as an optional field from the first implementation, but the UI no longer collects it.

### 3. Contact Information form

Use for contact details collection.

- Primary sitemap node: `13:14393`
- Repeated Pre-sale node: `703:34269`

Fields identified from Figma:

- First Name
- Last Name
- Email
- Title
- Phone Number (optional)

Database/API mapping:

- `ProjectContact.firstName`
- `ProjectContact.lastName`
- `ProjectContact.email`
- `ProjectContact.title`
- `ProjectContact.phoneNumber`

### 4. Project Information form

Use for renewable energy project information.

- Primary sitemap node: `13:14452`
- User-provided Figma reference: [node `936:19395`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=936-19395&m=dev&t=guwcQKwwK36XrKXX-1)
- Repeated Pre-sale node: `703:34328`

Important requirement:

- `PROJECT TYPE = RENEWABLE ENERGY`

Fields identified from Figma:

- Project Name
- Project Description
- Target Investment Amount (£)
- Project Type = Renewable Energy
- Infrastructure Type, e.g. Wind Energy
- Project Status, e.g. Ready to launch
- Raised before?
- Website Link
- Social Media Link
- Proposal File

Database/API mapping:

- `Project.name`
- `Project.description`
- `Project.targetInvestmentAmount`
- `Project.targetInvestmentCurrency = GBP`
- `Project.type = renewable_energy`
- `Project.infrastructureType`
- `Project.projectStatus`
- `Project.raisedBefore`
- `Project.websiteUrl`
- `Project.socialUrl`
- `ProjectDocument` row with `kind = proposal` for proposal file metadata

Current upload decision:

- Proposal file binary upload is metadata-only for now unless durable storage is added later.
- Store file name, MIME type, size, checksum/storage URL only when available.

### 5. Project Milestones form

This page was added after review of the first implementation.

Reason:

- The original Crowdfunding Campaign Details page had milestone entry mixed with token/campaign fields.
- The requested improvement was to first create a separate list of milestones with at least name, cost, and end date.
- These milestones are initial project creation milestones and will later inform the construction phase model.

Fields:

- Name
- Cost
- End Date

Database/API mapping:

- `ProjectCreationMilestone.name`
- `ProjectCreationMilestone.cost`
- `ProjectCreationMilestone.endDate`
- `ProjectCreationMilestone.sortOrder`

### 6. Crowdfunding Campaign Details form

Use for token/campaign fields only, after the separate milestones page.

User-provided Figma reference:

- [node `936:19613`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=936-19613&m=dev&t=guwcQKwwK36XrKXX-1)

Implementation guidance:

- Remove the generic page header text from this step:
  - `Application Form`
  - `Complete your information to stay connected and receive updates.`
- Do not show raw API validation dumps on the page.
- Show a short, user-friendly validation message instead.
- Milestones should no longer appear on this page.
- This page should contain token/campaign details only.

Fields from the current implementation and Figma context:

- Token Name
- Digital Asset Supply / Maximum Token Supply
- Price / Price per Token
- Currency, currently defaulted to `USDC`
- Min Raise
- Max Raise
- Min Donation / minimum contribution
- Max Donation / maximum contribution
- Start Date
- End Date
- General Contractor (GC) Wallet Address
- Pledge Address

Database/API mapping:

- `ProjectCrowdfundingCampaign.tokenName`
- `ProjectCrowdfundingCampaign.digitalAssetSupply`
- `ProjectCrowdfundingCampaign.price`
- `ProjectCrowdfundingCampaign.currency`
- `ProjectCrowdfundingCampaign.minRaise`
- `ProjectCrowdfundingCampaign.maxRaise`
- `ProjectCrowdfundingCampaign.minContribution`
- `ProjectCrowdfundingCampaign.maxContribution`
- `ProjectCrowdfundingCampaign.startDate`
- `ProjectCrowdfundingCampaign.endDate`
- `ProjectCrowdfundingCampaign.generalContractorWalletAddress`
- `ProjectCrowdfundingCampaign.pledgeAddress`

### 7. Review and Confirm

Use for final read-only review.

- Primary sitemap node: `13:14162`
- Repeated Pre-sale node: `703:34038`

Behavior:

- Show persisted project draft details.
- Allow going back to edit.
- Final submit stores the project as submitted.
- Skip payment flow after this point.

Important user requirement:

- “We skip the payment flow which comes thereafter and just store it in the database, actually at least after each form page.”

## Current flow order

The intended current flow is:

1. Choose crowdfunding model
2. Contact Information
3. Project Information
4. Project Milestones
5. Crowdfunding Campaign Details
6. Review and Confirm
7. Submitted confirmation

Removed from active flow:

- Ticker / asset symbol step
- Payment flow

## Persistence requirement

Persist after each form page/step.

Current API shape:

- `POST /api/v1/projects`
  - Creates a Pre-Sale project draft.
- `PATCH /api/v1/projects/[id]/contact`
  - Saves contact information.
- `PATCH /api/v1/projects/[id]/information`
  - Saves project information and proposal metadata.
- `PATCH /api/v1/projects/[id]/milestones`
  - Saves/replaces project creation milestones.
- `PATCH /api/v1/projects/[id]/campaign`
  - Saves crowdfunding campaign/token details.
- `GET /api/v1/projects/[id]`
  - Reads the draft for review/continuation.
- `POST /api/v1/projects/[id]/submit`
  - Marks the draft submitted.

All project API routes must require:

- Valid backend app bearer token.
- Authenticated user role `project_owner`.
- Project ownership for routes that mutate/read an existing project.

## Database schema guidance

Current Prisma schema additions live in:

- `prisma/schema.prisma`

Core models:

- `Project`
- `ProjectContact`
- `ProjectCrowdfundingCampaign`
- `ProjectCreationMilestone`
- `ProjectDocument`

Core enums:

- `ProjectDraftStep`
- `ProjectStatus`
- `ProjectType`
- `ProjectInfrastructureType`
- `ProjectCrowdfundingModel`
- `ProjectSubmissionStatus`

Important conventions:

- Use `uuidv7()` generated IDs where new string UUID primary keys are needed.
- Use snake_case database table/column mappings with `@@map` and `@map`.
- Use `DateTime @db.Timestamptz(6)` for timestamp fields.
- Use `Decimal` for currency/token supply/price fields.
- Preserve relations from `User` to owned projects through `Project.ownerUserId`.

Current schema caveat:

- `Project.digitalAssetSymbol` remains optional but is no longer collected in the current flow.
- `ProjectDraftStep.asset_symbol` may remain for compatibility, but the active flow should not use it.

## Backend files involved

Current/new backend files:

- `src/server/repositories/projects.ts`
- `src/server/services/projects.ts`
- `src/server/validation/projects.ts`
- `src/app/api/v1/projects/route.ts`
- `src/app/api/v1/projects/[id]/route.ts`
- `src/app/api/v1/projects/[id]/contact/route.ts`
- `src/app/api/v1/projects/[id]/information/route.ts`
- `src/app/api/v1/projects/[id]/milestones/route.ts`
- `src/app/api/v1/projects/[id]/campaign/route.ts`
- `src/app/api/v1/projects/[id]/submit/route.ts`

Backend layering to preserve:

1. Route handler reads bearer token and parses request.
2. Validation module parses/validates JSON body.
3. Service authenticates app session, checks `project_owner`, and enforces ownership.
4. Repository performs Prisma reads/writes.
5. API returns normalized snake_case JSON using existing `jsonOk` / `handleApiError` helpers.

## Frontend files involved

Primary frontend file:

- `src/components/createproject/CreateProject.tsx`

Route:

- `src/app/create-project/page.tsx`

Client API helpers:

- `src/lib/backend-auth-client.ts`

Navigation/access UI:

- `src/components/sidebar.tsx`

Current frontend requirements:

- Use `useAuthSession()` for backend access token and backend user role.
- Block non-`project_owner` users.
- Persist via `backend-auth-client` helpers.
- Keep a local `projectId`/project response after draft creation.
- Move from step to step only after successful persistence.
- Replace raw API validation details with a concise friendly message.

## Validation behavior

Avoid showing raw validation payloads such as:

```text
Validation failed — token_name: token_name is required, digital_asset_supply: digital_asset_supply is required, ...
```

Preferred UI behavior:

- Show concise message: `Please complete the required fields before continuing.`
- Keep detailed server-side validation for API correctness.
- Continue using `VALIDATION_ERROR` responses with fields for API consumers.

## Future work notes

Likely next steps:

1. Improve field-level inline validation instead of only a generic error message.
2. Add durable file upload/storage for proposal files.
3. Add draft continuation/loading if the user leaves and returns.
4. Add database-backed project listing and connect created projects to dashboards.
5. Extend schema for construction phase:
   - milestones
   - milestone statuses
   - milestone progress reports
   - links to digital twin model elements where relevant
6. Extend schema for operation phase:
   - sensors
   - sensor readings/time series
   - generated power aggregation by time frame
7. Decide whether to remove unused `digitalAssetSymbol` and `asset_symbol` step from schema or keep them for later tokenization.

## Verification commands

Use existing repository commands only.

Run after implementation changes:

```sh
npm run db:generate
npx tsc --noEmit --pretty false
npm run format
npx next build
```

Repository note:

- `npm run build` runs prebuild database setup and may require `DATABASE_URL`.
- The established verification path for this repo is `npm run db:generate` followed by `npx next build` when needed.

## Do not implement in this task

Out of scope for this first Create Project pass:

- Payment flow.
- Full tokenization smart-contract deployment.
- Construction phase progress reports.
- Operational sensor/time-series ingestion.
- Real proposal file storage unless storage infrastructure is explicitly added.
- Loan, Equity, Charity, or Debt paths.
