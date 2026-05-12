// cspell:words gltf
type DigitalTwinProjectMode = 'operational' | 'construction';

type EnergyMetric = {
  label: string;
  value: string;
  helper: string;
};

export type ConstructionMilestone = {
  id: string;
  label: string;
  completed: boolean;
};

type DigitalTwinProject = {
  id: string;
  title: string;
  statusLabel: string;
  mode: DigitalTwinProjectMode;
  modelUrl: string;
  modelFormat: 'glb' | 'gltf';
  modelNotes: string;
  energyMetrics?: EnergyMetric[];
  milestones?: ConstructionMilestone[];
};

// TODO: replace hardwired digital twin project config with database-backed project/model records.
const digitalTwinProjects: Record<string, DigitalTwinProject> = {
  '1': {
    id: '1',
    title: 'Cornwall Wind turbine Pilot #1',
    statusLabel: 'Operational',
    mode: 'operational',
    modelUrl: '/models/digital-twin/wind-turbine/Wind-turbine.glb',
    modelFormat: 'glb',
    modelNotes:
      'This GLB is suitable for MVP rendering, but currently appears to be one merged mesh without stable per-element IDs.',
    // TODO: replace generated operational metrics with database-backed sensor readings.
    energyMetrics: [
      { label: 'Past day', value: '8.4 MWh', helper: '+6.2% vs previous day' },
      { label: 'Past week', value: '57.8 MWh', helper: '92% availability' },
      {
        label: 'Current month',
        value: '214.6 MWh',
        helper: 'On track for target',
      },
      { label: 'Past month', value: '248.2 MWh', helper: 'Peak output 1.8 MW' },
    ],
  },
  '2': {
    id: '2',
    title: 'Cornwall Wind turbine Pilot #2',
    statusLabel: 'Construction',
    mode: 'construction',
    modelUrl: '/models/digital-twin/wind-turbine/Wind_Turbine 2.gltf',
    modelFormat: 'gltf',
    modelNotes:
      'This glTF has multiple nodes and meshes, but names are generic or duplicated and need stable provider IDs before robust status mapping.',
    // TODO: replace local milestone state with persisted construction status data.
    milestones: [
      {
        id: 'concrete-foundation',
        label: 'concrete foundation',
        completed: true,
      },
      {
        id: 'tower-lower-sections',
        label: 'tower lower sections',
        completed: true,
      },
      {
        id: 'tower-higher-section',
        label: 'tower higher section',
        completed: false,
      },
      { id: 'generator', label: 'generator', completed: false },
      { id: 'blade-1', label: 'blade 1', completed: false },
      { id: 'blade-2', label: 'blade 2', completed: false },
      { id: 'blade-3', label: 'blade 3', completed: false },
    ],
  },
};

export function getDigitalTwinProject(id: string) {
  return digitalTwinProjects[id];
}
