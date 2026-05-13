'use client';

// cspell:words Cesium tileset
import { useEffect, useRef, useState } from 'react';

type CesiumIonViewerProps = {
  assetId: number;
};

type CesiumViewer =
  NonNullable<typeof window.Cesium> extends {
    Viewer: new (...args: never[]) => infer Viewer;
  }
    ? Viewer
    : never;

type CesiumNamespace = NonNullable<typeof window.Cesium>;

type ViewerState =
  | 'checking-token'
  | 'loading-runtime'
  | 'loading'
  | 'ready'
  | 'missing-token'
  | 'token-rejected'
  | 'asset-access-error'
  | 'runtime-error'
  | 'error';

type IonPreflightResult =
  | { ok: true; warning?: string }
  | { ok: false; state: ViewerState; message: string };

const CESIUM_VERSION = '1.141';
const CESIUM_BASE_URL = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;
const CESIUM_SCRIPT_URL = `${CESIUM_BASE_URL}/Cesium.js`;
const CESIUM_WIDGETS_CSS_URL = `${CESIUM_BASE_URL}/Widgets/widgets.css`;
const CESIUM_ION_API_BASE_URL = 'https://api.cesium.com/v1';

function getCesium() {
  return window.Cesium;
}

function getTokenFormatWarning(accessToken: string) {
  if (/\s/.test(accessToken)) {
    return 'The Cesium token contains whitespace. Check for accidental line breaks or spaces in the Vercel environment variable.';
  }

  if (accessToken.length < 40) {
    return 'The Cesium token is shorter than expected. Confirm the full token was copied into the environment variable.';
  }

  if (!accessToken.includes('.')) {
    return 'The Cesium token format looks unusual because it does not contain a period separator.';
  }

  return undefined;
}

function ensureCesiumStylesheet() {
  if (document.querySelector(`link[href="${CESIUM_WIDGETS_CSS_URL}"]`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CESIUM_WIDGETS_CSS_URL;
  document.head.appendChild(link);
}

function loadCesiumRuntime() {
  const existingCesium = getCesium();

  if (existingCesium) {
    return Promise.resolve(existingCesium);
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${CESIUM_SCRIPT_URL}"]`
  );

  if (existingScript?.dataset.loaded === 'true') {
    const cesium = getCesium();

    if (cesium) {
      return Promise.resolve(cesium);
    }
  }

  return new Promise<CesiumNamespace>((resolve, reject) => {
    const script = existingScript ?? document.createElement('script');

    function handleLoad() {
      script.dataset.loaded = 'true';
      const cesium = getCesium();

      if (cesium) {
        resolve(cesium);
        return;
      }

      reject(new Error('Cesium loaded, but window.Cesium is unavailable.'));
    }

    function handleError() {
      reject(new Error(`Failed to load CesiumJS from ${CESIUM_SCRIPT_URL}`));
    }

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existingScript) {
      script.async = true;
      script.src = CESIUM_SCRIPT_URL;
      document.head.appendChild(script);
    }
  });
}

async function preflightIonAsset(
  assetId: number,
  accessToken: string
): Promise<IonPreflightResult> {
  const warning = getTokenFormatWarning(accessToken);
  const endpointUrl = `${CESIUM_ION_API_BASE_URL}/assets/${assetId}/endpoint?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const response = await fetch(endpointUrl, {
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      return { ok: true, warning };
    }

    const responseText = await response.text();
    const message = responseText.slice(0, 240) || response.statusText;

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        state: 'token-rejected',
        message: `Cesium Ion rejected the access token for asset ${assetId} (${response.status}). ${message}`,
      };
    }

    return {
      ok: false,
      state: 'asset-access-error',
      message: `Cesium Ion could not provide an endpoint for asset ${assetId} (${response.status}). ${message}`,
    };
  } catch (error) {
    return {
      ok: false,
      state: 'asset-access-error',
      message: `Could not reach the Cesium Ion endpoint check: ${String(error)}`,
    };
  }
}

function getStateTitle(viewerState: ViewerState) {
  switch (viewerState) {
    case 'checking-token':
      return 'Checking Cesium token...';
    case 'loading-runtime':
      return 'Loading Cesium runtime...';
    case 'loading':
      return 'Loading Cesium model...';
    case 'missing-token':
      return 'Cesium token is not configured';
    case 'token-rejected':
      return 'Cesium token was rejected';
    case 'asset-access-error':
      return 'Cesium asset is not accessible';
    case 'runtime-error':
      return 'Cesium runtime failed to load';
    case 'error':
      return 'Cesium model failed to load';
    case 'ready':
      return '';
  }
}

function getDefaultStateMessage(viewerState: ViewerState) {
  switch (viewerState) {
    case 'checking-token':
      return 'Verifying that the token can access the configured Cesium Ion asset.';
    case 'loading-runtime':
      return 'Loading CesiumJS from the official Cesium CDN.';
    case 'loading':
      return 'Fetching terrain and the Ion 3D Tiles asset.';
    case 'missing-token':
      return 'Set NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN in the deployment environment and redeploy.';
    case 'token-rejected':
      return 'Check that the token is complete, enabled, allowed for this domain, and allowed to access this asset and Cesium World Terrain.';
    case 'asset-access-error':
      return 'Check the asset ID, token asset permissions, network access, and browser console details.';
    case 'runtime-error':
      return 'Check whether the browser or deployment policy is blocking cesium.com script or CSS resources.';
    case 'error':
      return 'Check the Cesium Ion token, asset permissions, Cesium CDN access, and network access.';
    case 'ready':
      return '';
  }
}

export function CesiumIonViewer({ assetId }: CesiumIonViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>('checking-token');
  const [stateMessage, setStateMessage] = useState<string>();

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) {
      return;
    }

    const accessToken = process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN?.trim();

    if (!accessToken) {
      setViewerState('missing-token');
      setStateMessage(undefined);
      return;
    }

    const cesiumAccessToken = accessToken;
    let isMounted = true;

    async function initializeViewer() {
      setViewerState('checking-token');
      setStateMessage(undefined);

      const preflight = await preflightIonAsset(assetId, cesiumAccessToken);

      if (!isMounted) {
        return;
      }

      if (!preflight.ok) {
        setViewerState(preflight.state);
        setStateMessage(preflight.message);
        return;
      }

      if (preflight.warning) {
        console.warn(preflight.warning);
      }

      setViewerState('loading-runtime');
      setStateMessage(preflight.warning);

      try {
        window.CESIUM_BASE_URL = CESIUM_BASE_URL;
        ensureCesiumStylesheet();
        const Cesium = await loadCesiumRuntime();

        if (!isMounted) {
          return;
        }

        setViewerState('loading');
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

        if (isMounted) {
          setViewerState('ready');
        }

        void viewer.zoomTo(tileset).catch((error: unknown) => {
          console.warn('Cesium zoomTo failed after tileset load', error);
        });
      } catch (error) {
        console.error('Failed to initialize Cesium digital twin viewer', error);
        if (isMounted) {
          setViewerState(getCesium() ? 'error' : 'runtime-error');
          setStateMessage(String(error));
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
                {getStateTitle(viewerState)}
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                {stateMessage ?? getDefaultStateMessage(viewerState)}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
