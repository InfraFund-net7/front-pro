'use client';

// cspell:words drei GLTF gltf
import {
  Bounds,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from '@react-three/drei';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box3,
  Color,
  Vector3,
  type Material,
  type Mesh,
  type Object3D,
} from 'three';
import { DigitalTwinViewerLayout } from '@/components/digital-twin/viewer-layout';
import {
  STATUS_LABELS,
  type DigitalTwinComponentView,
  type SelectedComponentMetadata,
} from '@/types/digital-twin';

type DigitalTwinModelViewerProps = {
  modelUrl: string;
  components: DigitalTwinComponentView[];
};

type MetadataPrimitive = string | number | boolean | null;
type MetadataValue =
  | MetadataPrimitive
  | MetadataValue[]
  | { [key: string]: MetadataValue };
type RawMetadataRecord = Record<string, MetadataValue>;

type GltfCatalogElement = RawMetadataRecord & {
  externalId?: MetadataValue;
  id?: MetadataValue;
  name?: MetadataValue;
  modelNodeName?: MetadataValue;
};

type OrbitControlsLike = {
  target: Vector3;
  update: () => void;
};

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

function isOrbitControlsLike(value: unknown): value is OrbitControlsLike {
  return (
    value !== null &&
    typeof value === 'object' &&
    'target' in value &&
    'update' in value
  );
}

function isMetadataRecord(value: unknown): value is RawMetadataRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asMetadataValue(value: unknown): MetadataValue | undefined {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map(asMetadataValue)
      .filter((item): item is MetadataValue => item !== undefined);
  }

  if (isMetadataRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, asMetadataValue(item)] as const)
        .filter(
          (entry): entry is readonly [string, MetadataValue] =>
            entry[1] !== undefined
        )
    );
  }

  return undefined;
}

function normalizeRecord(record: Record<string, unknown>): RawMetadataRecord {
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, value]) => [key, asMetadataValue(value)] as const)
      .filter(
        (entry): entry is readonly [string, MetadataValue] =>
          entry[1] !== undefined
      )
  );
}

function formatMetadataValue(value: MetadataValue) {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function toEntries(record: RawMetadataRecord): Array<[string, string]> {
  return Object.entries(record).map(([key, value]) => [
    key,
    formatMetadataValue(value),
  ]);
}

function getStringValue(record: RawMetadataRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

function buildComponentRecord(component: DigitalTwinComponentView) {
  const base = normalizeRecord({
    externalId: component.externalId,
    displayName: component.displayName,
    category: component.category,
    nodeName: component.nodeName,
    status: STATUS_LABELS[component.status],
  });
  const extra = component.metadata ? normalizeRecord(component.metadata) : {};

  return { ...base, ...extra };
}

function findCatalogMatch(
  catalog: GltfCatalogElement[],
  identityValues: Set<string>
) {
  return catalog.find((element) => {
    const candidates = [
      element.externalId,
      element.id,
      element.name,
      element.modelNodeName,
    ];

    return candidates.some(
      (candidate) =>
        typeof candidate === 'string' && identityValues.has(candidate)
    );
  });
}

function findMatchingComponent(
  components: DigitalTwinComponentView[],
  identityValues: Set<string>
) {
  return components.find(
    (component) =>
      identityValues.has(component.externalId) ||
      (component.nodeName ? identityValues.has(component.nodeName) : false) ||
      identityValues.has(component.displayName)
  );
}

function collectMetadata(
  object: Object3D,
  components: DigitalTwinComponentView[],
  catalog: GltfCatalogElement[]
): SelectedComponentMetadata {
  const metadata: RawMetadataRecord = {};
  const identityValues = new Set<string>();
  let current: Object3D | null = object;
  let depth = 0;

  while (current) {
    if (current.name) {
      const key = depth === 0 ? 'name' : `parent_${depth}_name`;
      metadata[key] = current.name;
      identityValues.add(current.name);
    }

    metadata[depth === 0 ? 'type' : `parent_${depth}_type`] = current.type;

    const userData = normalizeRecord(current.userData);
    Object.assign(metadata, userData);

    const externalId = getStringValue(userData, [
      'externalId',
      'id',
      'name',
      'displayName',
      'modelNodeName',
    ]);

    if (externalId) {
      identityValues.add(externalId);
    }

    current = current.parent;
    depth += 1;
  }

  const component = findMatchingComponent(components, identityValues);
  let title: string | undefined;

  if (component) {
    Object.assign(metadata, buildComponentRecord(component));
    title = component.displayName;
  } else {
    const catalogMatch = findCatalogMatch(catalog, identityValues);

    if (catalogMatch) {
      Object.assign(metadata, catalogMatch);
      title = getStringValue(metadata, ['displayName', 'name', 'externalId']);
    }
  }

  return {
    title:
      title ??
      getStringValue(metadata, ['displayName', 'name', 'externalId']) ??
      'Component metadata',
    entries: toEntries(metadata),
  };
}

function buildNodeLookup(components: DigitalTwinComponentView[]) {
  const lookup = new Map<string, DigitalTwinComponentView>();

  components.forEach((component) => {
    if (component.nodeName) {
      lookup.set(component.nodeName, component);
    }

    lookup.set(component.externalId, component);
  });

  return lookup;
}

function findComponentForObject(
  object: Object3D,
  lookup: Map<string, DigitalTwinComponentView>
) {
  let current: Object3D | null = object;

  while (current) {
    const match = lookup.get(current.name);

    if (match) {
      return match;
    }

    current = current.parent;
  }

  return undefined;
}

function applyMeshColor(material: Material | Material[], color: string) {
  const materials = Array.isArray(material) ? material : [material];

  materials.forEach((item) => {
    if ('color' in item && item.color instanceof Color) {
      item.color.set(color);
    }
  });
}

function Model({
  modelUrl,
  components,
  onSelectMetadata,
}: {
  modelUrl: string;
  components: DigitalTwinComponentView[];
  onSelectMetadata: (metadata: SelectedComponentMetadata) => void;
}) {
  const gltf = useGLTF(modelUrl);
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  const clonedMaterials = useRef(new Map<string, Material | Material[]>());
  const nodeLookup = useMemo(() => buildNodeLookup(components), [components]);
  const modelOffset = useMemo(() => {
    const box = new Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new Vector3());

    return new Vector3(-center.x, -box.min.y, -center.z);
  }, [gltf.scene]);
  const catalog = useMemo(() => {
    const elements = gltf.parser.json.extras?.elements;

    return Array.isArray(elements)
      ? elements
          .filter(isMetadataRecord)
          .map((element) => normalizeRecord(element) as GltfCatalogElement)
      : [];
  }, [gltf.parser.json.extras?.elements]);

  useEffect(() => {
    gltf.scene.traverse((object) => {
      if (!isMesh(object)) {
        object.visible = true;
        return;
      }

      const matched = findComponentForObject(object, nodeLookup);

      if (!matched) {
        object.visible = true;
        object.castShadow = true;
        object.receiveShadow = true;
        return;
      }

      object.visible = matched.isVisible;
      object.castShadow = matched.isVisible;
      object.receiveShadow = matched.isVisible;

      if (!clonedMaterials.current.has(object.uuid)) {
        const cloned = Array.isArray(object.material)
          ? object.material.map((material) => material.clone())
          : object.material.clone();

        clonedMaterials.current.set(object.uuid, cloned);
        object.material = cloned;
      }

      applyMeshColor(object.material, matched.color);
    });
  }, [gltf.scene, nodeLookup]);

  useEffect(() => {
    const box = new Box3().setFromObject(gltf.scene);
    const size = box.getSize(new Vector3());
    const height = Math.max(size.y, 1);
    const distance = Math.max(size.x, size.y, size.z, 1) * 0.9;
    const target = new Vector3(0, height * 0.45, 0);

    camera.position.set(distance, height * 0.65, distance);

    if (isOrbitControlsLike(controls)) {
      controls.target.copy(target);
      controls.update();
    } else {
      camera.lookAt(target);
    }

    camera.updateProjectionMatrix();
  }, [camera, controls, gltf.scene]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelectMetadata(collectMetadata(event.object, components, catalog));
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
  };

  return (
    <primitive
      object={gltf.scene}
      position={modelOffset}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
}

function LoadingModel() {
  return (
    <Html center>
      <div className="rounded-full border border-card-border bg-[#0C0C0D]/90 px-4 py-2 text-sm text-gray-200 shadow-xl">
        Loading 3D model…
      </div>
    </Html>
  );
}

export function DigitalTwinModelViewer({
  modelUrl,
  components,
}: DigitalTwinModelViewerProps) {
  const [showGroundPlane, setShowGroundPlane] = useState(true);
  const [showKeyLight, setShowKeyLight] = useState(true);
  const [selectedMetadata, setSelectedMetadata] =
    useState<SelectedComponentMetadata>(null);

  return (
    <DigitalTwinViewerLayout
      metadata={selectedMetadata}
      capabilities={{ groundPlane: true, keyLight: true }}
      showGroundPlane={showGroundPlane}
      setShowGroundPlane={setShowGroundPlane}
      showKeyLight={showKeyLight}
      setShowKeyLight={setShowKeyLight}
      viewportClassName={showGroundPlane ? 'bg-[#6f6f6f]' : 'bg-[#808080]'}
    >
      <Canvas
        camera={{ position: [10, 12, 10], fov: 45 }}
        shadows
        gl={{ antialias: true }}
      >
        <color
          attach="background"
          args={[showGroundPlane ? '#6f6f6f' : '#808080']}
        />
        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#f7f7f7', '#2c2c2c', 0.85]} />
        {showKeyLight ? (
          <directionalLight
            position={[45, 90, 45]}
            intensity={4.8}
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-near={1}
            shadow-camera-far={180}
            shadow-camera-left={-90}
            shadow-camera-right={90}
            shadow-camera-top={90}
            shadow-camera-bottom={-90}
            shadow-bias={-0.0002}
            shadow-normalBias={0.08}
          />
        ) : null}
        <Environment preset="city" environmentIntensity={0.35} />
        <Suspense fallback={<LoadingModel />}>
          <Bounds clip margin={1.35}>
            <group>
              {showGroundPlane ? (
                <group position={[0, 0, 0]}>
                  <gridHelper args={[76, 38, '#d8d8d8', '#a8a8a8']} />
                  <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -0.01, 0]}
                    receiveShadow
                  >
                    <planeGeometry args={[76, 76]} />
                    <meshStandardMaterial color="#505050" roughness={0.95} />
                  </mesh>
                </group>
              ) : null}
              <Model
                modelUrl={modelUrl}
                components={components}
                onSelectMetadata={setSelectedMetadata}
              />
            </group>
          </Bounds>
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>
    </DigitalTwinViewerLayout>
  );
}
