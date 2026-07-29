// Renderiza un asset fijo de CTA desde su fuente HTML.
// Uso: node make-cta.mjs <archivo.html> <salida.png> [--port 8765] [--size 1080x1440]
import { chromium } from 'playwright';
const [src, out] = process.argv.slice(2);
const port = Number(process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port') + 1] : 8765);
const size = process.argv.includes('--size') ? process.argv[process.argv.indexOf('--size') + 1] : '1080x1440';
const [W, H] = size.split('x').map(Number);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await p.goto(`http://127.0.0.1:${port}/${src}`, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.locator('.cta').screenshot({ path: out });
await b.close();
console.log(`${out} generado (${W}x${H}) desde ${src}`);
