'use client';

import { useEffect, useState } from 'react';
import { DigitalTwinModelViewer } from '@/components/digital-twin/model-viewer';
import { MilestoneChecklist } from '@/components/digital-twin/milestone-checklist';
import type { ConstructionMilestone } from '@/lib/digital-twin-projects';
import type { getDigitalTwinProject } from '@/lib/digital-twin-projects';

type DigitalTwinProject = NonNullable<ReturnType<typeof getDigitalTwinProject>>;

type DigitalTwinClientPageProps = {
  project: DigitalTwinProject;
};

export function DigitalTwinClientPage({ project }: DigitalTwinClientPageProps) {
  const [milestones, setMilestones] = useState<ConstructionMilestone[]>(
    project.milestones ?? []
  );

  useEffect(() => {
    setMilestones(project.milestones ?? []);
  }, [project]);

  return (
    <>
      <DigitalTwinModelViewer
        modelUrl={project.modelUrl}
        title={project.title}
        milestones={project.mode === 'construction' ? milestones : undefined}
      />

      {project.mode === 'operational' && project.energyMetrics ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {project.energyMetrics.map((metric) => (
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

      {project.mode === 'construction' && milestones.length > 0 ? (
        <MilestoneChecklist milestones={milestones} onChange={setMilestones} />
      ) : null}
    </>
  );
}
