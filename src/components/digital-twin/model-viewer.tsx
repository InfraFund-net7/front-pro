'use client';

// cspell:words drei GLTF gltf
import {
  Bounds,
  Environment,
  Html,
  OrbitControls,
  useBounds,
  useGLTF,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Box3, Vector3, type Mesh, type Object3D } from 'three';
import type { ConstructionMilestone } from '@/lib/digital-twin-projects';

type DigitalTwinModelViewerProps = {
  modelUrl: string;
  statusLabel: string;
  milestones?: ConstructionMilestone[];
};

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
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

function Model({
  modelUrl,
  statusLabel,
  milestones = [],
}: {
  modelUrl: string;
  statusLabel: string;
  milestones?: ConstructionMilestone[];
}) {
  const gltf = useGLTF(modelUrl);
  const bounds = useBounds();
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

    bounds.refresh(gltf.scene).fit();
  }, [bounds, enabledNames, gltf.scene, isOperational]);

  return <primitive object={gltf.scene} position={modelOffset} />;
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
}: DigitalTwinModelViewerProps) {
  const [showGroundPlane, setShowGroundPlane] = useState(true);
  const [showKeyLight, setShowKeyLight] = useState(true);

  return (
    <section className="overflow-hidden rounded-[28px] border border-card-border bg-card-bg shadow-2xl backdrop-blur-xl">
      <div
        className={`relative h-[520px] ${showGroundPlane ? 'bg-[#6f6f6f]' : 'bg-[#808080]'}`}
      >
        <div className="absolute right-4 top-4 z-10 flex flex-col gap-2 rounded-2xl border border-white/20 bg-[#0C0C0D]/75 p-3 text-xs text-gray-200 shadow-xl backdrop-blur-xl">
          <label className="flex items-center justify-between gap-3">
            <span>Ground</span>
            <input
              type="checkbox"
              checked={showGroundPlane}
              onChange={(event) => setShowGroundPlane(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>Light</span>
            <input
              type="checkbox"
              checked={showKeyLight}
              onChange={(event) => setShowKeyLight(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </label>
        </div>

        <Canvas
          camera={{ position: [5, 4, 8], fov: 45 }}
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
                  statusLabel={statusLabel}
                  milestones={milestones}
                />
              </group>
            </Bounds>
          </Suspense>
          <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
        </Canvas>
      </div>
    </section>
  );
}
