// Shared between client components (developer-home.tsx) and server code
// (digital-twin access guards) -- plain constants only, no 'use client' /
// 'server-only' restriction. scripts/seed-demo-digital-twin-project.mjs
// keeps its own copy of this id (plain .mjs scripts in this repo don't
// import from src/), see the "keep in sync" comment there.

// Fixed, well-known id for the always-available demo project seeded by
// scripts/seed-demo-digital-twin-project.mjs. Not a secret.
export const DEMO_DIGITAL_TWIN_PROJECT_ID =
  '00000000-0000-0000-0000-000000000002';

export function isDigitalTwinDemoModeEnabled() {
  return process.env.NEXT_PUBLIC_DIGITAL_TWIN_DEMO_MODE === 'true';
}
