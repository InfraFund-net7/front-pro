import { notFound } from 'next/navigation';
import { DigitalTwinClientPage } from '@/components/digital-twin/client-page';
import { getDigitalTwinView } from '@/server/services/digital-twin';
import { isApiError } from '@/server/http';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DigitalTwinPage({ params }: PageProps) {
  const { id } = await params;
  const view = await getDigitalTwinView(id).catch((error: unknown) => {
    if (isApiError(error) && error.code === 'NOT_FOUND') {
      return null;
    }

    throw error;
  });

  if (!view) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-primary/40 bg-primary-selected px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {view.projectName}
        </span>
        <span className="rounded-full border border-card-border bg-[#0C0C0D]/60 px-3 py-1 text-xs uppercase text-gray-300">
          {view.model.format}
        </span>
      </div>

      <DigitalTwinClientPage view={view} />
    </div>
  );
}
