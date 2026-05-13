import Link from 'next/link';
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

      <DigitalTwinClientPage project={project} />
    </div>
  );
}
