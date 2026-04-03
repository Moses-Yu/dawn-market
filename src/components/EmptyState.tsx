import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
        <Icon className="h-6 w-6 text-[var(--color-muted)]" />
      </div>
      <h2 className="mb-1 text-base font-semibold">{title}</h2>
      {description && (
        <p className="max-w-xs text-sm text-[var(--color-muted)]">{description}</p>
      )}
    </div>
  );
}
