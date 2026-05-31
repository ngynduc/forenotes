export const LICENSE_TIERS = ["individual", "pro", "teams", "enterprise"] as const;
export type LicenseTier = (typeof LICENSE_TIERS)[number];

export const FEATURE_KEYS = [
  "graph",
  "multi_user",
  "tasks",
  "case_collaboration",
  "sso",
  "advanced_audit_log"
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const TIER_FEATURES: Record<LicenseTier, FeatureKey[]> = {
  individual: [],
  pro: ["graph"],
  teams: ["graph", "multi_user", "tasks", "case_collaboration"],
  enterprise: ["graph", "multi_user", "tasks", "case_collaboration", "sso", "advanced_audit_log"]
};

export const FEATURE_REQUIRED_TIER: Record<FeatureKey, LicenseTier> = {
  graph: "pro",
  multi_user: "teams",
  tasks: "teams",
  case_collaboration: "teams",
  sso: "enterprise",
  advanced_audit_log: "enterprise"
};

export const LICENSE_STATUSES = ["active", "expiring_soon", "grace", "expired", "invalid"] as const;
export type LicenseStatusState = (typeof LICENSE_STATUSES)[number];

export interface SignedLicensePayload {
  licenseId: string;
  customerName: string;
  tier: LicenseTier;
  seats: number;
  issuedAt: string;
  expiresAt: string;
  features: FeatureKey[];
  deploymentId?: string;
}

export interface LicenseStatusResponse {
  licenseId?: string;
  customerName: string;
  tier: LicenseTier;
  status: LicenseStatusState;
  seats: number;
  usedSeats: number;
  expiresAt?: string;
  features: FeatureKey[];
  source: "free" | "database" | "file";
  deploymentId: string;
  message?: string;
}

export function tierFeatures(tier: LicenseTier): FeatureKey[] {
  return [...TIER_FEATURES[tier]];
}

export function featureRequiredTier(feature: FeatureKey): LicenseTier {
  return FEATURE_REQUIRED_TIER[feature];
}

export function featureAllowedForTier(feature: FeatureKey, tier: LicenseTier): boolean {
  return TIER_FEATURES[tier].includes(feature);
}

export function licenseHasFeature(features: readonly FeatureKey[], feature: FeatureKey): boolean {
  return features.includes(feature);
}
