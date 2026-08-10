'use client';

import { useEffect, useState } from 'react';
import { CesiumIonViewer } from '@/components/digital-twin/cesium-ion-viewer';
import { MilestoneChecklist } from '@/components/digital-twin/milestone-checklist';
import { DigitalTwinModelViewer } from '@/components/digital-twin/model-viewer';
import type { DigitalTwinView } from '@/types/digital-twin';

type DigitalTwinClientPageProps = {
  view: DigitalTwinView;
};

export function DigitalTwinClientPage({
  view: initialView,
}: DigitalTwinClientPageProps) {
  const [view, setView] = useState(initialView);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  return (
    <>
      {view.model.renderer === 'cesium-3d-tiles' &&
      view.model.cesiumIonAssetId ? (
        <CesiumIonViewer
          assetId={view.model.cesiumIonAssetId}
          components={view.model.components}
        />
      ) : (
        <DigitalTwinModelViewer
          modelUrl={view.model.assetUrl}
          components={view.model.components}
        />
      )}

      {view.model.energyMetrics.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {view.model.energyMetrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-[20px] border border-card-border bg-card-bg p-6 backdrop-blur-xl"
            >
              <p className="text-sm text-gray-400">{metric.label}</p>
              <p className="chakra-petch mt-3 text-3xl font-bold text-white">
                {metric.value}
              </p>
              <p className="mt-3 text-xs text-primary">{metric.helper}</p>
            </article>
          ))}
        </section>
      ) : null}

      {view.milestones.length > 0 ? (
        <MilestoneChecklist
          projectId={view.projectId}
          milestones={view.milestones}
          components={view.model.components}
          onUpdate={setView}
        />
      ) : null}
    </>
  );
}
