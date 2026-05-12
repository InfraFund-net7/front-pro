'use client';

// cspell:words drei GLTF gltf
import {
  Bounds,
  Center,
  Html,
  OrbitControls,
  useGLTF,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

type DigitalTwinModelViewerProps = {
  modelUrl: string;
  title: string;
};

function Model({ modelUrl }: { modelUrl: string }) {
  const gltf = useGLTF(modelUrl);

  return (
    <Center>
      <primitive object={gltf.scene} />
    </Center>
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
  title,
}: DigitalTwinModelViewerProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-card-border bg-card-bg shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-1 border-b border-card-border px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary">
            AI-Digital Twin
          </p>
          <h1 className="chakra-petch mt-2 text-3xl font-bold text-white md:text-4xl">
            {title}
          </h1>
        </div>
      </div>

      <div className="h-[520px] bg-[radial-gradient(circle_at_50%_25%,rgba(36,255,142,0.16),transparent_32%),linear-gradient(180deg,rgba(21,30,47,0.75),rgba(12,12,13,0.95))]">
        <Canvas camera={{ position: [5, 4, 8], fov: 45 }} shadows>
          <color attach="background" args={['#0C0C0D']} />
          <ambientLight intensity={1.4} />
          <directionalLight position={[5, 8, 6]} intensity={2.6} castShadow />
          <pointLight position={[-5, 4, -5]} intensity={1.2} color="#24FF8E" />
          <Suspense fallback={<LoadingModel />}>
            <Bounds fit clip observe margin={1.35}>
              <Model modelUrl={modelUrl} />
            </Bounds>
          </Suspense>
          <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
        </Canvas>
      </div>
    </section>
  );
}
