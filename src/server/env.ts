import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@127.0.0.1:5432/forenotes")
});

export const env = envSchema.parse(process.env);
