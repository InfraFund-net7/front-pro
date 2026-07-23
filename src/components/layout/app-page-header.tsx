import type { ReactNode } from 'react';

type AppPageHeaderProps = {
  title: string;
  actions: ReactNode;
  titleMeta?: ReactNode;
};

export function AppPageHeader({
  title,
  actions,
  titleMeta,
}: AppPageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex shrink-0 flex-col gap-3 rounded-lg lg:flex-row lg:items-start lg:justify-between">
      <div className="order-2 min-w-0 flex-1 rounded-2xl border border-transparent lg:order-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="chakra-petch break-words text-2xl font-bold leading-tight text-white md:text-[28px]">
            {title}
          </h1>
          {titleMeta}
        </div>
      </div>
      <div className="order-1 flex w-full shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl lg:order-2 lg:w-auto lg:justify-end">
        {actions}
      </div>
    </header>
  );
}
