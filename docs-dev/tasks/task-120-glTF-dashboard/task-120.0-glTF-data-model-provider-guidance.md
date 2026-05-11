<!-- cspell:words glTF GLB Revit BIM Infrafund Meshopt Draco decimated decimation georeference georeferenced raycastable orthophoto orthophotos CSV SCADA -->

# Task 120.0 — glTF Data Model Provider Guidance

**Date:** 2026-05-11
**Status:** Draft
**Audience:** 3D model provider, BIM provider, Revit/IFC exporter, digital twin data provider
**Related plan:** `docs-dev/tasks/task-120-glTF-dashboard/task-120.1-glTF-dashboard-plan.md`

## Purpose

InfraFund will use provided glTF/GLB models as static 3D canvases and will apply construction and operational data from its own database at runtime. This means the model provider must deliver not only a visual model, but also a stable element mapping that lets the web application connect database rows to individual model parts.

The most important requirement is stable element identity. If a turbine, panel, foundation segment, window, inverter, cable tray, or other trackable object cannot be uniquely identified in both the model and the manifest, the application cannot color, hide, select, or update it reliably.

## Deliverables

For each project model delivery, provide:

1. **Web-ready model asset**
   - Preferred: `.glb` binary glTF.
   - Acceptable: `.gltf` plus all referenced `.bin` and texture files.

2. **Element manifest**
   - Preferred: JSON.
   - Acceptable: CSV if all required fields are present.
   - Must contain one row/object for every trackable element.

3. **Model metadata file**
   - Model version.
   - Source system.
   - Source file/version reference.
   - Export date.
   - Units.
   - Coordinate/origin notes.
   - Up-axis/orientation.
   - Known limitations.

4. **Preview package**
   - Screenshot or thumbnail of the whole model.
   - Optional screenshots of major zones/systems.

5. **Validation notes**
   - Element count.
   - Triangle count or approximate geometry complexity.
   - Texture size summary.
   - List of unsupported/missing/merged elements, if any.

## Hard requirements

### 1. Every trackable object needs a stable external ID

Use one of these identifiers, in this preference order:

1. IFC `GlobalId`.
2. Revit `UniqueId`.
3. Another provider-generated UUID, only if guaranteed stable across exports and model revisions.

The same ID must appear in:

- the glTF/GLB node or mesh name, and
- the element manifest.

Do not rely on:

- display names such as `Window 1`,
- array indices,
- mesh order,
- automatically generated names such as `Object_001`,
- material names,
- names that change on each export.

### 2. Trackable objects must remain separate

If InfraFund needs to color, hide, select, or update an object independently, that object must remain independently addressable in the glTF scene.

Do not merge trackable objects into one mesh. For example:

- Do not merge all windows into a single `Windows` mesh if each window needs its own status.
- Do not merge all solar panels into a single mesh if each panel/string needs independent telemetry.
- Do not merge turbine components if each component has separate construction or operational state.

It is acceptable and encouraged to merge non-trackable decorative or static geometry when it improves performance.

### 3. IDs must be preserved through optimization

Optimization is welcome, but it must not destroy the mapping contract.

Any compression, decimation, mesh cleanup, Blender processing, or export plugin must preserve:

- stable node/mesh names,
- element hierarchy where provided,
- one-to-one or documented one-to-many mapping between manifest rows and rendered objects.

### 4. Web performance matters

The delivered model should be practical for browser rendering.

Provider should:

- remove hidden/internal geometry that is not needed for visualization,
- reduce excessive polygon counts,
- simplify tiny details that are not useful in the web dashboard,
- use texture sizes appropriate for web delivery,
- prefer GLB for a single compact asset,
- consider Draco or Meshopt compression if compatible with the agreed viewer pipeline,
- avoid extremely large uncompressed textures.

## Recommended element granularity

The right element granularity depends on what InfraFund needs to visualize.

Use this principle:

> If the dashboard needs a separate status, separate click target, separate schedule line, or separate sensor value for an object, it needs a separate stable element ID.

Examples:

| Project type | Trackable examples |
| --- | --- |
| Wind | Turbine, tower section, nacelle, blade set, foundation, transformer, access road segment, substation component |
| Solar | Panel/string/block, inverter, combiner box, tracker row, foundation/pile group, substation component |
| Geothermal | Well pad, well head, pipe segment, pump, separator, heat exchanger, turbine/generator, cooling component |
| Buildings/support | Foundation, wall/section, floor/zone, window, door, roof segment, MEP component |

For early MVP delivery, grouping is acceptable if agreed upfront. For example, a solar plant may track a row or block instead of every individual panel.

## Manifest requirements

The manifest is the bridge between the model and InfraFund's database. It should be model-independent and include all information needed to create generic element records.

### Required fields

| Field | Required | Description |
| --- | --- | --- |
| `externalId` | Yes | Stable ID used in the glTF node/mesh name. Prefer IFC `GlobalId` or Revit `UniqueId`. |
| `displayName` | Yes | Human-readable label for UI lists and selection panels. |
| `category` | Yes | Element category, such as `turbine`, `foundation`, `window`, `solar_panel`, `inverter`. |
| `modelNodeName` | Yes | Exact glTF node or mesh name that contains or equals the `externalId`. |
| `trackable` | Yes | Boolean indicating whether the app should style/select this element. |
| `parentExternalId` | No | Parent element or assembly ID. |
| `level` | No | Level, floor, elevation band, or site layer. |
| `zone` | No | Site area, construction zone, block, row, pad, or building zone. |
| `system` | No | Electrical, civil, mechanical, structural, access, grid, etc. |
| `constructionPackage` | No | Work package or contractor package. |
| `defaultStatus` | No | Initial status if known. Example: `not_started`, `in_progress`, `installed`. |
| `metadata` | No | Extra model/provider data as JSON. |

### Recommended JSON shape

```json
{
  "model": {
    "projectName": "Example Wind Farm",
    "modelVersion": "2026-05-11-v1",
    "sourceSystem": "revit",
    "sourceModelVersion": "RVT-2026-05-10",
    "unit": "meter",
    "upAxis": "Y",
    "exportedAt": "2026-05-11T12:00:00Z"
  },
  "elements": [
    {
      "externalId": "3nT$9Kp8H4A9fK2LqS0abc",
      "displayName": "Turbine 01 Foundation",
      "category": "foundation",
      "modelNodeName": "3nT$9Kp8H4A9fK2LqS0abc",
      "trackable": true,
      "parentExternalId": "TURBINE-01",
      "level": "site",
      "zone": "north-field",
      "system": "civil",
      "constructionPackage": "CIVIL-FOUNDATIONS",
      "defaultStatus": "not_started",
      "metadata": {
        "sourceCategory": "Structural Foundations",
        "sourceType": "Concrete Pad"
      }
    }
  ]
}
```

### Recommended CSV columns

```csv
externalId,displayName,category,modelNodeName,trackable,parentExternalId,level,zone,system,constructionPackage,defaultStatus,metadataJson
3nT$9Kp8H4A9fK2LqS0abc,Turbine 01 Foundation,foundation,3nT$9Kp8H4A9fK2LqS0abc,true,TURBINE-01,site,north-field,civil,CIVIL-FOUNDATIONS,not_started,"{""sourceCategory"":""Structural Foundations""}"
```

## glTF/GLB naming rules

- Node or mesh names must be unique for trackable elements.
- The stable external ID should be the full node/mesh name or a clearly parseable part of it.
- Avoid spaces and special formatting if possible.
- If a readable prefix is needed, use a consistent convention.

Recommended examples:

```text
ifc_3nT9Kp8H4A9fK2LqS0abc
revit_2d4f6b3a-9d30-4d88-9f20-abc123:000456
solar_panel_SP-ROW-01-PANEL-001
wind_turbine_T01_foundation
```

If provider prefixes IDs, the manifest must contain the exact `modelNodeName` so the app does not need to guess.

## Hierarchy guidance

A useful model hierarchy makes the dashboard easier to filter and navigate.

Recommended hierarchy:

```text
Project
  Site zone
    System or package
      Assembly
        Trackable element
```

Example:

```text
WindFarm
  NorthField
    Turbine01
      Turbine01_Foundation
      Turbine01_TowerSection01
      Turbine01_Nacelle
      Turbine01_BladeSet
```

The manifest should repeat the same hierarchy through `parentExternalId`, `zone`, `system`, and `constructionPackage` fields.

## Material guidance

InfraFund's application will apply runtime status colors, opacity, visibility, and highlights. Therefore:

- Do not encode construction status as permanent model materials.
- Do not require status changes to be made in Revit or another BIM tool.
- It is fine to provide realistic base materials for neutral/default rendering.
- Assume the app may replace or clone materials for trackable elements.
- Document materials that have special transparency needs, such as glass or water.

Important: many glTF exporters share material instances across multiple meshes. This is normal, but the app must be able to override an individual mesh without changing every other mesh that uses the same base material. Keeping trackable elements as separate meshes is more important than unique materials.

## Coordinate, scale, and orientation guidance

Provide:

- model unit, preferably meters,
- up axis,
- model origin description,
- whether the model is georeferenced,
- any scale factor applied during export,
- recommended initial camera target if known,
- bounding box dimensions if available.

For web viewing, a stable local origin near the model is usually easier than using very large real-world coordinates. If georeferencing is needed, provide it as metadata rather than forcing the visual model to use huge coordinate values.

## Texture and asset guidance

- Prefer a single `.glb` for delivery.
- Use web-appropriate texture sizes.
- Remove unused textures/materials.
- Avoid embedding unnecessary high-resolution construction drawings or orthophotos unless explicitly required.
- If separate textures are required, preserve relative paths and include all files.
- Provide license/usage notes for any third-party textures or assets.

## Versioning guidance

Every model delivery needs a version. The version should change when geometry, IDs, hierarchy, or manifest content changes.

Provide:

- `modelVersion`,
- `sourceModelVersion`,
- export timestamp,
- checksum if available,
- changelog from prior version,
- list of added/removed/replaced `externalId` values.

Stable IDs should remain stable across revisions. If an element is replaced and receives a new ID, include a mapping note such as:

```json
{
  "replacedElements": [
    {
      "oldExternalId": "old-foundation-id",
      "newExternalId": "new-foundation-id",
      "reason": "Foundation geometry revised after design update"
    }
  ]
}
```

## Acceptance checklist

InfraFund should be able to validate every delivery with this checklist:

### Identity and manifest

- [ ] Every trackable manifest row has a non-empty `externalId`.
- [ ] Every `externalId` is unique within the project/model.
- [ ] Every trackable manifest row has an exact matching glTF node or mesh.
- [ ] Every trackable glTF node or mesh appears in the manifest.
- [ ] IDs are stable source IDs, not generated export indices.
- [ ] Manifest includes display labels and categories.

### Model structure

- [ ] Trackable objects are not merged into one combined mesh.
- [ ] Non-trackable objects are clearly marked or omitted from the manifest.
- [ ] Parent/zone/system/package fields are included when available.
- [ ] The model can be loaded in a standard glTF viewer.

### Visual and performance

- [ ] Model is delivered as GLB or complete glTF package.
- [ ] Geometry has been simplified for web use.
- [ ] Hidden/internal geometry has been removed where possible.
- [ ] Texture sizes are reasonable for web delivery.
- [ ] Model origin, scale, and up axis are documented.

### Runtime styling

- [ ] Each trackable element can be selected independently.
- [ ] Each trackable element can be colored independently.
- [ ] Each trackable element can be hidden independently.
- [ ] Transparent elements such as glass are documented.

### Versioning

- [ ] Model version is provided.
- [ ] Source system and source model version are provided.
- [ ] Export date is provided.
- [ ] Added/removed/replaced IDs are documented for revisions.

## Validation test expected from provider

Before delivery, the provider should perform a simple mapping test:

1. Open the GLB/GLTF in a viewer or inspection tool.
2. Confirm that trackable node/mesh names are visible and unique.
3. Pick a few sample manifest rows and confirm the matching node/mesh exists.
4. Pick a few sample model nodes and confirm the matching manifest row exists.
5. Confirm that an individual object can be isolated or selected without selecting all objects of the same category.

## Example provider handoff structure

```text
example-project-digital-twin-v1/
  model/
    example-project-v1.glb
  manifest/
    example-project-v1-elements.json
  preview/
    overview.png
    north-field.png
  metadata/
    example-project-v1-metadata.json
    example-project-v1-validation-notes.md
```

## Questions to resolve per project

These questions should be answered before accepting a real model delivery:

1. What identifier will be used as the stable external ID: IFC `GlobalId`, Revit `UniqueId`, or another stable UUID?
2. What is the smallest object that needs independent construction status?
3. What is the smallest object that needs independent operational telemetry?
4. Should repeated objects such as panels/windows be individually tracked or grouped by row/zone/package?
5. What model size target is acceptable for the first web dashboard?
6. Will model revisions be delivered, and how will changed/deleted element IDs be reported?

## Provider summary

The model provider should deliver a web-optimized GLB and a manifest that makes every dashboard-relevant object addressable by stable ID. InfraFund will store statuses and sensor data outside the model, so the provider should not encode live project state into the geometry. The delivery is acceptable only when the application can map each manifest row to a model node and independently style/select that object in the browser.
