// Reads nameID 1 (font family) out of a TTF/OTF name table.
//
// The file name is not the family name: Inter-Black.ttf declares "Inter Black", and
// asking libass for "Inter" makes it substitute another font silently, at the wrong
// weight. Always ask the file what it is called.
import fs from 'node:fs';

export function readFontFamily(fontFile) {
  const buf = fs.readFileSync(fontFile);
  const numTables = buf.readUInt16BE(4);
  let nameOffset = null;
  for (let i = 0; i < numTables; i += 1) {
    const record = 12 + i * 16;
    if (buf.toString('latin1', record, record + 4) === 'name') {
      nameOffset = buf.readUInt32BE(record + 8);
      break;
    }
  }
  if (nameOffset === null) throw new Error(`No name table in font: ${fontFile}`);

  const count = buf.readUInt16BE(nameOffset + 2);
  const storage = nameOffset + buf.readUInt16BE(nameOffset + 4);
  let fallback = null;
  for (let i = 0; i < count; i += 1) {
    const rec = nameOffset + 6 + i * 12;
    const platformId = buf.readUInt16BE(rec);
    const nameId = buf.readUInt16BE(rec + 6);
    if (nameId !== 1) continue;
    const length = buf.readUInt16BE(rec + 8);
    const offset = storage + buf.readUInt16BE(rec + 10);
    const slice = buf.subarray(offset, offset + length);
    const value = platformId === 3 ? slice.swap16().toString('utf16le') : slice.toString('latin1');
    if (platformId === 3) return value;
    fallback = fallback || value;
  }
  if (!fallback) throw new Error(`No family name (nameID 1) in font: ${fontFile}`);
  return fallback;
}
