"""Funciones compartidas del pipeline de búsqueda de leads (cualquier rubro).

Todo lo que lee páginas usa Scrapling (Fetcher / StealthyFetcher). Nada de lo que hay
acá envía mensajes ni toca redes sociales con sesión: solo lectura pública.
"""
import csv
import html as H
import json
import logging
import os
import re
import sys
import threading
import time
import unicodedata
import urllib.parse

sys.stdout.reconfigure(encoding="utf-8")
logging.disable(logging.CRITICAL)

from scrapling.fetchers import Fetcher, StealthyFetcher  # noqa: E402

LK = threading.Lock()

STOP_NOMBRE = {"sa", "srl", "s", "a", "de", "cv", "sas", "ltda", "tienda", "oficial", "y", "the", "el", "la", "los", "las", "mx", "ar", "co"}
# palabras genéricas que no sirven para reconocer una marca (se agregan las del rubro desde la config)
STOP_MARCA = ("tienda", "oficial", "pagina", "vendedor", "mercado", "libre", "mexico", "colombia", "store", "shop", "sucursal", "importadora", "distribuidora")

EM = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*\.(?:com|mx|co|net|org|shop|store)\b")
BADEM = re.compile(r"ejemplo|dominio|domain|godaddy|correo\.com|empresa\.com|sentry|wixpress|example|@2x|\.png|\.jpg|\.webp|tuemail|email\.com|yourmail|name@|usuario@|tu@|user@|shopify|wordpress|elementor|mercadolibre|brave|instagram|facebook|linktr|wa\.link", re.I)
SKIP_DOM = ("mercadolibre", "mercadoshops", "facebook", "youtube", "tiktok", "yahoo", "yimg", "oath", "bing", "google", "wikipedia", "linkedin", "pinterest", "olx", "seccionamarilla", "empresite", "cylex", "indeed", "twitter", "amazon", "paginasamarillas", "cybo", "instagram", "brave", "whatsapp", "wa.me", "linktr", "waze", "maps.app")
ACORTADORES = ("bit.ly", "g.co", "wa.link", "goo.gl", "linktr.ee", "tinyurl", "cutt.ly", "ow.ly", "t.co", "lnk.bio", "beacons.ai", "taplink.cc", "carrd.co", "instabio.cc", "walink.co")
CUENTAS_IG_NO = {"p", "reel", "reels", "explore", "accounts", "about", "stories", "tv", "popular", "mercadolibre", "mercadolibremx", "mercadolibreco"}
# sufijos de web de OTRO país (se filtran contra la lista de países válidos de la config)
TLD_PAIS = {"AR": (".com.ar", ".ar"), "MX": (".com.mx", ".mx"), "CO": (".com.co", ".co"), "VE": (".com.ve", ".ve"), "PE": (".com.pe", ".pe"), "CL": (".cl",),
            "EC": (".com.ec", ".ec"), "PA": (".com.pa", ".pa"), "HN": (".hn",), "CR": (".cr",), "GT": (".com.gt", ".gt"), "BO": (".com.bo", ".bo"),
            "PY": (".com.py", ".py"), "UY": (".com.uy", ".uy"), "ES": (".es",), "BR": (".com.br", ".br")}


# ---------------- configuración ----------------
def load_config(path):
    cfg = json.load(open(path, encoding="utf-8"))
    cfg.setdefault("paises", {})
    return cfg


def arg_value(flag, default=None):
    if flag in sys.argv:
        i = sys.argv.index(flag)
        return sys.argv[i + 1] if i + 1 < len(sys.argv) else default
    return default


def arg_list(flag):
    out = []
    for i, a in enumerate(sys.argv):
        if a == flag and i + 1 < len(sys.argv):
            out.append(sys.argv[i + 1])
    return out


# ---------------- normalización ----------------
def norm(s, extra_stop=()):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    stop = STOP_NOMBRE | set(extra_stop)
    return "".join(w for w in re.split(r"[^a-z0-9]+", s) if w and w not in stop)


def nt(s):
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower())


def tok(s, extra_stop=()):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower()
    stop = set(STOP_MARCA) | set(extra_stop)
    return [t for t in re.split(r"[^a-z0-9]+", s) if len(t) > 3 and t not in stop]


def d10(p):
    return re.sub(r"\D", "", str(p))[-10:]


def split(v):
    return [p.strip() for p in (v or "").split(";") if p.strip()]


def handle_of(v):
    m = re.search(r"instagram\.com/([A-Za-z0-9_\.]+)", str(v or ""))
    return m.group(1).lower().strip(".") if m else ""


def jdec(s):
    try:
        return json.loads('"' + s + '"')
    except Exception:
        return s


def fol(s):
    try:
        return float(str(s).replace(",", "").replace("K", "e3").replace("k", "e3").replace("M", "e6"))
    except Exception:
        return 0


# ---------------- red (Scrapling) ----------------
def get(u, to=20):
    try:
        r = Fetcher.get(u, stealthy_headers=True, timeout=to)
        if r.status == 200:
            return H.unescape(urllib.parse.unquote(r.body.decode("utf8", "ignore")))
    except Exception:
        pass
    return ""


def stealth(u, **kw):
    try:
        return StealthyFetcher.fetch(u, headless=True, **kw)
    except Exception:
        return None


def check_browser():
    """Si el navegador de Scrapling no está instalado, avisa y corta (no instala solo)."""
    try:
        StealthyFetcher.fetch("https://www.wikipedia.org", headless=True)
    except Exception as e:  # noqa: BLE001
        msg = str(e)
        if "Executable doesn't exist" in msg or "playwright install" in msg or "patchright install" in msg:
            print("FALTA EL NAVEGADOR DE SCRAPLING. Pedirle OK al usuario y correr:  python -m patchright install chromium")
            sys.exit(3)
        # cualquier otro error (red, sitio caído) no significa que falte el navegador: se sigue


def search(q):
    """Brave + Yahoo. Google y Bing bloquean a Scrapling (captcha o resultados basura)."""
    out = ""
    for u in ("https://search.brave.com/search?q=" + urllib.parse.quote(q), "https://search.yahoo.com/search?p=" + urllib.parse.quote(q)):
        r = stealth(u)
        if r is not None:
            out += r.body.decode("utf8", "ignore")
        time.sleep(1.5)
    return H.unescape(urllib.parse.unquote(out))


# ---------------- teléfonos / mails ----------------
def norm_phone(p, pais_cfg):
    """Devuelve +<prefijo><número nacional> o None. pais_cfg: {"prefijo":"52","largo":10,"inicio_valido":"36"(opcional)}."""
    pre = str(pais_cfg["prefijo"])
    largo = int(pais_cfg.get("largo", 10))
    d = re.sub(r"\D", "", p)
    if pre == "52" and d.startswith("521") and len(d) == 13:
        d = d[3:]
    elif d.startswith(pre) and len(d) == len(pre) + largo:
        d = d[len(pre):]
    if len(d) != largo:
        return None
    ini = pais_cfg.get("inicio_valido")
    if ini and d[0] not in ini:
        return None
    return "+" + pre + d


def phones_txt(t, pais_cfg):
    out = set()
    t = unicodedata.normalize("NFKC", t)
    for m in re.finditer(r"(?:\+?\(?\d{1,3}\)?[\s\-.]?)?(?:1[\s\-.]?)?\(?\d{2,3}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}", t):
        q = norm_phone(m.group(0), pais_cfg)
        if q:
            out.add(q)
    return out


def wa_txt(t):
    return {"+" + m.group(1) for m in re.finditer(r"(?:wa\.me/|phone=|whatsapp\.com/send\?phone=)\+?(\d{10,15})", t)}


def emails_txt(t):
    return [e.lower() for e in EM.findall(t) if not BADEM.search(e)]


# ---------------- Instagram (lectura pública) ----------------
def ig_check(h):
    t = get(f"https://www.instagram.com/{h}/")
    m = re.search(r'property="og:title" content="([^"]+)"', t) if t else None
    if not m:
        return None
    d = re.search(r'property="og:description" content="([^"]+)"', t)
    desc = H.unescape(d.group(1)) if d else ""
    f = re.search(r"([\d,\.]+[KkMm]?) Followers", desc)
    b = re.search(r'"biography":"((?:[^"\\]|\\.)*)"', t)
    ext = re.findall(r'"url":"(https?:[^"]+)"', t)
    return dict(h=h, name=H.unescape(m.group(1)).split("(@")[0].strip(), followers=f.group(1) if f else "",
                bio=jdec(b.group(1)) if b else desc, links=[jdec(x) for x in ext if "instagram" not in x and "fbcdn" not in x][:4])


# ---------------- índice anti-duplicados ----------------
def _hcols(header):
    h = {}
    for i, c in enumerate(header):
        if c:
            h[str(c)] = i
    return h


def _find(h, *keys):
    """Primera columna cuyo encabezado contiene alguna de las palabras (ignora 'enviado', 'fecha', 'entrega', 'próxima')."""
    for k, i in h.items():
        kl = k.lower()
        if any(x in kl for x in ("enviado", "fecha", "entrega", "próxima", "proxima")):
            continue
        if any(x in kl for x in keys):
            return i
    return None


def build_index(xlsx, hoja="Leads", csvs=()):
    """Lee el Excel (solo lectura) y los CSV de entregas previas. Devuelve sets de nombres, handles, dominios, teléfonos, slugs, mails."""
    import openpyxl

    idx = dict(names=set(), handles=set(), domains=set(), phones=set(), slugs=set(), emails=set())
    FREE = ("gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "yahoo.com.mx", "live.com", "icloud.com", "hotmail.es", "live.com.mx", "gmx.com")
    wb = openpyxl.load_workbook(xlsx, read_only=True, keep_vba=xlsx.lower().endswith(".xlsm"), data_only=True)
    ws = wb[hoja]
    rows = list(ws.iter_rows(values_only=True))
    h = _hcols(rows[0])
    c_emp, c_ig, c_em, c_web = _find(h, "empresa"), _find(h, "instagram"), _find(h, "email", "mail"), _find(h, "web")
    c_tel = [i for k, i in h.items() if any(x in k.lower() for x in ("tel", "whatsapp")) and "enviado" not in k.lower() and "fecha" not in k.lower()]
    c_ml = [i for k, i in h.items() if any(x in k.lower() for x in ("tienda", "nota"))]
    for r in rows[1:]:
        if c_emp is None or not r[c_emp]:
            continue
        idx["names"].add(norm(r[c_emp]))
        if c_ig is not None and handle_of(r[c_ig]):
            idx["handles"].add(handle_of(r[c_ig]))
        if c_em is not None:
            for e in re.findall(r"[\w\.\-+]+@[\w\.\-]+", str(r[c_em] or "")):
                idx["emails"].add(e.lower())
                if e.split("@")[1].lower() not in FREE:
                    idx["domains"].add(e.split("@")[1].lower())
        if c_web is not None:
            for d in re.findall(r"(?:https?://)?(?:www\.)?([a-z0-9\-\.]+\.[a-z]{2,})", str(r[c_web] or "").lower()):
                idx["domains"].add(d)
        for i in c_tel:
            for d in re.findall(r"\d[\d\s\-()]{8,}\d", str(r[i] or "")):
                if len(re.sub(r"\D", "", d)) >= 10:
                    idx["phones"].add(d10(d))
        for i in c_ml:
            for m in re.finditer(r"mercadolibre\.com\.\w+/(?:tienda|pagina|perfil)/([A-Za-z0-9_\-\.%]+)", str(r[i] or "")):
                idx["slugs"].add(m.group(1).lower().strip("/"))
    for p in csvs:
        if not os.path.exists(p):
            continue
        for o in csv.DictReader(open(p, encoding="utf-8-sig")):
            idx["names"].add(norm(o.get("Empresa")))
            if handle_of(o.get("Instagram")):
                idx["handles"].add(handle_of(o["Instagram"]))
            for pp in split(o.get("WhatsApp")) + split(o.get("Telefono")):
                idx["phones"].add(d10(pp))
            for e in split(o.get("Email")):
                idx["emails"].add(e.lower())
            for d in re.findall(r"[a-z0-9\-\.]+\.[a-z]{2,}", (o.get("Web") or "").lower()):
                idx["domains"].add(d)
            for m in re.finditer(r"mercadolibre\.com\.\w+/(?:tienda|pagina)/([A-Za-z0-9_\-\.%]+)", o.get("Tienda_MercadoLibre") or ""):
                idx["slugs"].add(m.group(1).lower().strip("/"))
    return idx


def estado(o):
    ph = bool(o.get("WhatsApp") or o.get("Telefono"))
    falt = [n for n, ok in (("Instagram", bool(o.get("Instagram"))), ("mail", bool(o.get("Email"))), ("WhatsApp/tel", ph)) if not ok]
    return "Completo" if not falt else "Falta: " + ", ".join(falt) + " (no publicado en fuentes propias)"


CSV_COLS = ["Empresa", "Pais", "Fuente", "Tienda_MercadoLibre", "Instagram", "Seguidores_IG", "Web", "Email", "WhatsApp", "Telefono", "De_donde_sale", "Estado"]


def write_csv(path, rows):
    with open(path, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=CSV_COLS, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
