#!/usr/bin/env node
// Recorre el sitio corriendo en local (npm run dev) y reporta links rotos.
// Uso: node check-broken-links.mjs http://localhost:3000

const baseUrl = process.argv[2] || "http://localhost:3000";
const visited = new Set();
const broken = [];

async function checkPage(url) {
  if (visited.has(url)) return;
  visited.add(url);

  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    broken.push({ url, error: err.message });
    return;
  }

  if (!res.ok) {
    broken.push({ url, status: res.status });
    return;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return;

  const html = await res.text();
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

  for (const href of hrefs) {
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;

    let target;
    if (href.startsWith("http://") || href.startsWith("https://")) {
      target = href;
      // Solo seguimos recorriendo internamente; externos solo se chequean, no se recorren.
      if (!target.startsWith(baseUrl)) {
        try {
          const r = await fetch(target, { method: "HEAD" });
          if (!r.ok) broken.push({ url: target, status: r.status, referrer: url });
        } catch (err) {
          broken.push({ url: target, error: err.message, referrer: url });
        }
        continue;
      }
    } else if (href.startsWith("/")) {
      target = baseUrl + href;
    } else {
      continue;
    }

    await checkPage(target);
  }
}

await checkPage(baseUrl);

if (broken.length === 0) {
  console.log(`OK: ${visited.size} páginas/enlaces revisados, ninguno roto.`);
} else {
  console.log(`Encontrados ${broken.length} enlaces rotos:`);
  for (const b of broken) console.log(JSON.stringify(b));
  process.exitCode = 1;
}
