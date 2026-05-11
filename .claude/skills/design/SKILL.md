---
name: design-system-infrafund-front-pro
description: Produces Figma-first implementation guidance for InfraFund UI work across the whole product.
---

<!-- TYPEUI_SH_MANAGED_START -->

# InfraFund Figma-first design skill

## Mission

Produce implementation-ready UI guidance for the whole InfraFund product
using Figma as the only visual source of truth.

## Source-of-truth policy

Figma has priority over this repository's existing implementation.

That means:

- current code may help with framework, file structure, routing, and reusable
  component architecture
- current code must not be treated as visual or interaction authority when it
  differs from Figma
- if implementation and Figma disagree, guidance must follow Figma
- any existing page in the repo may later need a refresh to realign with Figma

Primary file:

- [InfraFund-local](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local)

## System coverage expectation

Do not infer the full design system from one page unless the user explicitly
asks for page-specific guidance.

For system guidance, reason across multiple representative Figma surfaces,
such as:

- role dashboards
- explore-project surfaces
- create-project flows
- tokenization flows
- investment portal forms
- shared shell/navigation/header patterns

## Product style summary

InfraFund is a dark, dashboard-oriented product with:

- deep charcoal page backgrounds
- translucent glass-like panels
- neon-green primary emphasis
- Chakra Petch for hierarchy and navigation
- IBM Plex Mono for data, labels, metadata, and wallet/system text
- rounded, modular surfaces with strong spacing rhythm

## Required workflow

When asked for design guidance:

1. Inspect the relevant Figma nodes first.
2. Identify repeated patterns across multiple product surfaces.
3. Separate global primitives from page-specific composition.
4. Map guidance into implementation-ready rules.
5. Mention repo files only as implementation targets, not as visual truth.

## Repo-awareness rules

You must still analyze the repo to understand:

- framework and stack
- styling system
- shared component boundaries
- token transport layer
- existing shell or primitive files that will need refresh work

But you must not let current implementation override Figma decisions.

## Foundation guidance rules

When writing guidance, always define:

- canonical color palette
- typography roles
- spacing rhythm
- radius tiers
- border and surface treatment
- blur/glass usage
- interaction states
- accessibility expectations

## Core component families to cover

When possible, organize guidance around these system primitives:

1. app shell
2. sidebar navigation
3. header and account region
4. page title block
5. stat cards
6. glass panels
7. nested item cards
8. project cards
9. forms and field groups
10. inputs and selects
11. buttons and text actions
12. status chips
13. progress indicators
14. avatars and identity badges

## Interaction rules

Every interactive component must define:

- default
- hover
- focus-visible
- active
- disabled
- loading when relevant

Interaction guidance must be consistent across the product, not invented per
page.

## Accessibility rules

Every result must include testable accessibility guidance:

- WCAG 2.2 AA contrast expectations
- keyboard reachability
- visible focus treatment
- semantic HTML expectations
- icon-only labeling requirements
- non-color status communication
- overlay/menu dismissal behavior where relevant

## Guidance writing rules

Use:

- "must" for non-negotiable rules
- "should" for recommendations
- file-path references only when discussing implementation targets

Avoid:

- treating repo drift as valid design evidence
- outputting token dumps without component guidance
- proposing one-off styling that is not anchored in Figma patterns
- assuming one page represents the whole product unless clearly scoped

## Output structure

For whole-product guidance, prefer this structure:

1. Source-of-truth statement
2. Scope of audited Figma surfaces
3. Product character summary
4. Foundation tokens and typography
5. Layout system
6. Core component families
7. Interaction rules
8. Accessibility requirements
9. Repo implementation policy
10. Anti-patterns
11. QA checklist

## Implementation policy

When converting guidance into code advice:

- preserve the repo's framework and architecture patterns where practical
- refresh shared primitives toward Figma instead of preserving visual drift
- treat generated Figma code as reference only
- prefer reusable primitives over page-local duplication
- keep role-based differences data-driven where the shell and patterns are
  shared

## Anti-patterns

Do not:

- use currently implemented pages as visual guidance when Figma differs
- assume the existing Tailwind classes reflect the correct system
- preserve inconsistent component behavior only because it already exists
- create new visual exceptions without Figma evidence

## Success criteria

A strong result:

- is Figma-first
- works across the whole product, not only one page
- distinguishes system primitives from page composition
- is implementation-ready for engineers
- helps future refresh work converge drifted pages back to Figma

<!-- TYPEUI_SH_MANAGED_END -->
