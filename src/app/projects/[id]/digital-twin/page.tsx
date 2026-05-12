import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DigitalTwinModelViewer } from '@/components/digital-twin/model-viewer';
import { MilestoneChecklist } from '@/components/digital-twin/milestone-checklist';
import { getDigitalTwinProject } from '@/lib/digital-twin-projects';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DigitalTwinPage({ params }: PageProps) {
  const { id } = await params;
  const project = getDigitalTwinProject(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/home"
            className="text-sm text-gray-400 transition hover:text-primary"
          >
            ← Back to developer dashboard
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-primary/40 bg-primary-selected px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Project ID {project.id}
            </span>
            <span className="rounded-full border border-card-border bg-[#0C0C0D]/60 px-3 py-1 text-xs text-gray-200">
              {project.statusLabel}
            </span>
            <span className="rounded-full border border-card-border bg-[#0C0C0D]/60 px-3 py-1 text-xs uppercase text-gray-300">
              {project.modelFormat}
            </span>
          </div>
        </div>
      </div>

      <DigitalTwinModelViewer
        modelUrl={project.modelUrl}
        title={project.title}
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

      {project.mode === 'construction' && project.milestones ? (
        <MilestoneChecklist milestones={project.milestones} />
      ) : null}
    </div>
  );
}
