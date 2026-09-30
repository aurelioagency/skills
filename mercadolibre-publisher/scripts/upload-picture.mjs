import { readFileSync } from "node:fs";

const tokens = JSON.parse(readFileSync("tokens.json", "utf-8"));
const filePath = process.argv[2];

if (!filePath) {
  console.error("Uso: node upload-picture.mjs <ruta-de-la-imagen>");
  process.exit(1);
}

const fileBuffer = readFileSync(filePath);
const form = new FormData();
form.append("file", new Blob([fileBuffer]), filePath.split(/[\\/]/).pop());

const res = await fetch("https://api.mercadolibre.com/pictures/items/upload", {
  method: "POST",
  headers: { Authorization: `Bearer ${tokens.access_token}` },
  body: form,
});

const data = await res.json();
if (!res.ok) {
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}
console.log("Picture ID:", data.id);
