interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--color-primary-strong)]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
