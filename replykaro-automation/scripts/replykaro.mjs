#!/usr/bin/env node
// ReplyKaro helper: creates the comment-to-DM automation (with follow gate) through
// ReplyKaro's MCP endpoint, which is the only route that stores the full 4-step wizard
// (the plain REST /api/v1 route silently drops greeting, follow-gate texts, final message
// and extra buttons). Keys live OUTSIDE the repo: ~/.replykaro/keys.json
//   { "personal": "rk_live_...", "aurelio": "rk_live_..." }
//
// Commands (--account takes a name, a comma list, or "all"; default for create = all):
//   create  [--account all] [--target next|latest|<media_id>] [--dm-reply <file>]
//           [--final-message "<text>"] [--link <url>] [--button "<<=20 chars>"] [--name "<recurso>"] [--keyword <word>]
//   list    [--account all]
//   media   --account <name>
//   delete  --account <name> --id <automation_id>
//   check   [--account all]          (verifies each key and prints the Instagram username)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'references', 'plantilla-base.json'), 'utf8'));
const MCP = 'https://www.replykaro.com/api/mcp';
const REST = 'https://www.replykaro.com/api/v1';
const MAX_ACTIVE = 3; // free plan

const [cmd, ...argv] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];

class Fail extends Error {}
const die = (msg) => { throw new Fail(msg); };

function allKeys() {
  const file = path.join(os.homedir(), '.replykaro', 'keys.json');
  if (!fs.existsSync(file)) die(`No existe ${file}. Crealo con {"personal":"rk_live_..."}.`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Resolves --account into [{name, key}]. "all" (or omitted, when allowDefaultAll) = every account in keys.json.
function accounts(allowDefaultAll) {
  const keys = allKeys();
  let names = opt.account;
  if (!names || names === 'all') {
    if (!names && !allowDefaultAll) die('Falta --account (' + Object.keys(keys).join(', ') + ').');
    names = Object.keys(keys).join(',');
  }
  return String(names).split(',').map((n) => n.trim()).filter(Boolean).map((name) => {
    if (!keys[name]) die(`La cuenta "${name}" no tiene clave en keys.json (hay: ${Object.keys(keys).join(', ')}).`);
    return { name, key: keys[name] };
  });
}

async function rest(k, method, p) {
  const r = await fetch(REST + p, { method, headers: { Authorization: 'Bearer ' + k } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) die(`REST ${method} ${p}: ${r.status} ${JSON.stringify(j)}`);
  return j;
}

async function mcp(k, name, args = {}) {
  const r = await fetch(MCP, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + k, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  });
  const j = await r.json();
  if (j.error) die(`MCP ${name}: ${JSON.stringify(j.error)}`);
  const text = (j.result?.content || []).map((c) => c.text).join('\n');
  if (j.result?.isError) die(`MCP ${name}: ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

// Lee la URL del dm-reply-<slug>.txt. Hoy el archivo trae SOLO la URL de la página del recurso
// (https://www.aurelioagency.com/blog/<slug>); si es un archivo viejo con más texto, se ignoran
// Skool y la home de Aurelio Agency y se toma la primera URL restante.
function parseDmReply(file) {
  const text = fs.readFileSync(file, 'utf8');
  const urls = text.match(/https?:\/\/[^\s)]+/g) || [];
  const isFixed = (u) => /skool\.com/i.test(u) || /^https?:\/\/(www\.)?aurelioagency\.com\/?(es)?\/?$/i.test(u);
  return { url: urls.find((u) => !isFixed(u)) };
}

async function activeSorted(k) {
  const j = await rest(k, 'GET', '/automations?limit=100&active_only=true');
  return (j.data || []).filter((a) => !a.is_archived).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

async function createOne({ name, key: k }, { finalMessage, link, button }) {
  // Target: next = próximo reel que se suba; latest = último reel ya subido; otherwise a media id.
  let media = opt.target || 'next';
  if (media === 'next') media = 'NEXT_MEDIA';
  else if (media === 'latest') {
    const m = await mcp(k, 'list_media');
    const first = (m.media || []).find((x) => /reel/i.test(x.type));
    if (!first) die('No encontré reels en la cuenta.');
    media = first.media_id;
    console.log(`[${name}] Último reel: ${first.permalink}`);
  }

  // Plan limit: keep at most MAX_ACTIVE active; make room by deleting the OLDEST ones first.
  const active = await activeSorted(k);
  const overflow = active.length - (MAX_ACTIVE - 1);
  for (const old of opt['dry-run'] ? [] : active.slice(0, Math.max(0, overflow))) {
    await rest(k, 'DELETE', '/automations/' + old.id);
    console.log(`[${name}] Borré la más vieja para hacer lugar: ${old.id} (${old.trigger_keyword}, ${old.created_at})`);
  }

  const args = {
    ...BASE,
    media_id: media,
    trigger_keyword: opt.keyword && opt.keyword !== true ? opt.keyword : BASE.trigger_keyword,
    final_message: finalMessage,
    final_button_text: button,
    link_url: link,
  };
  if (opt['dry-run']) { console.log(`[${name}] DRY-RUN create_automation:
` + JSON.stringify(args, null, 2)); return; }
  const res = await mcp(k, 'create_automation', args);
  if (!res?.automation_id) die('Respuesta inesperada de create_automation: ' + JSON.stringify(res));

  // Read back what was really stored — never assume.
  const saved = (await rest(k, 'GET', '/automations/' + res.automation_id)).data;
  const checks = { require_follow: true, button_text: BASE.button_text, reply_message: BASE.reply_message, custom_greeting: BASE.custom_greeting, follow_button_text: BASE.follow_button_text, final_button_text: button, link_url: link };
  const bad = Object.entries(checks).filter(([f, v]) => saved[f] !== v);
  if ((saved.additional_buttons || []).length !== BASE.additional_buttons.length) bad.push(['additional_buttons']);
  console.log(`[${name}] OK media=${saved.media_id} palabra=${saved.trigger_keyword} follow_gate=${saved.require_follow} botones_extra=${(saved.additional_buttons || []).length} respuestas_publicas=${(saved.comment_reply_templates || []).length} id=${res.automation_id}`);
  if (bad.length) die(`[${name}] Campos que NO se guardaron como se pidió: ` + bad.map(([f]) => f).join(', '));
}

async function main() {
  if (cmd === 'check') {
    for (const a of accounts(true)) {
      const j = await rest(a.key, 'GET', '/analytics?period=7d');
      console.log(`[${a.name}] OK — @${j.data.account.username} (${j.data.account.plan}), activas: ${j.data.active_automations}`);
    }
  } else if (cmd === 'media') {
    const [a] = accounts(false);
    const m = await mcp(a.key, 'list_media');
    console.log(typeof m === 'string' ? m : JSON.stringify(m, null, 2));
  } else if (cmd === 'list') {
    for (const a of accounts(true)) for (const x of await activeSorted(a.key)) console.log(`[${a.name}] ${x.id} | ${x.trigger_keyword} | media=${x.media_id} | ${x.created_at}`);
  } else if (cmd === 'update') {
    // Edita en el lugar (sin borrar): saludo desde la plantilla, mensaje final, link y botón.
    if (!opt.id) die('Falta --id.');
    const [a] = accounts(false);
    const button = opt.button && opt.button !== true ? opt.button : undefined;
    const nombre = opt.name && opt.name !== true ? opt.name : button;
    const args = { automation_id: opt.id, reply_message: BASE.reply_message, button_text: BASE.button_text, additional_buttons: BASE.additional_buttons };
    if (opt.link && opt.link !== true) args.link_url = opt.link;
    if (button) args.final_button_text = button;
    if (opt['final-message'] && opt['final-message'] !== true) args.final_message = opt['final-message'];
    else if (nombre) args.final_message = `Acá tenés ${nombre} 🚀
Tocá el botón de abajo y entrá.`;
    await mcp(a.key, 'update_automation', args);
    const saved = (await rest(a.key, 'GET', '/automations/' + opt.id)).data;
    const bad = Object.entries(args).filter(([f, v]) => f !== 'automation_id' && JSON.stringify(saved[f] ?? (Array.isArray(v) ? [] : v)) !== JSON.stringify(v));
    console.log(`[${a.name}] update ${opt.id}: reply_message=${JSON.stringify(saved.reply_message)} final_message=${JSON.stringify(saved.final_message)} link=${saved.link_url} boton=${saved.final_button_text} extra=${(saved.additional_buttons || []).length} media=${saved.media_id}`);
    if (bad.length) die('No se guardaron: ' + bad.map(([f]) => f).join(', '));
  } else if (cmd === 'delete') {
    if (!opt.id) die('Falta --id.');
    const [a] = accounts(false);
    await rest(a.key, 'DELETE', '/automations/' + opt.id);
    console.log(`[${a.name}] Borrada ${opt.id}`);
  } else if (cmd === 'create') {
    let finalMessage = opt['final-message'], link = opt.link;
    // El dm-reply solo aporta la URL (es lo único que trae hoy: la página del recurso). El link
    // que sale en la automatización es siempre uno solo; --link explícito gana sobre el del archivo.
    if (opt['dm-reply']) link ||= parseDmReply(opt['dm-reply']).url;
    if (!link) die('Falta el link del recurso (--link o una URL dentro del dm-reply).');
    const button = opt.button && opt.button !== true ? opt.button : 'Abrir recurso';
    if (button.length > 20) die(`El texto del botón "${button}" tiene ${button.length} caracteres; máximo 20.`);
    // Mensaje que acompaña al botón: sin links en el texto (el link vive en el botón).
    if (!finalMessage) {
      const nombre = opt.name && opt.name !== true ? opt.name : button;
      finalMessage = `Acá tenés ${nombre} 🚀
Tocá el botón de abajo y entrá.`;
    }
    const list = accounts(true);
    if (opt.target && !['next', 'latest'].includes(opt.target) && list.length > 1) die('Un media_id puntual es de una sola cuenta: pasá --account <nombre>.');
    // One account failing must not block the other: run all, report each, exit 1 if any failed.
    let failed = 0;
    for (const a of list) {
      try { await createOne(a, { finalMessage, link, button }); }
      catch (e) { failed++; console.error(`[${a.name}] ERROR: ${e.message}`); }
    }
    if (failed) process.exit(1);
  } else {
    die('Comando desconocido. Usá: create | update | list | media | delete | check');
  }
}

main().catch((e) => { console.error(e instanceof Fail ? 'ERROR: ' + e.message : e); process.exit(1); });
