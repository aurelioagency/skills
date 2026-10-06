#!/usr/bin/env node
// ReplyKaro helper: creates the comment-to-DM automation (with follow gate) through
// ReplyKaro's MCP endpoint, which is the only route that stores the full 4-step wizard
// (the plain REST /api/v1 route silently drops greeting, follow-gate texts, final message
// and extra buttons). Keys live OUTSIDE the repo: ~/.replykaro/keys.json
//   { "personal": "rk_live_...", "aurelio": "rk_live_..." }
//
// Commands:
//   create  --account <name> [--target next|latest|<media_id>] [--dm-reply <file>]
//           [--final-message "<text>"] [--link <url>] [--button "<<=20 chars>"] [--keyword <word>]
//   list    --account <name>
//   media   --account <name>
//   delete  --account <name> --id <automation_id>
//   check   --account <name>         (verifies the key and prints the account username)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'references', 'plantilla-base.json'), 'utf8'));
const MCP = 'https://www.replykaro.com/api/mcp';
const REST = 'https://www.replykaro.com/api/v1';
const MAX_ACTIVE = 3; // free plan
const FIXED_LINES = [/skool\.com/i, /aurelioagency\.com/i, /^compartimos m[aá]s recursos/i, /^¿?quer[eé]s que automaticemos/i];

const [cmd, ...argv] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];

function die(msg) { console.error('ERROR: ' + msg); process.exit(1); }

function key() {
  const file = path.join(os.homedir(), '.replykaro', 'keys.json');
  if (!fs.existsSync(file)) die(`No existe ${file}. Crealo con {"personal":"rk_live_..."}.`);
  const keys = JSON.parse(fs.readFileSync(file, 'utf8'));
  const name = opt.account;
  if (!name) die('Falta --account (' + Object.keys(keys).join(', ') + ').');
  if (!keys[name]) die(`La cuenta "${name}" no tiene clave en keys.json (hay: ${Object.keys(keys).join(', ')}).`);
  return keys[name];
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

// Splits a dm-reply-<slug>.txt into final message + first resource URL, dropping the fixed
// Skool / Aurelio Agency lines (those are buttons now, not text).
function parseDmReply(file) {
  const lines = fs.readFileSync(file, 'utf8').replace(/\r/g, '').split('\n');
  const kept = lines.filter((l) => !FIXED_LINES.some((re) => re.test(l.trim())));
  const message = kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const url = (message.match(/https?:\/\/[^\s)]+/) || [])[0];
  return { message, url };
}

async function activeSorted(k) {
  const j = await rest(k, 'GET', '/automations?limit=100&active_only=true');
  return (j.data || []).filter((a) => !a.is_archived).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

if (cmd === 'check') {
  const j = await rest(key(), 'GET', '/analytics?period=7d');
  console.log(`OK — cuenta @${j.data.account.username} (${j.data.account.plan}), automatizaciones activas: ${j.data.active_automations}`);
} else if (cmd === 'media') {
  const m = await mcp(key(), 'list_media');
  console.log(typeof m === 'string' ? m : JSON.stringify(m, null, 2));
} else if (cmd === 'list') {
  for (const a of await activeSorted(key())) console.log(`${a.id} | ${a.trigger_keyword} | media=${a.media_id} | ${a.created_at}`);
} else if (cmd === 'delete') {
  if (!opt.id) die('Falta --id.');
  await rest(key(), 'DELETE', '/automations/' + opt.id);
  console.log('Borrada ' + opt.id);
} else if (cmd === 'create') {
  const k = key();
  let finalMessage = opt['final-message'], link = opt.link;
  if (opt['dm-reply']) {
    const p = parseDmReply(opt['dm-reply']);
    finalMessage ||= p.message;
    link ||= p.url;
  }
  if (!finalMessage) die('Falta el mensaje final (--final-message o --dm-reply).');
  if (!link) die('Falta el link del recurso (--link o una URL dentro del dm-reply).');
  const button = opt.button && opt.button !== true ? opt.button : 'Abrir recurso';
  if (button.length > 20) die(`El texto del botón "${button}" tiene ${button.length} caracteres; máximo 20.`);

  // Target: next = próximo reel que se suba; latest = último reel ya subido; otherwise a media id.
  let media = opt.target || 'next';
  if (media === 'next') media = 'NEXT_MEDIA';
  else if (media === 'latest') {
    const m = await mcp(k, 'list_media');
    const first = (m.media || []).find((x) => /reel/i.test(x.type));
    if (!first) die('No encontré reels en la cuenta.');
    media = first.media_id;
    console.log(`Último reel: ${first.permalink}`);
  }

  // Plan limit: keep at most MAX_ACTIVE active; make room by deleting the OLDEST ones first.
  const active = await activeSorted(k);
  const overflow = active.length - (MAX_ACTIVE - 1);
  for (const old of active.slice(0, Math.max(0, overflow))) {
    await rest(k, 'DELETE', '/automations/' + old.id);
    console.log(`Borré la más vieja para hacer lugar: ${old.id} (${old.trigger_keyword}, ${old.created_at})`);
  }

  const args = {
    ...BASE,
    media_id: media,
    trigger_keyword: opt.keyword && opt.keyword !== true ? opt.keyword : BASE.trigger_keyword,
    final_message: finalMessage,
    final_button_text: button,
    link_url: link,
  };
  const res = await mcp(k, 'create_automation', args);
  console.log(typeof res === 'string' ? res : JSON.stringify(res, null, 2));

  // Read back what was really stored — never assume.
  const saved = (await rest(k, 'GET', '/automations/' + res.automation_id)).data;
  const checks = { require_follow: true, custom_greeting: BASE.custom_greeting, follow_button_text: BASE.follow_button_text, final_button_text: button, link_url: link };
  const bad = Object.entries(checks).filter(([f, v]) => saved[f] !== v);
  console.log(`Guardado: media=${saved.media_id} palabra=${saved.trigger_keyword} follow_gate=${saved.require_follow} botones_extra=${(saved.additional_buttons || []).length} respuestas_publicas=${(saved.comment_reply_templates || []).length}`);
  if (bad.length) die('Campos que NO se guardaron como se pidió: ' + bad.map(([f]) => f).join(', '));
} else {
  die('Comando desconocido. Usá: create | list | media | delete | check');
}
