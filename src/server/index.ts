import { createApp } from "./app.js";
import { env } from "./env.js";

const app = createApp();

app.listen(env.PORT, env.APP_HOST, () => {
  process.stdout.write(`Forenotes API listening on http://${env.APP_HOST}:${env.PORT}\n`);
});
