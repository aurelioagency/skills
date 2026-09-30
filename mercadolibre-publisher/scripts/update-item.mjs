import { readFileSync } from "node:fs";

const tokens = JSON.parse(readFileSync("tokens.json", "utf-8"));
const itemId = process.argv[2];
const itemPath = process.argv[3] || "item.json";

if (!itemId) {
  console.error("Uso: node update-item.mjs <item-id> [item.json]");
  process.exit(1);
}

const { description, ...item } = JSON.parse(readFileSync(itemPath, "utf-8"));

// Solo se envían los campos presentes en item.json (title, attributes, seller_contact, etc.)
const res = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${tokens.access_token}`,
  },
  body: JSON.stringify(item),
});
const data = await res.json();
if (!res.ok) {
  console.error("Error al actualizar el ítem:");
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}
console.log("Ítem actualizado:", data.title || itemId);

if (description) {
  const descRes = await fetch(`https://api.mercadolibre.com/items/${itemId}/description`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.access_token}`,
    },
    body: JSON.stringify(description),
  });
  if (!descRes.ok) {
    console.error("Error al actualizar la descripción:");
    console.error(JSON.stringify(await descRes.json(), null, 2));
    process.exit(1);
  }
  console.log("Descripción actualizada.");
}
