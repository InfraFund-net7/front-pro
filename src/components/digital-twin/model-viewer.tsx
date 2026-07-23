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
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Box3, Vector3, type Mesh, type Object3D } from 'three';
import { ComponentInspector } from '@/components/digital-twin/component-inspector';
import type {
  ConstructionMilestone,
  DigitalTwinComponentConfig,
  MetadataRecord,
  MetadataValue,
} from '@/lib/digital-twin-projects';

type DigitalTwinModelViewerProps = {
  modelUrl: string;
  statusLabel: string;
  milestones?: ConstructionMilestone[];
  components?: DigitalTwinComponentConfig[];
};

type GltfCatalogElement = MetadataRecord & {
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

function buildEnabledNameSet(milestones: ConstructionMilestone[]) {
  const names = new Set<string>();

  milestones.forEach((milestone) => {
    if (!milestone.completed) {
      return;
    }

    milestone.components.forEach((component) => {
      component.nodeNames.forEach((nodeName) => names.add(nodeName));
    });
  });

  return names;
}

function hasEnabledName(object: Object3D, enabledNames: Set<string>) {
  let current: Object3D | null = object;

  while (current) {
    if (enabledNames.has(current.name)) {
      return true;
    }

    current = current.parent;
  }

  return false;
}

function isMetadataRecord(value: unknown): value is MetadataRecord {
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
    const values = value
      .map(asMetadataValue)
      .filter((item): item is MetadataValue => item !== undefined);

    return values;
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

function normalizeRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, value]) => [key, asMetadataValue(value)] as const)
      .filter(
        (entry): entry is readonly [string, MetadataValue] =>
          entry[1] !== undefined
      )
  );
}

function getStringValue(record: MetadataRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

function buildComponentRecord(component: DigitalTwinComponentConfig) {
  return normalizeRecord({
    externalId: component.externalId,
    displayName: component.displayName,
    nodeNames: component.nodeNames,
    defaultVisible: component.defaultVisible,
  });
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

function collectMetadata(
  object: Object3D,
  components: DigitalTwinComponentConfig[],
  catalog: GltfCatalogElement[]
) {
  const metadata: MetadataRecord = {};
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

  const component = components.find(
    (item) =>
      identityValues.has(item.externalId) ||
      identityValues.has(item.displayName) ||
      item.nodeNames.some((nodeName) => identityValues.has(nodeName))
  );

  if (component) {
    Object.assign(metadata, buildComponentRecord(component));
    identityValues.add(component.externalId);
    component.nodeNames.forEach((nodeName) => identityValues.add(nodeName));
  }

  const catalogMatch = findCatalogMatch(catalog, identityValues);

  if (catalogMatch) {
    Object.assign(metadata, catalogMatch);
  }

  return metadata;
}

function Model({
  modelUrl,
  statusLabel,
  milestones = [],
  components = [],
  onSelectMetadata,
}: {
  modelUrl: string;
  statusLabel: string;
  milestones?: ConstructionMilestone[];
  components?: DigitalTwinComponentConfig[];
  onSelectMetadata: (metadata: MetadataRecord) => void;
}) {
  const gltf = useGLTF(modelUrl);
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  const isOperational = statusLabel === 'Operational';
  const enabledNames = useMemo(
    () => buildEnabledNameSet(milestones),
    [milestones]
  );
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

      object.visible = isOperational || hasEnabledName(object, enabledNames);
      object.castShadow = object.visible;
      object.receiveShadow = object.visible;
    });

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
  }, [camera, controls, enabledNames, gltf.scene, isOperational]);

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
  statusLabel,
  milestones,
  components,
}: DigitalTwinModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showGroundPlane, setShowGroundPlane] = useState(true);
  const [showKeyLight, setShowKeyLight] = useState(true);
  const [selectedMetadata, setSelectedMetadata] =
    useState<MetadataRecord | null>(null);
  const [inspectorWidth, setInspectorWidth] = useState(34);

  const handleResizeStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const startX = event.clientX;
    const startWidth = inspectorWidth;
    const containerWidth = container.getBoundingClientRect().width;

    const handleResize = (pointerEvent: PointerEvent) => {
      const deltaPercent =
        ((startX - pointerEvent.clientX) / containerWidth) * 100;
      const nextWidth = startWidth + deltaPercent;

      setInspectorWidth(Math.min(50, Math.max(18, nextWidth)));
    };

    const handleResizeEnd = () => {
      document.body.style.cursor = 'default';
      window.removeEventListener('pointermove', handleResize);
      window.removeEventListener('pointerup', handleResizeEnd);
    };

    document.body.style.cursor = 'col-resize';
    window.addEventListener('pointermove', handleResize);
    window.addEventListener('pointerup', handleResizeEnd);
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-card-border bg-card-bg shadow-2xl backdrop-blur-xl">
      <div
        ref={containerRef}
        className="grid grid-cols-1 xl:grid-cols-[minmax(0,var(--viewer-width))_0.5rem_minmax(0,var(--inspector-width))]"
        style={
          {
            '--viewer-width': `${100 - inspectorWidth}%`,
            '--inspector-width': `${inspectorWidth}%`,
          } as CSSProperties
        }
      >
        <div
          className={`relative h-[520px] ${showGroundPlane ? 'bg-[#6f6f6f]' : 'bg-[#808080]'}`}
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
                        <meshStandardMaterial
                          color="#505050"
                          roughness={0.95}
                        />
                      </mesh>
                    </group>
                  ) : null}
                  <Model
                    modelUrl={modelUrl}
                    statusLabel={statusLabel}
                    milestones={milestones}
                    components={components}
                    onSelectMetadata={setSelectedMetadata}
                  />
                </group>
              </Bounds>
            </Suspense>
            <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
          </Canvas>
        </div>

        <button
          type="button"
          aria-label="Resize metadata panel"
          onPointerDown={handleResizeStart}
          className="hidden w-2 cursor-col-resize border-l border-r border-white/10 bg-[#0C0C0D]/60 transition hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:block"
        />

        <ComponentInspector
          metadata={selectedMetadata}
          showGroundPlane={showGroundPlane}
          setShowGroundPlane={setShowGroundPlane}
          showKeyLight={showKeyLight}
          setShowKeyLight={setShowKeyLight}
        />
      </div>
    </section>
  );
}
