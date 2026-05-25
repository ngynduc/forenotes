import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@127.0.0.1:5432/forenotes"),
  FORENOTES_BOOTSTRAP_ADMIN_USERNAME: z.string().trim().min(1).default("admin"),
  FORENOTES_BOOTSTRAP_ADMIN_EMAIL: z.string().email().default("admin@example.com"),
  FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME: z.string().trim().min(1).default("Bootstrap Admin"),
  FORENOTES_BOOTSTRAP_ADMIN_PASSWORD: z.string().min(1).default("ChangeMe123!"),
  FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY: z
    .enum(["0", "1", "true", "false"])
    .optional()
    .transform((value) => value !== "0" && value !== "false")
    .default(true),
  SECURE_SESSION_COOKIES: z
    .enum(["0", "1", "true", "false"])
    .optional()
    .transform((value) => value === "1" || value === "true")
    .default(false),
  FORENOTES_ALLOW_HEADER_AUTH: z
    .enum(["0", "1", "true", "false"])
    .optional()
    .transform((value) => value === "1" || value === "true")
    .default(false),
  FORENOTES_DEMO_MODE: z
    .enum(["0", "1", "true", "false"])
    .optional()
    .transform((value) => value === "1" || value === "true")
    .default(false),
  FORENOTES_LLM_SECRET_KEY: z.string().optional()
}).superRefine((value, context) => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (value.FORENOTES_ALLOW_HEADER_AUTH) {
    context.addIssue({
      code: "custom",
      message: "FORENOTES_ALLOW_HEADER_AUTH cannot be enabled when NODE_ENV=production.",
      path: ["FORENOTES_ALLOW_HEADER_AUTH"]
    });
  }

  if (value.FORENOTES_DEMO_MODE || process.env.FORENOTES_SEED_DEV_USERS === "1") {
    context.addIssue({
      code: "custom",
      message: "Demo mode and development user seeding cannot be enabled when NODE_ENV=production.",
      path: ["FORENOTES_DEMO_MODE"]
    });
  }

  if (value.FORENOTES_BOOTSTRAP_ADMIN_PASSWORD === "ChangeMe123!" || value.FORENOTES_BOOTSTRAP_ADMIN_PASSWORD.length < 12) {
    context.addIssue({
      code: "custom",
      message: "Production bootstrap admin password must be changed and at least 12 characters.",
      path: ["FORENOTES_BOOTSTRAP_ADMIN_PASSWORD"]
    });
  }

  if (isDefaultDatabaseUrl(value.DATABASE_URL)) {
    context.addIssue({
      code: "custom",
      message: "Production DATABASE_URL must not use checked-in default credentials.",
      path: ["DATABASE_URL"]
    });
  }

  if (!value.FORENOTES_LLM_SECRET_KEY || value.FORENOTES_LLM_SECRET_KEY.length < 32) {
    context.addIssue({
      code: "custom",
      message: "Production requires FORENOTES_LLM_SECRET_KEY with at least 32 characters.",
      path: ["FORENOTES_LLM_SECRET_KEY"]
    });
  }
});

export const env = envSchema.parse(process.env);

function isDefaultDatabaseUrl(value: string) {
  return /postgres:\/\/(?:postgres:postgres|forenotes:forenotes)@/i.test(value);
}
