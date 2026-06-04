import path from "node:path";

export function getDataDir() {
  return path.resolve(process.env.FORENOTES_DATA_DIR ?? "data");
}

export function getUploadsDir() {
  return path.join(getDataDir(), "uploads");
}
