#!/usr/bin/env node
// ReplyKaro (https://www.replykaro.com): "comentá la palabra y te mando el link por DM", para cualquier cuenta.
// Crea la automatización completa del asistente de ReplyKaro (saludo, follow gate, mensaje final, botón,
// respuestas públicas) por el endpoint MCP de ReplyKaro: es la única vía que guarda todos los textos (la ruta
// REST /api/v1/automations solo guarda palabra, mensaje y un botón, e ignora el resto sin avisar).
//
// La clave NUNCA pasa por el chat: la persona la carga con `setup` en su propia terminal y queda en
//   ~/.replykaro/keys.json   { "<alias>": "rk_live_..." }   (fuera de cualquier repo)
//
// Comandos (con una sola cuenta en keys.json, --account se puede omitir):
//   setup   [--account <alias>]                 pide la clave sin mostrarla, la verifica y la guarda
//   check   [--account <alias>]                 verifica la clave: usuario de Instagram, plan, activas
//   media   [--account <alias>]                 lista los posts/reels con su id (para apuntar a uno puntual)
//   list    [--account <alias>]                 automatizaciones activas, de la más vieja a la más nueva
//   create  --config <archivo.json> [--account <alias>] [--dry-run] [--replace <id>]
//   update  --config <archivo.json> --id <id> [--account <alias>]
//   delete  --id <id> [--account <alias>]       borra UNA automatización (solo con el OK de la persona)
//
// Cada llamada gasta cuota (plan gratis: 100 por mes). No hay comandos "para mirar": usar solo lo necesario.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

const MCP = 'https://www.replykaro.com/api/mcp';
const REST = 'https://www.replykaro.com/api/v1';
const KEYS = path.join(os.homedir(), '.replykaro', 'keys.json');
const FREE_ACTIVE = 3; // plan gratis: 3 automatizaciones activas

const [cmd, ...argv] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
const str = (k) => (typeof opt[k] === 'string' ? opt[k] : undefined);

class Fail extends Error {}
const die = (msg) => { throw new Fail(msg); };

function readKeys() {
  if (!fs.existsSync(KEYS)) return {};
  return JSON.parse(fs.readFileSync(KEYS, 'utf8'));
}

function account() {
  const keys = readKeys();
  const names = Object.keys(keys);
  if (!names.length) die(`Todavía no hay ninguna clave guardada. Corré "node <skill>/scripts/replykaro.mjs setup" en tu terminal.`);
  const name = str('account') || (names.length === 1 ? names[0] : die(`Hay varias cuentas (${names.join(', ')}): pasá --account <alias>.`));
  if (!keys[name]) die(`La cuenta "${name}" no tiene clave guardada (hay: ${names.join(', ')}).`);
  return { name, key: keys[name] };
}

async function rest(k, method, p) {
  const r = await fetch(REST + p, { method, headers: { Authorization: 'Bearer ' + k } });
  const j = await r.json().catch(() => ({}));
  if (r.status === 429) die('La API de ReplyKaro respondió 429: se terminó la cuota del mes o hubo demasiadas llamadas por minuto. Ver "Sin cuota" en SKILL.md.');
  if (r.status === 401) die('La clave no es válida o fue revocada (401). Generá una nueva en Dashboard → Developer API y corré setup otra vez.');
  if (!r.ok || j.success === false) die(`REST ${method} ${p}: ${r.status} ${JSON.stringify(j)}`);
  return j;
}

async function mcp(k, name, args = {}) {
  const r = await fetch(MCP, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + k, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  });
  if (r.status === 429) die('La API de ReplyKaro respondió 429 (cuota o límite por minuto). Ver "Sin cuota" en SKILL.md.');
  const raw = await r.text();
  // the endpoint may answer as JSON or as a one-event SSE stream
  const body = raw.trim().startsWith('{') ? raw : (raw.split('\n').find((l) => l.startsWith('data:')) || '').slice(5);
  let j;
  try { j = JSON.parse(body); } catch { die(`MCP ${name}: respuesta inesperada (${r.status}): ${raw.slice(0, 300)}`); }
  if (j.error) die(`MCP ${name}: ${JSON.stringify(j.error)}`);
  const text = (j.result?.content || []).map((c) => c.text).join('\n');
  if (j.result?.isError) die(`MCP ${name}: ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

// The interview's answers, as one JSON file (example: references/ejemplo-automatizacion.json).
function loadConfig() {
  const file = str('config') || die('Falta --config <archivo.json> (lo arma la entrevista, ver SKILL.md).');
  const c = JSON.parse(fs.readFileSync(file, 'utf8'));
  const need = (f) => (c[f] === undefined || c[f] === '' ? die(`Falta "${f}" en ${file}.`) : c[f]);
  need('trigger_keyword'); need('reply_message'); need('button_text'); need('final_message'); need('final_button_text'); need('link_url');
  if (!/^https?:\/\/\S+$/.test(c.link_url)) die(`"link_url" no es una URL completa (https://...): ${c.link_url}`);
  for (const f of ['button_text', 'final_button_text', 'follow_button_text', 'verify_button_text'])
    if (c[f] && c[f].length > 20) die(`"${f}" tiene ${c[f].length} caracteres ("${c[f]}"); el máximo es 20.`);
  for (const f of ['reply_message', 'final_message', 'follow_gate_message', 'follow_gate_retry_message'])
    if (c[f] && c[f].length > 1000) die(`"${f}" supera los 1000 caracteres.`);
  if (c.require_follow) for (const f of ['follow_gate_message', 'follow_button_text', 'verify_button_text', 'follow_gate_retry_message']) need(f);
  return c;
}

// Everything create_automation / update_automation take, from the config.
function automationArgs(c) {
  return {
    trigger_type: c.trigger_type || 'keyword',
    trigger_keyword: c.trigger_keyword,
    comment_reply_templates: c.comment_reply_templates || [],
    custom_greeting: c.custom_greeting || '',
    reply_message: c.reply_message,
    button_text: c.button_text,
    require_follow: !!c.require_follow,
    ...(c.require_follow ? {
      follow_gate_message: c.follow_gate_message,
      follow_button_text: c.follow_button_text,
      verify_button_text: c.verify_button_text,
      follow_gate_retry_message: c.follow_gate_retry_message,
    } : {}),
    final_message: c.final_message,
    final_button_text: c.final_button_text,
    link_url: c.link_url,
    additional_buttons: c.additional_buttons || [],
    followup_enabled: !!c.followup_enabled,
  };
}

// Read back what ReplyKaro really stored (never assume) and fail loudly on any difference.
async function verify(k, id, args) {
  const saved = (await rest(k, 'GET', '/automations/' + id)).data;
  const fields = ['trigger_keyword', 'reply_message', 'button_text', 'custom_greeting', 'require_follow', 'follow_button_text', 'final_message', 'final_button_text', 'link_url'];
  const bad = fields.filter((f) => f in args && (saved[f] ?? '') !== (args[f] ?? ''));
  if ((saved.additional_buttons || []).length !== (args.additional_buttons || []).length) bad.push('additional_buttons');
  console.log(`OK id=${id} post=${saved.media_id} palabra=${saved.trigger_keyword} follow_gate=${saved.require_follow} respuestas_publicas=${(saved.comment_reply_templates || []).length} link=${saved.link_url}`);
  if (bad.length) die('Estos campos NO quedaron guardados como se pidieron: ' + bad.join(', ') + '. Revisalos en el panel de ReplyKaro.');
}

async function activeSorted(k) {
  const j = await rest(k, 'GET', '/automations?limit=100&active_only=true');
  return (j.data || []).filter((a) => !a.is_archived).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    rl.question(question, (a) => { rl.close(); process.stdout.write('\n'); resolve(a.trim()); });
  });
}

async function main() {
  if (cmd === 'setup') {
    const name = str('account') || 'principal';
    if (!process.stdin.isTTY) die('setup tiene que correr en tu propia terminal (no adentro del chat), para que la clave no quede escrita en ningún lado.');
    const key = await askHidden(`Pegá tu clave de ReplyKaro para "${name}" (empieza con rk_live_, no se va a ver) y Enter: `);
    if (!/^rk_live_\S+$/.test(key)) die('Eso no parece una clave de ReplyKaro (tiene que empezar con rk_live_).');
    const j = await rest(key, 'GET', '/analytics?period=7d');
    const keys = readKeys();
    keys[name] = key;
    fs.mkdirSync(path.dirname(KEYS), { recursive: true });
    fs.writeFileSync(KEYS, JSON.stringify(keys, null, 2), { mode: 0o600 });
    console.log(`Listo: clave guardada para "${name}" → @${j.data?.account?.username} (plan ${j.data?.account?.plan}). Archivo: ${KEYS}`);
  } else if (cmd === 'check') {
    const a = account();
    const j = await rest(a.key, 'GET', '/analytics?period=7d');
    console.log(`[${a.name}] OK, @${j.data.account.username} (plan ${j.data.account.plan}), automatizaciones activas: ${j.data.active_automations}`);
  } else if (cmd === 'media') {
    const a = account();
    const m = await mcp(a.key, 'list_media');
    const list = m.media || (Array.isArray(m) ? m : null);
    if (!list) { console.log(typeof m === 'string' ? m : JSON.stringify(m, null, 2)); return; }
    for (const x of list) console.log(`${x.media_id} | ${x.type} | ${x.timestamp || ''} | ${x.permalink || ''} | ${String(x.caption || '').replace(/\s+/g, ' ').slice(0, 60)}`);
  } else if (cmd === 'list') {
    const a = account();
    const act = await activeSorted(a.key);
    if (!act.length) console.log(`[${a.name}] No hay automatizaciones activas.`);
    for (const x of act) console.log(`[${a.name}] ${x.id} | palabra=${x.trigger_keyword} | post=${x.media_id} | creada ${x.created_at}`);
  } else if (cmd === 'create') {
    const a = account();
    const c = loadConfig();
    let media = c.target || 'next';
    if (media === 'next') media = 'NEXT_MEDIA';
    else if (media === 'all') media = 'ALL_MEDIA';
    else if (media === 'latest') {
      const m = await mcp(a.key, 'list_media');
      const first = (m.media || []).find((x) => /reel/i.test(x.type)) || (m.media || [])[0];
      if (!first) die('No encontré publicaciones en la cuenta.');
      media = first.media_id;
      console.log(`Última publicación: ${first.permalink}`);
    }
    const args = { ...automationArgs(c), media_id: media };
    if (opt['dry-run']) { console.log('DRY-RUN: esto es exactamente lo que se crearía:\n' + JSON.stringify(args, null, 2)); return; }

    // Free plan: 3 active. Never delete on our own: the person picks which one goes (--replace <id>).
    const plan = String((await rest(a.key, 'GET', '/analytics?period=7d')).data?.account?.plan || '').toLowerCase();
    if (plan === 'free' || plan === 'gratis') {
      const act = await activeSorted(a.key);
      if (act.length >= FREE_ACTIVE) {
        if (!str('replace')) {
          die(`Tu plan gratis ya tiene ${act.length} de ${FREE_ACTIVE} automatizaciones activas:\n` +
            act.map((x) => `  ${x.id} | palabra=${x.trigger_keyword} | creada ${x.created_at}`).join('\n') +
            '\nPreguntale a la persona cuál borrar (o si prefiere pasar a un plan pago) y volvé a correr con --replace <id>.');
        }
        if (!act.some((x) => x.id === str('replace'))) die(`--replace ${str('replace')} no es ninguna de las activas.`);
        await rest(a.key, 'DELETE', '/automations/' + str('replace'));
        console.log(`Borrada ${str('replace')} para hacer lugar (lo eligió la persona).`);
      }
    }
    const res = await mcp(a.key, 'create_automation', args);
    if (!res?.automation_id) die('Respuesta inesperada de create_automation: ' + JSON.stringify(res));
    await verify(a.key, res.automation_id, args);
  } else if (cmd === 'update') {
    const a = account();
    if (!str('id')) die('Falta --id (sacalo de "list").');
    const c = loadConfig();
    const args = automationArgs(c); // update_automation no cambia el post (media_id): para eso, crear otra
    await mcp(a.key, 'update_automation', { automation_id: str('id'), ...args });
    await verify(a.key, str('id'), args);
  } else if (cmd === 'delete') {
    const a = account();
    if (!str('id')) die('Falta --id.');
    await rest(a.key, 'DELETE', '/automations/' + str('id'));
    console.log(`[${a.name}] Borrada ${str('id')}`);
  } else {
    die('Comando desconocido. Usá: setup | check | media | list | create | update | delete');
  }
}

main().catch((e) => { console.error(e instanceof Fail ? 'ERROR: ' + e.message : e); process.exit(1); });
