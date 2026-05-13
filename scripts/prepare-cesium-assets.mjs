#!/usr/bin/env node

import { cp, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const cesiumSource = join(root, 'node_modules/cesium/Build/Cesium');
const cesiumTarget = join(root, 'public/cesium');
const assetDirectories = ['Assets', 'ThirdParty', 'Widgets', 'Workers'];

await rm(cesiumTarget, { force: true, recursive: true });
await mkdir(cesiumTarget, { recursive: true });

await Promise.all(
  assetDirectories.map((directory) =>
    cp(join(cesiumSource, directory), join(cesiumTarget, directory), {
      recursive: true,
    })
  )
);
