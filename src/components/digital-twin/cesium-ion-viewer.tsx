'use client';

// cspell:words Cesium tileset
import { useEffect, useRef, useState } from 'react';
import type { Viewer as CesiumViewer } from 'cesium';
type CesiumIonViewerProps = {
  assetId: number;
};

type ViewerState = 'loading' | 'ready' | 'missing-token' | 'error';

export function CesiumIonViewer({ assetId }: CesiumIonViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>('loading');

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) {
      return;
    }

    const accessToken = process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN;

    if (!accessToken) {
      setViewerState('missing-token');
      return;
    }

    const cesiumAccessToken = accessToken;
    let isMounted = true;

    async function initializeViewer() {
      try {
        window.CESIUM_BASE_URL = '/cesium';
        const Cesium = await import('cesium');
        Cesium.Ion.defaultAccessToken = cesiumAccessToken;

        const viewer = new Cesium.Viewer(containerRef.current!, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: true,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          terrain: Cesium.Terrain.fromWorldTerrain(),
        });

        viewerRef.current = viewer;

        const tileset = viewer.scene.primitives.add(
          await Cesium.Cesium3DTileset.fromIonAssetId(assetId)
        );

        await viewer.zoomTo(tileset);

        if (isMounted) {
          setViewerState('ready');
        }
      } catch (error) {
        console.error('Failed to initialize Cesium digital twin viewer', error);
        if (isMounted) {
          setViewerState('error');
        }
      }
    }

    void initializeViewer();

    return () => {
      isMounted = false;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [assetId]);

  return (
    <section className="overflow-hidden rounded-[28px] border border-card-border bg-card-bg shadow-2xl backdrop-blur-xl">
      <div className="relative h-[520px] bg-[#0C0C0D]">
        <div ref={containerRef} className="h-full w-full" />

        {viewerState === 'ready' ? null : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0C0C0D]/80 p-6 text-center backdrop-blur-sm">
            <div className="max-w-md rounded-2xl border border-card-border bg-[#151E2F]/90 p-5 shadow-xl">
              <p className="chakra-petch text-lg font-bold text-white">
                {viewerState === 'loading'
                  ? 'Loading Cesium model...'
                  : viewerState === 'missing-token'
                    ? 'Cesium token is not configured'
                    : 'Cesium model failed to load'}
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                {viewerState === 'missing-token'
                  ? 'Set NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN to enable this viewer.'
                  : viewerState === 'error'
                    ? 'Check the Cesium Ion token, asset permissions, and network access.'
                    : 'Fetching terrain and the Ion 3D Tiles asset.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
