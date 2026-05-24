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
    .default(false)
});

export const env = envSchema.parse(process.env);
