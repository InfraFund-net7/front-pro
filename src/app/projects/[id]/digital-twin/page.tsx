import { notFound } from 'next/navigation';
import { DigitalTwinClientPage } from '@/components/digital-twin/client-page';
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

  const isOperational = project.statusLabel === 'Operational';
  const projectStatusLabel = isOperational ? 'Operational' : 'Construction';
  const projectStatusClassName = isOperational
    ? 'border-primary/40 bg-primary-selected text-primary'
    : 'border-info/40 bg-info/10 text-info';

  return (
    <div className="flex flex-col gap-6 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-primary/40 bg-primary-selected px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Project ID {project.id}
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${projectStatusClassName}`}
        >
          {projectStatusLabel}
        </span>
        <span className="rounded-full border border-card-border bg-[#0C0C0D]/60 px-3 py-1 text-xs uppercase text-gray-300">
          {project.modelFormat}
        </span>
      </div>

      <DigitalTwinClientPage project={project} />
    </div>
  );
}
