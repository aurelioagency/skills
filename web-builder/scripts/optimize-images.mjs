#!/usr/bin/env node
// Comprime todas las imágenes de public/ in-place antes de entregar el sitio.
// Requiere sharp: npm i -D sharp
// Uso: node optimize-images.mjs [carpeta]  (default: ./public)

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.argv[2] || "public";
const exts = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
    } else if (exts.has(path.extname(entry.name).toLowerCase())) {
      const before = (await stat(full)).size;
      const buf = await sharp(full)
        .resize({ width: 2000, withoutEnlargement: true })
        .toBuffer();
      const img = sharp(buf);
      const ext = path.extname(full).toLowerCase();
      const output =
        ext === ".png" ? await img.png({ quality: 82 }).toBuffer() : await img.jpeg({ quality: 78 }).toBuffer();
      const fs = await import("node:fs/promises");
      await fs.writeFile(full, output);
      const after = output.length;
      console.log(`${full}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
    }
  }
}

await walk(root);
console.log("Listo.");
