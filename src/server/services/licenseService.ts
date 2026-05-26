import { createPublicKey, verify } from "node:crypto";
import { promises as fs } from "node:fs";
import { z } from "zod";
import type { Database } from "../db/types.js";
import { AppError } from "../errors.js";
import { FORENOTES_LICENSE_PUBLIC_KEY } from "../license/publicKey.js";
import {
  FEATURE_KEYS,
  LICENSE_TIERS,
  featureAllowedForTier,
  featureRequiredTier,
  licenseHasFeature,
  tierFeatures,
  type FeatureKey,
  type LicenseStatusResponse,
  type LicenseStatusState,
  type LicenseTier,
  type SignedLicensePayload
} from "../../shared/license.js";

const LICENSE_PREFIX = "FNLIC-v1";
const GRACE_PERIOD_DAYS = 14;
const EXPIRING_SOON_DAYS = 14;

const licensePayloadSchema = z.object({
  licenseId: z.string().trim().min(1),
  customerName: z.string().trim().min(1),
  tier: z.enum(LICENSE_TIERS),
  seats: z.number().int().positive(),
  issuedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  features: z.array(z.enum(FEATURE_KEYS)),
  deploymentId: z.string().trim().min(1).optional()
});

export interface LicenseContext {
  payload: SignedLicensePayload;
  status: Exclude<LicenseStatusState, "invalid">;
  features: FeatureKey[];
  source: "database" | "file";
}

interface StoredLicense {
  licenseKey: string;
  source: "database" | "file";
}

export function parseAndVerifyLicenseKey(licenseKey: string, publicKeyPem = readPublicKeyPem()): SignedLicensePayload {
  const trimmed = licenseKey.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3 || parts[0] !== LICENSE_PREFIX) {
    throw invalidLicense("License key must use FNLIC-v1.payload.signature format.");
  }

  const payloadBytes = decodeBase64Url(parts[1], "payload");
  const signature = decodeBase64Url(parts[2], "signature");
  const publicKey = createPublicKey(publicKeyPem);
  const verified = verify(null, payloadBytes, publicKey, signature);
  if (!verified) {
    throw invalidLicense("License signature is invalid.");
  }

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(payloadBytes.toString("utf8"));
  } catch {
    throw invalidLicense("License payload is not valid JSON.");
  }

  const parsedPayload = licensePayloadSchema.safeParse(rawPayload);
  if (!parsedPayload.success) {
    throw invalidLicense("License payload does not match the expected schema.");
  }

  const payload = parsedPayload.data;
  validateLicenseDates(payload);
  return {
    ...payload,
    features: effectiveFeatures(payload)
  };
}

export async function getLicenseStatus(database: Database): Promise<LicenseStatusResponse> {
  const usedSeats = await countActiveUsers(database);
  const storedLicense = await readStoredLicense(database);
  if (!storedLicense) {
    return freeLicenseStatus(usedSeats);
  }

  try {
    const context = licenseContextFromKey(storedLicense.licenseKey, storedLicense.source);
    return licenseStatusFromContext(context, usedSeats);
  } catch (error) {
    if (isInvalidLicenseError(error)) {
      return {
        customerName: "Invalid license",
        tier: "individual",
        status: "invalid",
        seats: 1,
        usedSeats,
        features: [],
        source: storedLicense.source,
        message: error.detailsMessage
      };
    }
    throw error;
  }
}

export async function activateLicense(database: Database, licenseKey: string): Promise<LicenseStatusResponse> {
  const payload = parseAndVerifyLicenseKey(licenseKey);
  const status = getTemporalStatus(payload);
  await database.query(
    `
      insert into app_license (id, license_key, license_payload, tier, status, expires_at, activated_at, updated_at)
      values ('active', $1, $2, $3, $4, $5, now(), now())
      on conflict (id) do update set
        license_key = excluded.license_key,
        license_payload = excluded.license_payload,
        tier = excluded.tier,
        status = excluded.status,
        expires_at = excluded.expires_at,
        updated_at = now()
    `,
    [licenseKey.trim(), JSON.stringify(payload), payload.tier, status, payload.expiresAt]
  );
  return getLicenseStatus(database);
}

export async function deactivateLicense(database: Database): Promise<LicenseStatusResponse> {
  await database.query("delete from app_license where id = 'active'");
  return getLicenseStatus(database);
}

export async function getLicensedFeatures(database: Database): Promise<FeatureKey[]> {
  const status = await getLicenseStatus(database);
  return status.features;
}

export async function requireFeature(database: Database, feature: FeatureKey): Promise<void> {
  const status = await getLicenseStatus(database);
  if (status.status === "invalid") {
    throw new AppError(403, "INVALID_LICENSE", {
      message: status.message ?? "The active license is invalid."
    });
  }

  if (status.status === "expired") {
    throw new AppError(403, "LICENSE_EXPIRED", {
      feature,
      requiredTier: featureRequiredTier(feature),
      message: "The active license has expired. Renew the license to use premium features."
    });
  }

  if (!licenseHasFeature(status.features, feature)) {
    throw new AppError(403, "FEATURE_NOT_LICENSED", {
      feature,
      requiredTier: featureRequiredTier(feature),
      message: `${featureLabel(feature)} is available in the ${tierLabel(featureRequiredTier(feature))} tier.`
    });
  }
}

export async function requireSeatAvailable(database: Database): Promise<void> {
  const status = await getLicenseStatus(database);
  if (status.status === "invalid") {
    throw new AppError(403, "INVALID_LICENSE", {
      message: status.message ?? "The active license is invalid."
    });
  }

  if (status.status === "expired" && status.tier !== "individual") {
    throw new AppError(403, "LICENSE_EXPIRED", {
      message: "The active license has expired. Renew the license to add users."
    });
  }

  if (status.usedSeats >= status.seats) {
    throw new AppError(403, "SEAT_LIMIT_REACHED", {
      seats: status.seats,
      usedSeats: status.usedSeats,
      message: `This license allows ${status.seats} active user${status.seats === 1 ? "" : "s"}. Remove a user or upgrade your license.`
    });
  }
}

export function licenseContextFromKey(licenseKey: string, source: "database" | "file" = "database"): LicenseContext {
  const payload = parseAndVerifyLicenseKey(licenseKey);
  const status = getTemporalStatus(payload);
  return {
    payload,
    status,
    features: status === "expired" ? [] : payload.features,
    source
  };
}

export function getTemporalStatus(payload: SignedLicensePayload, now = new Date()): Exclude<LicenseStatusState, "invalid"> {
  const expiresAt = new Date(payload.expiresAt);
  const graceEndsAt = addDays(expiresAt, GRACE_PERIOD_DAYS);
  const expiringSoonAt = addDays(now, EXPIRING_SOON_DAYS);

  if (now > graceEndsAt) {
    return "expired";
  }

  if (now > expiresAt) {
    return "grace";
  }

  if (expiresAt <= expiringSoonAt) {
    return "expiring_soon";
  }

  return "active";
}

function licenseStatusFromContext(context: LicenseContext, usedSeats: number): LicenseStatusResponse {
  return {
    licenseId: context.payload.licenseId,
    customerName: context.payload.customerName,
    tier: context.payload.tier,
    status: context.status,
    seats: seatLimitForTier(context.payload.tier, context.payload.seats),
    usedSeats,
    expiresAt: context.payload.expiresAt,
    features: context.features,
    source: context.source
  };
}

function freeLicenseStatus(usedSeats: number): LicenseStatusResponse {
  return {
    customerName: "Individual Free",
    tier: "individual",
    status: "active",
    seats: 1,
    usedSeats,
    features: [],
    source: "free"
  };
}

function seatLimitForTier(tier: LicenseTier, licensedSeats: number): number {
  if (tier === "individual" || tier === "pro") {
    return 1;
  }
  return licensedSeats;
}

function effectiveFeatures(payload: SignedLicensePayload): FeatureKey[] {
  const allowed = tierFeatures(payload.tier);
  return payload.features.filter((feature) => allowed.includes(feature));
}

function validateLicenseDates(payload: SignedLicensePayload) {
  const issuedAt = new Date(payload.issuedAt);
  const expiresAt = new Date(payload.expiresAt);
  if (Number.isNaN(issuedAt.getTime()) || Number.isNaN(expiresAt.getTime())) {
    throw invalidLicense("License dates are invalid.");
  }
  if (expiresAt <= issuedAt) {
    throw invalidLicense("License expiration must be after the issue date.");
  }
}

async function readStoredLicense(database: Database): Promise<StoredLicense | null> {
  const fileLicense = await readLicenseFile();
  if (fileLicense) {
    return { licenseKey: fileLicense, source: "file" };
  }

  const result = await database.query<{ license_key: string }>(
    "select license_key from app_license where id = 'active' limit 1"
  );
  const row = result.rows[0];
  return row ? { licenseKey: row.license_key, source: "database" } : null;
}

async function readLicenseFile(): Promise<string | null> {
  const licenseFile = process.env.FORENOTES_LICENSE_FILE?.trim();
  if (!licenseFile) {
    return null;
  }
  try {
    return (await fs.readFile(licenseFile, "utf8")).trim();
  } catch {
    throw invalidLicense(`Unable to read license file at ${licenseFile}.`);
  }
}

async function countActiveUsers(database: Database): Promise<number> {
  const result = await database.query<{ count: string | number }>("select count(*) as count from users where status = 'active'");
  return Number(result.rows[0]?.count ?? 0);
}

function readPublicKeyPem() {
  if (process.env.VITEST === "true" && process.env.FORENOTES_TEST_LICENSE_PUBLIC_KEY) {
    return process.env.FORENOTES_TEST_LICENSE_PUBLIC_KEY;
  }
  return FORENOTES_LICENSE_PUBLIC_KEY;
}

function decodeBase64Url(segment: string, label: string): Buffer {
  try {
    return Buffer.from(segment, "base64url");
  } catch {
    throw invalidLicense(`License ${label} is not valid base64url.`);
  }
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function featureLabel(feature: FeatureKey) {
  return feature
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function tierLabel(tier: LicenseTier) {
  return tier[0].toUpperCase() + tier.slice(1);
}

function invalidLicense(message: string): AppError & { detailsMessage: string } {
  const error = new AppError(400, "INVALID_LICENSE", { message }) as AppError & { detailsMessage: string };
  error.detailsMessage = message;
  return error;
}

function isInvalidLicenseError(error: unknown): error is AppError & { detailsMessage: string } {
  return error instanceof AppError && error.message === "INVALID_LICENSE" && "detailsMessage" in error;
}
