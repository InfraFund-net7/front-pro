'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ConstructionMilestone } from '@/lib/digital-twin-projects';

type MilestoneChecklistProps = {
  milestones: ConstructionMilestone[];
  onChange?: (milestones: ConstructionMilestone[]) => void;
};

export function MilestoneChecklist({
  milestones,
  onChange,
}: MilestoneChecklistProps) {
  const [items, setItems] = useState(milestones);

  useEffect(() => {
    setItems(milestones);
  }, [milestones]);

  const completedCount = useMemo(
    () => items.filter((item) => item.completed).length,
    [items]
  );
  const progress = Math.round((completedCount / items.length) * 100);

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
        </div>

        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs capitalize transition ${
                  item.completed
                    ? 'border-primary/50 bg-primary/10 text-gray-100'
                    : 'border-card-border bg-[#0C0C0D]/45 text-gray-400 hover:text-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  aria-label={`Mark ${item.label} complete`}
                  className="h-4 w-4 accent-primary"
                  onChange={(event) => {
                    const completed = event.target.checked;
                    const nextItems = items.map((currentItem) =>
                      currentItem.id === item.id
                        ? { ...currentItem, completed }
                        : currentItem
                    );
                    setItems(nextItems);
                    onChange?.(nextItems);
                  }}
                />
                <span>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
