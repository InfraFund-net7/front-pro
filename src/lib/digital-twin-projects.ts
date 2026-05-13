// cspell:words gltf fitout

type DigitalTwinProjectMode = 'operational' | 'construction';

type EnergyMetric = {
  label: string;
  value: string;
  helper: string;
};

type MilestoneComponentRef = {
  externalId: string;
  displayName: string;
  nodeNames: string[];
  visibleWhenCompleted?: boolean;
};

export type ConstructionMilestone = {
  id: string;
  label: string;
  completed: boolean;
  components: MilestoneComponentRef[];
};

type DigitalTwinComponentConfig = {
  externalId: string;
  displayName: string;
  nodeNames: string[];
  defaultVisible: boolean;
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
  components?: DigitalTwinComponentConfig[];
};

const windTurbineComponents: DigitalTwinComponentConfig[] = [
  {
    externalId: 'wind_turbine_T01_nacelle_hub',
    displayName: 'Nacelle and hub',
    nodeNames: ['wind_turbine_T01_nacelle_hub'],
    defaultVisible: false,
  },
  {
    externalId: 'wind_turbine_T01_tower',
    displayName: 'Tower',
    nodeNames: ['wind_turbine_T01_tower'],
    defaultVisible: false,
  },
  {
    externalId: 'wind_turbine_T01_access_platform',
    displayName: 'Access platform',
    nodeNames: ['wind_turbine_T01_access_platform'],
    defaultVisible: false,
  },
  {
    externalId: 'wind_turbine_T01_blade_01',
    displayName: 'Blade 01',
    nodeNames: ['wind_turbine_T01_blade_01'],
    defaultVisible: false,
  },
  {
    externalId: 'wind_turbine_T01_blade_02',
    displayName: 'Blade 02',
    nodeNames: ['wind_turbine_T01_blade_02'],
    defaultVisible: false,
  },
  {
    externalId: 'wind_turbine_T01_blade_03',
    displayName: 'Blade 03',
    nodeNames: ['wind_turbine_T01_blade_03'],
    defaultVisible: false,
  },
];

const digitalTwinProjects: Record<string, DigitalTwinProject> = {
  '1': {
    id: '1',
    title: 'Cornwall Wind turbine Pilot #1',
    statusLabel: 'Operational',
    mode: 'operational',
    modelUrl: '/models/digital-twin/wind-turbine/Wind_Turbine 3.gltf',
    modelFormat: 'gltf',
    modelNotes:
      'Uses the component-ready Wind_Turbine 3.gltf asset with its paired Wind_Turbine 3.bin file.',
    components: windTurbineComponents,
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
    modelUrl: '/models/digital-twin/wind-turbine/Wind_Turbine 3.gltf',
    modelFormat: 'gltf',
    modelNotes:
      'Uses the component-ready Wind_Turbine 3.gltf asset with its paired Wind_Turbine 3.bin file for construction-stage status mapping.',
    components: windTurbineComponents,
    milestones: [
      {
        id: 'tower-install',
        label: 'tower install',
        completed: false,
        components: [
          {
            externalId: 'wind_turbine_T01_tower',
            displayName: 'Tower',
            nodeNames: ['wind_turbine_T01_tower'],
          },
        ],
      },
      {
        id: 'platform-install',
        label: 'access platform install',
        completed: false,
        components: [
          {
            externalId: 'wind_turbine_T01_access_platform',
            displayName: 'Access platform',
            nodeNames: ['wind_turbine_T01_access_platform'],
          },
        ],
      },
      {
        id: 'nacelle-hub-mount',
        label: 'nacelle and hub mount',
        completed: false,
        components: [
          {
            externalId: 'wind_turbine_T01_nacelle_hub',
            displayName: 'Nacelle and hub',
            nodeNames: ['wind_turbine_T01_nacelle_hub'],
          },
        ],
      },
      {
        id: 'blade-01-fitout',
        label: 'blade 01 fitout',
        completed: false,
        components: [
          {
            externalId: 'wind_turbine_T01_blade_01',
            displayName: 'Blade 01',
            nodeNames: ['wind_turbine_T01_blade_01'],
          },
        ],
      },
      {
        id: 'blade-02-fitout',
        label: 'blade 02 fitout',
        completed: false,
        components: [
          {
            externalId: 'wind_turbine_T01_blade_02',
            displayName: 'Blade 02',
            nodeNames: ['wind_turbine_T01_blade_02'],
          },
        ],
      },
      {
        id: 'blade-03-fitout',
        label: 'blade 03 fitout',
        completed: false,
        components: [
          {
            externalId: 'wind_turbine_T01_blade_03',
            displayName: 'Blade 03',
            nodeNames: ['wind_turbine_T01_blade_03'],
          },
        ],
      },
    ],
  },
  '3': {
    id: '3',
    title: 'Cornwall Wind turbine Pilot #3',
    statusLabel: 'Construction Test',
    mode: 'construction',
    modelUrl: '/models/digital-twin/wind-turbine/Wind_Turbine 3.gltf',
    modelFormat: 'gltf',
    modelNotes:
      'Hardwired test page: milestones map directly to Wind_Turbine 3.gltf stable component IDs and toggle their visibility in the viewer.',
    components: windTurbineComponents,
    milestones: [
      {
        id: 'tower-install',
        label: 'tower install',
        completed: false,
        components: [
          {
            externalId: 'wind_turbine_T01_tower',
            displayName: 'Tower',
            nodeNames: ['wind_turbine_T01_tower'],
          },
        ],
      },
      {
        id: 'platform-install',
        label: 'access platform install',
        completed: false,
        components: [
          {
            externalId: 'wind_turbine_T01_access_platform',
            displayName: 'Access platform',
            nodeNames: ['wind_turbine_T01_access_platform'],
          },
        ],
      },
      {
        id: 'nacelle-hub-mount',
        label: 'nacelle and hub mount',
        completed: false,
        components: [
          {
            externalId: 'wind_turbine_T01_nacelle_hub',
            displayName: 'Nacelle and hub',
            nodeNames: ['wind_turbine_T01_nacelle_hub'],
          },
        ],
      },
      {
        id: 'blade-01-fitout',
        label: 'blade 01 fitout',
        completed: false,
        components: [
          {
            externalId: 'wind_turbine_T01_blade_01',
            displayName: 'Blade 01',
            nodeNames: ['wind_turbine_T01_blade_01'],
          },
        ],
      },
      {
        id: 'blade-02-fitout',
        label: 'blade 02 fitout',
        completed: false,
        components: [
          {
            externalId: 'wind_turbine_T01_blade_02',
            displayName: 'Blade 02',
            nodeNames: ['wind_turbine_T01_blade_02'],
          },
        ],
      },
      {
        id: 'blade-03-fitout',
        label: 'blade 03 fitout',
        completed: false,
        components: [
          {
            externalId: 'wind_turbine_T01_blade_03',
            displayName: 'Blade 03',
            nodeNames: ['wind_turbine_T01_blade_03'],
          },
        ],
      },
    ],
  },
};

export function getDigitalTwinProject(id: string) {
  return digitalTwinProjects[id];
}
