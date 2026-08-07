'use client';

import { useMemo, useState } from 'react';
import { useAuthSession } from '@/components/auth/auth-session-provider';
import {
  ApiClientError,
  completeDigitalTwinMilestone,
} from '@/lib/backend-auth-client';
import type {
  DigitalTwinComponentView,
  DigitalTwinMilestoneView,
  DigitalTwinView,
} from '@/types/digital-twin';

type MilestoneChecklistProps = {
  projectId: string;
  milestones: DigitalTwinMilestoneView[];
  components: DigitalTwinComponentView[];
  onUpdate: (view: DigitalTwinView) => void;
};

function isMilestoneComplete(
  milestone: DigitalTwinMilestoneView,
  componentsById: Map<string, DigitalTwinComponentView>
) {
  if (milestone.componentIds.length === 0) {
    return false;
  }

  return milestone.componentIds.every(
    (componentId) => componentsById.get(componentId)?.status === 'installed'
  );
}

export function MilestoneChecklist({
  projectId,
  milestones,
  components,
  onUpdate,
}: MilestoneChecklistProps) {
  const { backendAccessToken, refreshSession } = useAuthSession();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const componentsById = useMemo(
    () => new Map(components.map((component) => [component.id, component])),
    [components]
  );
  const items = useMemo(
    () =>
      milestones.map((milestone) => ({
        ...milestone,
        completed: isMilestoneComplete(milestone, componentsById),
      })),
    [milestones, componentsById]
  );
  const completedCount = items.filter((item) => item.completed).length;
  const progress =
    items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const handleToggle = async (milestoneId: string, completed: boolean) => {
    setError(null);
    setPendingId(milestoneId);

    try {
      let accessToken = backendAccessToken;

      if (!accessToken) {
        accessToken = await refreshSession();
      }

      if (!accessToken) {
        setError('Please sign in again to update milestone status.');
        return;
      }

      const view = await completeDigitalTwinMilestone(
        accessToken,
        projectId,
        milestoneId,
        completed
      );

      onUpdate(view);
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiClientError
          ? caughtError.message
          : 'Failed to update milestone status.';

      setError(message);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="rounded-[24px] border border-card-border bg-card-bg p-4 backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex shrink-0 flex-col gap-2 xl:w-56">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="chakra-petch text-xl font-bold text-white">
              Construction Milestones
            </h2>
            <span className="text-xs text-primary">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#0C0C0D]">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-300">
            {completedCount} of {items.length} complete
          </p>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>

        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs capitalize transition ${
                  item.completed
                    ? 'border-primary/50 bg-primary/10 text-gray-100'
                    : 'border-card-border bg-[#0C0C0D]/45 text-gray-400 hover:text-gray-200'
                } ${pendingId === item.id ? 'opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled={pendingId !== null}
                  aria-label={`Mark ${item.name} complete`}
                  className="h-4 w-4 accent-primary"
                  onChange={(event) => {
                    void handleToggle(item.id, event.target.checked);
                  }}
                />
                <span>{item.name}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
