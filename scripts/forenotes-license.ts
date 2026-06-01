import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  FEATURE_KEYS,
  LICENSE_TIERS,
  TIER_FEATURES,
  type FeatureKey,
  type LicenseTier,
  type SignedLicensePayload
} from "../src/shared/license.js";

const LICENSE_PREFIX = "FNLIC-v1";

function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help") {
    printUsage();
    return;
  }

  if (command === "issue") {
    console.log(issueLicense(parseOptions(args)));
    return;
  }

  if (command === "decode") {
    const key = args[0];
    if (!key) fail("decode requires a license key.");
    console.log(JSON.stringify(decodeLicensePayload(key), null, 2));
    return;
  }

  fail(`Unknown command: ${command}`);
}

function issueLicense(options: Record<string, string | boolean>) {
  const customerName = readRequired(options, "customer");
  const tier = readTier(readRequired(options, "tier"));
  const expiresAt = normalizeDate(readRequired(options, "expires"), "expires");
  const seats = Number(options.seats ?? (tier === "individual" || tier === "pro" ? 1 : 5));
  if (!Number.isInteger(seats) || seats < 1) {
    fail("--seats must be a positive integer.");
  }

  const now = new Date();
  const payload: SignedLicensePayload = {
    licenseId: String(options.licenseId ?? `lic_${randomId()}`),
    customerName,
    tier,
    seats,
    issuedAt: String(options.issuedAt ? normalizeDate(String(options.issuedAt), "issuedAt") : now.toISOString()),
    expiresAt,
    features: readFeatures(options.features, tier),
    deploymentId: typeof options.deploymentId === "string" ? options.deploymentId : undefined
  };

  const payloadJson = JSON.stringify(payload);
  const encodedPayload = base64Url(payloadJson);
  const signature = sign(null, Buffer.from(payloadJson, "utf8"), readPrivateKey());
  return `${LICENSE_PREFIX}.${encodedPayload}.${signature.toString("base64url")}`;
}

function decodeLicensePayload(licenseKey: string) {
  const parts = licenseKey.trim().split(".");
  if (parts.length !== 3 || parts[0] !== LICENSE_PREFIX) {
    fail("License key must use FNLIC-v1.payload.signature format.");
  }
  return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
}

function readPrivateKey() {
  const privateKeyFile = process.env.FORENOTES_LICENSE_PRIVATE_KEY_FILE;
  const privateKeyPem = privateKeyFile
    ? readFileSync(privateKeyFile, "utf8")
    : process.env.FORENOTES_LICENSE_PRIVATE_KEY;
  if (!privateKeyPem) {
    fail("Set FORENOTES_LICENSE_PRIVATE_KEY or FORENOTES_LICENSE_PRIVATE_KEY_FILE before issuing a license.");
  }
  return createPrivateKey(privateKeyPem);
}

function parseOptions(args: string[]) {
  const options: Record<string, string | boolean> = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      fail(`Unexpected argument: ${arg}`);
    }
    const key = arg.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }
    options[key] = next;
    index += 1;
  }
  return options;
}

function readRequired(options: Record<string, string | boolean>, key: string) {
  const value = options[key];
  if (typeof value !== "string" || !value.trim()) {
    fail(`--${key} is required.`);
  }
  return value.trim();
}

function readTier(value: string): LicenseTier {
  if (!LICENSE_TIERS.includes(value as LicenseTier)) {
    fail(`--tier must be one of: ${LICENSE_TIERS.join(", ")}.`);
  }
  return value as LicenseTier;
}

function readFeatures(value: string | boolean | undefined, tier: LicenseTier): FeatureKey[] {
  if (value === undefined || value === false) {
    return TIER_FEATURES[tier];
  }
  if (value === true) {
    fail("--features requires a comma-separated list.");
  }
  const features = value.split(",").map((feature) => feature.trim()).filter(Boolean);
  for (const feature of features) {
    if (!FEATURE_KEYS.includes(feature as FeatureKey)) {
      fail(`Unknown feature "${feature}". Valid features: ${FEATURE_KEYS.join(", ")}.`);
    }
  }
  return features as FeatureKey[];
}

function normalizeDate(value: string, label: string) {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    fail(`--${label} must be an ISO date or timestamp.`);
  }
  return date.toISOString();
}

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function printUsage() {
  console.log(`Usage:
  npm run license -- issue --customer "Acme Security" --tier teams --seats 10 --expires 2027-05-26
  npm run license -- issue --customer "Acme Security" --tier teams --seats 10 --expires 2027-05-26 --deploymentId <deployment-id>
  npm run license -- decode FNLIC-v1.payload.signature

Environment:
  FORENOTES_LICENSE_PRIVATE_KEY       PEM Ed25519 private key
  FORENOTES_LICENSE_PRIVATE_KEY_FILE  Path to PEM Ed25519 private key`);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

main();
