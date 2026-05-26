import { LockKeyhole } from "lucide-react";
import { featureRequiredTier, type FeatureKey } from "@shared/license";

interface LockedFeatureProps {
  feature: FeatureKey;
  title?: string;
  description?: string;
}

export function LockedFeature({ feature, title, description }: LockedFeatureProps) {
  const requiredTier = featureRequiredTier(feature);
  const featureName = label(feature);
  const tierName = label(requiredTier);

  return (
    <section className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="flex max-w-2xl items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <LockKeyhole className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold">{title ?? `${featureName} requires Forenotes ${tierName}`}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {description ?? `Upgrade to ${tierName} to use ${featureName.toLowerCase()} in this workspace.`}
          </p>
        </div>
      </div>
    </section>
  );
}

function label(value: string) {
  return value
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
