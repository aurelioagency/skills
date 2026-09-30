import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { loadEnv } from "./env.mjs";

const env = loadEnv();
const { CLIENT_ID, CLIENT_SECRET } = env;

if (!existsSync("tokens.json")) {
  throw new Error("No hay tokens.json. Corré primero: node oauth-login.mjs");
}
let tokens = JSON.parse(readFileSync("tokens.json", "utf-8"));

async function refreshIfNeeded() {
  const ageSeconds = (Date.now() - tokens.obtained_at) / 1000;
  if (ageSeconds < tokens.expires_in - 60) return;

  console.log("Access token vencido, refrescando...");
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));

  tokens = { ...data, obtained_at: Date.now() };
  writeFileSync("tokens.json", JSON.stringify(tokens, null, 2));
}

async function createItem(itemPath) {
  if (!existsSync(itemPath)) {
    throw new Error(`No encuentro ${itemPath}. Armá item.json con los datos de la publicación.`);
  }
  const { description, ...item } = JSON.parse(readFileSync(itemPath, "utf-8"));

  const res = await fetch("https://api.mercadolibre.com/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.access_token}`,
    },
    body: JSON.stringify(item),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Error al crear la publicación:");
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("Publicación creada con éxito.");
  console.log("ID:", data.id);
  console.log("Link:", data.permalink);

  if (description) {
    const descRes = await fetch(`https://api.mercadolibre.com/items/${data.id}/description`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify(description),
    });
    if (!descRes.ok) {
      console.error("La publicación se creó pero falló al cargar la descripción:");
      console.error(JSON.stringify(await descRes.json(), null, 2));
    } else {
      console.log("Descripción cargada.");
    }
  }
}

await refreshIfNeeded();
await createItem(process.argv[2] || "item.json");
