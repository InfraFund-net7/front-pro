#!/usr/bin/env node

import { resolve } from 'node:path';
import pg from 'pg';

import { loadEnvLocal } from './load-env-local.mjs';

const root = resolve(import.meta.dirname, '..');
const defaultDatabaseUrl =
  'postgresql://postgres:postgres@localhost:5432/infra_dev?sslmode=disable';

loadEnvLocal(root);

const connectionString = process.env.DATABASE_URL || defaultDatabaseUrl;
const client = new pg.Client({ connectionString });

// Keep in sync with src/lib/digital-twin-demo.ts.
const DEMO_OWNER_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_PROJECT_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_MODEL_ID = '00000000-0000-0000-0000-000000000003';

// Mirrors src/lib/project-digital-twin.ts's HARDWIRED_PROJECT_MODEL, the
// same seed data real projects get on creation.
const model = {
  name: 'Wind Turbine 1',
  assetUrl: '/models/digital-twin/wind-turbine/Wind_Turbine_3.gltf',
  format: 'gltf',
  source: 'demo_seed',
  components: [
    {
      externalId: 'concrete_base',
      displayName: 'Concrete base',
      category: 'foundation',
      nodeName: null,
      isVisible: false,
    },
    {
      externalId: 'tower',
      displayName: 'Tower',
      category: 'structure',
      nodeName: 'Tower',
      isVisible: true,
    },
    {
      externalId: 'generator_house',
      displayName: 'Generator house',
      category: 'nacelle',
      nodeName: 'Generator House',
      isVisible: true,
    },
    {
      externalId: 'rotor_blades',
      displayName: 'Rotor blades',
      category: 'rotor',
      nodeName: 'Rotor Blade',
      isVisible: true,
    },
  ],
};

await client.connect();

try {
  await client.query('BEGIN');

  await client.query(
    `INSERT INTO users (id, privy_user_id, type, role, status)
     VALUES ($1, 'demo:digital-twin-viewer', 'individual', 'project_owner', 'active')
     ON CONFLICT (id) DO NOTHING`,
    [DEMO_OWNER_USER_ID]
  );

  await client.query(
    `INSERT INTO projects (id, owner_user_id, name, description, submission_status)
     VALUES ($1, $2, 'Demo Wind Farm', 'Seeded demo project for the AI Digital Twin feature preview.', 'submitted')
     ON CONFLICT (id) DO NOTHING`,
    [DEMO_PROJECT_ID, DEMO_OWNER_USER_ID]
  );

  await client.query(
    `INSERT INTO project_digital_twin_models (id, project_id, name, asset_url, format, source, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     ON CONFLICT (project_id) DO NOTHING`,
    [
      DEMO_MODEL_ID,
      DEMO_PROJECT_ID,
      model.name,
      model.assetUrl,
      model.format,
      model.source,
    ]
  );

  for (const [index, component] of model.components.entries()) {
    await client.query(
      `INSERT INTO project_digital_twin_components
         (model_id, external_id, display_name, node_name, category, sort_order, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (model_id, external_id) DO NOTHING`,
      [
        DEMO_MODEL_ID,
        component.externalId,
        component.displayName,
        component.nodeName,
        component.category,
        index,
        component.isVisible,
      ]
    );
  }

  await client.query('COMMIT');
  console.log(
    `Demo digital twin project seeded (project_id=${DEMO_PROJECT_ID}).`
  );
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
