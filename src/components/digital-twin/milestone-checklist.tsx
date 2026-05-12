'use client';

import { useMemo, useState } from 'react';
import type { ConstructionMilestone } from '@/lib/digital-twin-projects';

type MilestoneChecklistProps = {
  milestones: ConstructionMilestone[];
};

export function MilestoneChecklist({ milestones }: MilestoneChecklistProps) {
  const [items, setItems] = useState(milestones);
  const completedCount = useMemo(
    () => items.filter((item) => item.completed).length,
    [items]
  );
  const progress = Math.round((completedCount / items.length) * 100);

  return (
    <section className="rounded-[24px] border border-card-border bg-card-bg p-6 backdrop-blur-xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="chakra-petch text-2xl font-bold text-white">
            Construction Milestones
          </h2>
        </div>
        <div className="text-right text-sm text-gray-300">
          <p>
            {completedCount} of {items.length} complete
          </p>
          <p className="text-primary">{progress}% progress</p>
        </div>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-[#0C0C0D]">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-card-border bg-[#0C0C0D]/45 px-4 py-3"
          >
            <span
              className={`text-sm capitalize ${
                item.completed ? 'text-gray-100' : 'text-gray-400'
              }`}
            >
              {item.label}
            </span>
            <input
              type="checkbox"
              checked={item.completed}
              aria-label={`Mark ${item.label} complete`}
              className="h-5 w-5 accent-primary"
              onChange={(event) => {
                const completed = event.target.checked;
                setItems((currentItems) =>
                  currentItems.map((currentItem) =>
                    currentItem.id === item.id
                      ? { ...currentItem, completed }
                      : currentItem
                  )
                );
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
