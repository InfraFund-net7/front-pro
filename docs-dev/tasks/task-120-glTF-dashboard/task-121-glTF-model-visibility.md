<!-- cspell:words glTF GLTF GLB Drei hardwired Infrafund modelUrl componentized fitout -->

# Task 121 — Hardwired glTF Model Visibility Concept Test

**Date:** 2026-05-13  
**Status:** Complete  
**Area:** Digital Twin / glTF component visibility  
**Related plan:** `docs-dev/tasks/task-120-glTF-dashboard/task-120.1-glTF-dashboard-plan.md`

## Goal

Prove the simplest digital twin visibility concept on:

- `/projects/3/digital-twin`

The test intentionally used hardwired data instead of database-backed records:

- one hardcoded glTF model file
- one hardcoded construction project
- hardcoded milestones
- a direct milestone `<1:1>` component mapping for most test cases
- checkbox state in the page controlling whether mapped model components are visible

This task was only meant to validate the interaction model before building upload/select flows, database persistence, and dynamic milestone-component mapping.

## Final test asset

The working model is:

- `public/models/digital-twin/wind-turbine/Wind_Turbine 3.gltf`
- `public/models/digital-twin/wind-turbine/Wind_Turbine 3.bin`

It was derived from the provided wind turbine glTF package and updated so trackable components have stable, unique node names.

Trackable component IDs:

- `wind_turbine_T01_tower`
- `wind_turbine_T01_access_platform`
- `wind_turbine_T01_nacelle_hub`
- `wind_turbine_T01_blade_01`
- `wind_turbine_T01_blade_02`
- `wind_turbine_T01_blade_03`

Each component has its own mesh node and material instance so the viewer can toggle visibility and later apply status colors independently.

## Implementation summary

Project `3` in `src/lib/digital-twin-projects.ts` now points to:

```ts
modelUrl: '/models/digital-twin/wind-turbine/Wind_Turbine 3.gltf'
```

Its milestones are hardcoded and map directly to the stable component node names in the model.

Current milestone intent:

| Milestone | Component node |
|---|---|
| tower install | `wind_turbine_T01_tower` |
| access platform install | `wind_turbine_T01_access_platform` |
| nacelle and hub mount | `wind_turbine_T01_nacelle_hub` |
| blade 01 fitout | `wind_turbine_T01_blade_01` |
| blade 02 fitout | `wind_turbine_T01_blade_02` |
| blade 03 fitout | `wind_turbine_T01_blade_03` |

The viewer reads completed milestones, builds a set of enabled component node names, and sets mesh visibility based on whether each mesh or one of its ancestors matches an enabled name.

## Result

The concept is proven:

- the page loads the componentized glTF model
- milestones can be selected in the UI
- selected milestones show their mapped component(s)
- unselected milestones hide their mapped component(s)
- hidden meshes do not continue casting shadows
- the test remains intentionally hardwired and local to project `3`

## Scope boundary

This task does not persist milestone state and does not create database-backed component mappings. It only validates that the frontend viewer can render a glTF asset from component visibility state.

The next phase should move the same concept into database-backed model selection, milestone creation, component mapping, and status-driven rendering.
