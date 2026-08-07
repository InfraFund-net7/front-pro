'use client';

import {
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { ComponentInspector } from '@/components/digital-twin/component-inspector';
import type {
  DigitalTwinCapabilities,
  SelectedComponentMetadata,
} from '@/types/digital-twin';

type DigitalTwinViewerLayoutProps = {
  children: ReactNode;
  metadata: SelectedComponentMetadata;
  capabilities: DigitalTwinCapabilities;
  showGroundPlane: boolean;
  setShowGroundPlane: Dispatch<SetStateAction<boolean>>;
  showKeyLight: boolean;
  setShowKeyLight: Dispatch<SetStateAction<boolean>>;
  viewportClassName?: string;
};

export function DigitalTwinViewerLayout({
  children,
  metadata,
  capabilities,
  showGroundPlane,
  setShowGroundPlane,
  showKeyLight,
  setShowKeyLight,
  viewportClassName,
}: DigitalTwinViewerLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inspectorWidth, setInspectorWidth] = useState(34);

  const handleResizeStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const startX = event.clientX;
    const startWidth = inspectorWidth;
    const containerWidth = container.getBoundingClientRect().width;

    const handleResize = (pointerEvent: PointerEvent) => {
      const deltaPercent =
        ((startX - pointerEvent.clientX) / containerWidth) * 100;
      const nextWidth = startWidth + deltaPercent;

      setInspectorWidth(Math.min(50, Math.max(18, nextWidth)));
    };

    const handleResizeEnd = () => {
      document.body.style.cursor = 'default';
      window.removeEventListener('pointermove', handleResize);
      window.removeEventListener('pointerup', handleResizeEnd);
    };

    document.body.style.cursor = 'col-resize';
    window.addEventListener('pointermove', handleResize);
    window.addEventListener('pointerup', handleResizeEnd);
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-card-border bg-card-bg shadow-2xl backdrop-blur-xl">
      <div
        ref={containerRef}
        className="grid grid-cols-1 xl:grid-cols-[minmax(0,var(--viewer-width))_0.5rem_minmax(0,var(--inspector-width))]"
        style={
          {
            '--viewer-width': `${100 - inspectorWidth}%`,
            '--inspector-width': `${inspectorWidth}%`,
          } as CSSProperties
        }
      >
        <div className={`relative h-[520px] ${viewportClassName ?? ''}`}>
          {children}
        </div>

        <button
          type="button"
          aria-label="Resize metadata panel"
          onPointerDown={handleResizeStart}
          className="hidden w-2 cursor-col-resize border-l border-r border-white/10 bg-[#0C0C0D]/60 transition hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:block"
        />

        <ComponentInspector
          metadata={metadata}
          showGroundPlane={showGroundPlane}
          setShowGroundPlane={setShowGroundPlane}
          showKeyLight={showKeyLight}
          setShowKeyLight={setShowKeyLight}
          capabilities={capabilities}
        />
      </div>
    </section>
  );
}
