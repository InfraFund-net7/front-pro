export {};

type CesiumViewer = {
  scene: {
    primitives: {
      add: <T>(primitive: T) => T;
    };
  };
  destroy: () => void;
  zoomTo: (target: unknown) => Promise<boolean>;
};

type CesiumNamespace = {
  Ion: { defaultAccessToken: string };
  Terrain: { fromWorldTerrain: () => unknown };
  Viewer: new (
    container: Element,
    options: Record<string, unknown>
  ) => CesiumViewer;
  Cesium3DTileset: { fromIonAssetId: (assetId: number) => Promise<unknown> };
};

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
    Cesium?: CesiumNamespace;
  }
}
