---
name: design-system-infrafund-front-pro
description: Applies InfraFund's Figma-first design system from DESIGN.md during UI work.
---

<!-- TYPEUI_SH_MANAGED_START -->

# InfraFund design skill

## Purpose

Use this skill when working on InfraFund UI so design decisions stay aligned
with Figma and the project-level design system in `DESIGN.md`.

## Rule hierarchy

Always apply rules in this order:

1. Relevant Figma frame or component
2. `DESIGN.md`
3. Existing repo architecture and shared component boundaries
4. Current implementation, only when it does not conflict with Figma

If implementation and Figma differ, Figma wins.

## What this file is for

This file is an instruction layer for agents.

It should stay short and procedural.
It should not duplicate the full InfraFund design system.
The detailed product-specific rules live in `DESIGN.md`.

## Required workflow

When doing UI work:

1. Inspect the relevant Figma surface first.
2. Read `DESIGN.md` and apply the matching system rules.
3. Identify whether the work affects a shared primitive or only page
   composition.
4. Implement using existing repo architecture where possible.
5. Prefer refreshing drifted UI toward Figma instead of preserving legacy
   styling.

## What to extract from Figma

Before implementation or guidance, identify:

- shell pattern
- typography roles
- color usage
- spacing rhythm
- radius tier
- card or form family
- interaction states
- accessibility implications

## Implementation rules

- Do not use existing pages as visual truth when Figma differs.
- Do not invent one-off styles if `DESIGN.md` already defines the pattern.
- Do not copy raw Figma-generated code directly into production.
- Reuse and refine shared primitives where possible.
- Keep role-specific differences data-driven when the shell and structure are
  shared.

## Output expectations

When giving guidance, reference:

- the relevant Figma surface
- the applicable section in `DESIGN.md`
- the repo files that should be updated

When implementing, preserve:

- repo framework choices
- component architecture
- accessibility

But align visual behavior to Figma-first rules.

<!-- TYPEUI_SH_MANAGED_END -->
