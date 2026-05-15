// cspell:words gltf
export const HARDWIRED_PROJECT_MODEL = {
  name: 'Wind Turbine 1',
  assetUrl: '/models/digital-twin/wind-turbine/Wind_Turbine_1.gltf',
  format: 'gltf',
  source: 'hardcoded_wind_turbine',
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
} as const;
