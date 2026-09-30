import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function loadEnv() {
  const target = join(process.cwd(), ".env");
  if (!existsSync(target)) {
    throw new Error("Falta el archivo .env en el directorio actual. Copiá .env.example a .env y completá CLIENT_ID / CLIENT_SECRET / REDIRECT_URI.");
  }
  const lines = readFileSync(target, "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}
