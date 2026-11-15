import type { ReactNode } from 'react';

interface PanelHeadingProps {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
}

export function PanelHeading({ id, title, description, actions }: PanelHeadingProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-bold" dir="auto">
          {title}
        </h2>
        {description ? <p className="text-sm text-stone-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-1.5">{actions}</div> : null}
    </header>
  );
}
