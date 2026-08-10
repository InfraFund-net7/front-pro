export {};

// cspell:words tileset

type CesiumCartesian2 = { x: number; y: number };

export type Cesium3DTileFeature = {
  getPropertyIds: () => string[];
  getProperty: (name: string) => unknown;
};

type Cesium3DTileset = {
  style: Cesium3DTileStyle | undefined;
};

type Cesium3DTileStyleOptions = {
  color?: { conditions: Array<[string, string]> };
  show?: { conditions: Array<[string, string]> };
};

type Cesium3DTileStyle = Cesium3DTileStyleOptions;

type ScreenSpaceEventHandler = {
  setInputAction: (
    callback: (movement: { position: CesiumCartesian2 }) => void,
    type: number
  ) => void;
  destroy: () => void;
};

type CesiumScene = {
  primitives: {
    add: <T>(primitive: T) => T;
  };
  pick: (position: CesiumCartesian2) => unknown;
};

type CesiumViewer = {
  scene: CesiumScene;
  screenSpaceEventHandler: ScreenSpaceEventHandler;
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
  Cesium3DTileset: {
    fromIonAssetId: (assetId: number) => Promise<Cesium3DTileset>;
  };
  Cesium3DTileStyle: new (
    options: Cesium3DTileStyleOptions
  ) => Cesium3DTileStyle;
  ScreenSpaceEventType: { LEFT_CLICK: number };
};

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
    Cesium?: CesiumNamespace;
  }
}
