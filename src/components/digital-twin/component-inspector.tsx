import type { Dispatch, SetStateAction } from 'react';
import type {
  MetadataRecord,
  MetadataValue,
} from '@/lib/digital-twin-projects';

type ComponentInspectorProps = {
  metadata: MetadataRecord | null;
  showGroundPlane: boolean;
  setShowGroundPlane: Dispatch<SetStateAction<boolean>>;
  showKeyLight: boolean;
  setShowKeyLight: Dispatch<SetStateAction<boolean>>;
};

function formatMetadataValue(value: MetadataValue) {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function getTitle(metadata: MetadataRecord | null) {
  if (!metadata) {
    return 'Component metadata';
  }

  const title = metadata.displayName ?? metadata.name ?? metadata.externalId;

  return typeof title === 'string' && title.length > 0
    ? title
    : 'Component metadata';
}

export function ComponentInspector({
  metadata,
  showGroundPlane,
  setShowGroundPlane,
  showKeyLight,
  setShowKeyLight,
}: ComponentInspectorProps) {
  const entries = metadata ? Object.entries(metadata) : [];

  return (
    <aside className="flex max-h-[520px] min-h-[260px] flex-col gap-3 border-t border-card-border bg-[#0C0C0D]/70 p-3 backdrop-blur-xl xl:min-h-[520px] xl:border-l xl:border-t-0">
      <div className="rounded-2xl border border-white/15 bg-[#151E2F80] p-3">
        <p className="chakra-petch text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">
          View controls
        </p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-gray-200">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={showGroundPlane}
              onChange={(event) => setShowGroundPlane(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span>Ground</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={showKeyLight}
              onChange={(event) => setShowKeyLight(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span>Light</span>
          </label>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/15 bg-[#151E2F80] p-3">
        <p className="chakra-petch text-base font-semibold text-white">
          {getTitle(metadata)}
        </p>

        {entries.length > 0 ? (
          <dl className="mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1 [scrollbar-color:#24FF8E33_#0C0C0D] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/25 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#0C0C0D] [&::-webkit-scrollbar]:w-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="grid grid-cols-[minmax(88px,38%)_1fr] gap-2 rounded-lg bg-[#0C0C0D]/55 px-2 py-1.5"
              >
                <dt className="truncate text-xs uppercase tracking-[0.08em] text-gray-500">
                  {key}
                </dt>
                <dd
                  className="truncate font-mono text-xs leading-4 text-gray-200"
                  title={formatMetadataValue(value)}
                >
                  {formatMetadataValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-3 flex flex-1 items-center rounded-xl border border-dashed border-white/15 p-3 text-sm leading-6 text-gray-400">
            Click a component to inspect its metadata. Any available name-value
            pairs from the loaded model will appear here.
          </div>
        )}
      </div>
    </aside>
  );
}
