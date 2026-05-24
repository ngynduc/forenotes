import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@127.0.0.1:5432/forenotes"),
  SECURE_SESSION_COOKIES: z
    .enum(["0", "1", "true", "false"])
    .optional()
    .transform((value) => value === "1" || value === "true")
    .default(false)
});

export const env = envSchema.parse(process.env);
