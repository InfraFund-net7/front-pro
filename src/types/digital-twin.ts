// cspell:words gltf

export type DigitalTwinComponentStatus =
  | 'not_started'
  | 'in_progress'
  | 'installed'
  | 'delayed'
  | 'blocked';

export const STATUS_COLORS: Record<DigitalTwinComponentStatus, string> = {
  not_started: '#8A8A8A',
  in_progress: '#3B82F6',
  installed: '#24FF8E',
  delayed: '#F59E0B',
  blocked: '#EF4444',
};

export const STATUS_LABELS: Record<DigitalTwinComponentStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  installed: 'Installed',
  delayed: 'Delayed',
  blocked: 'Blocked',
};

export type DigitalTwinComponentView = {
  id: string;
  externalId: string;
  displayName: string;
  category: string;
  /** glTF node name / Cesium feature ID property this component maps to, when known. */
  nodeName: string | null;
  status: DigitalTwinComponentStatus;
  color: string;
  isVisible: boolean;
  metadata: Record<string, unknown> | null;
};

export type DigitalTwinMilestoneView = {
  id: string;
  name: string;
  cost: string | null;
  endDate: string | null;
  sortOrder: number;
  componentIds: string[];
};

type DigitalTwinRenderer = 'gltf' | 'cesium-3d-tiles';

type EnergyMetric = {
  label: string;
  value: string;
  helper: string;
};

type DigitalTwinModelView = {
  id: string;
  name: string;
  assetUrl: string;
  format: string;
  renderer: DigitalTwinRenderer;
  cesiumIonAssetId: number | null;
  metadata: Record<string, unknown> | null;
  /** Sourced from metadata.energyMetrics, when present and well-formed. */
  energyMetrics: EnergyMetric[];
  components: DigitalTwinComponentView[];
};

export type DigitalTwinView = {
  projectId: string;
  projectName: string;
  model: DigitalTwinModelView;
  milestones: DigitalTwinMilestoneView[];
};

export type SelectedComponentMetadata = {
  title: string;
  entries: Array<[key: string, value: string]>;
} | null;

export type DigitalTwinCapabilities = {
  groundPlane: boolean;
  keyLight: boolean;
};

export function resolveRenderer(format: string): DigitalTwinRenderer {
  return format === '3d-tiles' ? 'cesium-3d-tiles' : 'gltf';
}
