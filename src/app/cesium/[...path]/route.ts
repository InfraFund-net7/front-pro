import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const cesiumRoot = path.join(process.cwd(), 'node_modules/cesium/Build/Cesium');
const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

export async function GET(_request: Request, context: RouteContext) {
  const { path: pathParts } = await context.params;
  const normalizedPath = path.normalize(pathParts.join('/'));
  const filePath = path.join(cesiumRoot, normalizedPath);

  if (!filePath.startsWith(cesiumRoot) || normalizedPath.startsWith('..')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const body = await readFile(filePath);
    const contentType = contentTypes[path.extname(filePath).toLowerCase()];

    return new NextResponse(body, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...(contentType ? { 'Content-Type': contentType } : {}),
      },
    });
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }
}
