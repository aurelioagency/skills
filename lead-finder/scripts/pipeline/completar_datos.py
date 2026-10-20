"""Segunda pasada: completa los mails y teléfonos que faltan en un CSV de leads.

Uso:
  python completar_datos.py --rubro <id> --paises AR,MX --csv leads-nuevos.csv [--salida completados.jsonl] [--trabajo carpeta]

Para cada lead al que le falta mail o WhatsApp/teléfono busca, en este orden y solo en fuentes PROPIAS de la empresa:
  ficha de Google Maps (con la ciudad de la bio), página de Facebook (el título tiene que llevar la marca),
  directorios (Páginas Amarillas, Cybo; el título tiene que llevar la marca) y todas las páginas de contacto de su web
  (incluido el sitemap). Escribe lo hallado en un .jsonl; el CSV lo actualiza verificar_datos.py (que además controla todo).
"""
import json
import os
import re
import sys
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from leads_common import *  # noqa: F401,F403,E402
import leads_common as C  # noqa: E402

CITY = re.compile(r"(?:📍|ubicad[oa]s? en|en)\s*([A-ZÁÉÍÓÚ][\wáéíóúñ]+(?:\s[A-ZÁÉÍÓÚ][\wáéíóúñ]+)?)")


def title_of(tx):
    m = re.search(r"<title[^>]*>([^<]+)</title>", tx or "", re.I)
    return C.H.unescape(m.group(1)) if m else ""


def trabajar(r, cfg, bios):
    pais = r["Pais"]
    pc = cfg["paises"][pais]
    extra = cfg.get("palabras_genericas") or []
    h = C.handle_of(r["Instagram"])
    tk = (C.tok(r["Empresa"], extra) + C.tok(h, extra))[:4] or [C.nt(r["Empresa"])]
    em, wa, tel = {}, {}, {}
    webs = [w.strip() for w in re.split(r"[;,]", r["Web"]) if w.strip()]
    cm = CITY.search(bios.get(r["Empresa"], ""))
    city = cm.group(1) if cm else ""

    def add(d, vals, w):
        for v in vals:
            d.setdefault(v, w)

    # a) Google Maps con ciudad y con variantes del nombre
    for q in dict.fromkeys([f'{r["Empresa"]} {city} {pc["nombre"]}'.replace("  ", " "), f'{h.replace("_", " ").replace(".", " ")} {city} {pc["nombre"]}'.replace("  ", " ")]):
        x = C.stealth("https://www.google.com/maps/search/" + urllib.parse.quote(q), network_idle=True, wait=3500)
        if x is None:
            continue
        title = (x.css("title::text").get() or "").replace(" - Google Maps", "").strip()
        if not any(t in C.nt(title) for t in tk):
            continue
        w = x.css('a[data-item-id="authority"]::attr(href)').get() or ""
        for p in x.css('button[data-item-id^="phone"]::attr(aria-label)').getall():
            add(tel, C.phones_txt(p, pc), "ficha Google Maps")
        dm = re.sub(r"^https?://(www\.)?", "", w).split("/")[0].lower()
        if dm and not any(s in dm for s in C.SKIP_DOM) and not any(s in dm for s in C.ACORTADORES) and dm not in webs:
            webs.append(dm)
        elif "facebook.com" in w:
            y = C.stealth(w.split("?")[0].replace("www.", "m.") + "/about")
            if y is not None:
                tx = C.H.unescape(urllib.parse.unquote(y.body.decode("utf8", "ignore")))
                add(em, [e for e in C.emails_txt(tx) if "facebook" not in e], "Facebook de la empresa")
                add(wa, C.wa_txt(tx), "Facebook de la empresa")
        break
    # b) Facebook: el título de la página tiene que llevar la marca
    t = C.search(f'site:facebook.com "{r["Empresa"]}" {city} {pc["nombre"]}') + C.search(f"{h} facebook")
    fbs = []
    for m in re.finditer(r"facebook\.com/(?!sharer|tr\?|plugins|dialog|login|groups|events|watch|marketplace|photo|story|share|policies|help|public|pages/category|people)([A-Za-z0-9\.\-_]{4,60})", t):
        v = m.group(1).strip(".")
        if v not in fbs:
            fbs.append(v)
    for v in fbs[:5]:
        y = C.stealth(f"https://m.facebook.com/{v}/about")
        if y is None:
            continue
        tx = C.H.unescape(urllib.parse.unquote(y.body.decode("utf8", "ignore")))
        ttl = C.nt(title_of(tx))
        if not any(t_ in ttl or t_ in C.nt(v) for t_ in tk[:2]):
            continue
        add(em, [e for e in C.emails_txt(tx) if "facebook" not in e], "Facebook de la empresa")
        add(wa, C.wa_txt(tx), "Facebook de la empresa")
        for m in re.finditer(r'"(?:phone|telephone)"\s*:\s*"([^"]{8,25})"', tx):
            add(tel, C.phones_txt(m.group(1), pc), "Facebook de la empresa")
        if em or tel:
            break
    # c) directorios (el título tiene que llevar la marca)
    for dq in (pc.get("directorios") or ["cybo.com"]):
        tt = C.search(f'site:{dq} "{r["Empresa"]}" {city}')
        for m in list(re.finditer(r'https?://[^\s"<>]*' + re.escape(dq.split(".")[0]) + r'[^\s"<>]*', tt))[:2]:
            u = m.group(0).split("&")[0]
            tx = C.get(u)
            if not tx or not any(t_ in C.nt(title_of(tx)) for t_ in tk[:2]):
                continue
            add(tel, C.phones_txt(tx[:15000], pc), "directorio " + dq)
            add(em, [e for e in C.emails_txt(tx) if any(t_ in C.nt(e) for t_ in tk)], "directorio " + dq)
    # d) web propia: sitemap y todas las páginas de contacto
    for dm in webs[:2]:
        urls = ["", "/contacto", "/contact", "/contactanos", "/pages/contacto", "/nosotros", "/aviso-de-privacidad", "/politica-de-privacidad", "/quienes-somos", "/ubicacion", "/sucursales"]
        sm = C.get(f"https://{dm}/sitemap.xml")
        for m in re.finditer(r"<loc>([^<]+)</loc>", sm or ""):
            if re.search(r"contact|nosotros|about|sucursal|ubicacion|aviso|privacidad", m.group(1), re.I):
                urls.append(m.group(1))
        for u in list(dict.fromkeys(urls))[:12]:
            full = u if u.startswith("http") else "https://" + dm + u
            tx = C.get(full)
            if not tx:
                continue
            add(em, C.emails_txt(tx), "web propia " + dm)
            add(wa, C.wa_txt(tx), "web propia " + dm)
            for m in re.finditer(r'href="tel:([^"]{8,22})"', tx):
                add(tel, C.phones_txt(m.group(1), pc), "web propia " + dm)
            for m in re.finditer(r'mailto:([^"?]+)', tx):
                if not C.BADEM.search(m.group(1)):
                    add(em, [m.group(1).lower()], "web propia " + dm)
    em_f = {e: w for e, w in em.items() if w == "Facebook de la empresa" or any(e.split("@")[1].endswith(x) for x in webs) or any(t_ in C.nt(e) for t_ in tk)}
    wa_f, tel_f = {}, {}
    for k, v in wa.items():
        q = C.norm_phone(k, pc)
        if q:
            wa_f.setdefault(q, v)
    for k, v in tel.items():
        q = C.norm_phone(k, pc)
        if q and q not in wa_f:
            tel_f.setdefault(q, v)
    return dict(Empresa=r["Empresa"], webs=webs, em=em_f, wa=wa_f, tel=tel_f)


def main():
    cfg = C.config_from_args()
    path = C.arg_value("--csv")
    salida = C.arg_value("--salida", os.path.splitext(path)[0] + ".completados.jsonl")
    trabajo = C.arg_value("--trabajo", "trabajo-leads")
    C.check_browser()
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))
    bios = {}
    rj = os.path.join(trabajo, "res.jsonl")
    if os.path.exists(rj):
        for l in open(rj, encoding="utf8"):
            x = json.loads(l)
            bios[x["Empresa"]] = x.get("_bio", "")
    need = [r for r in rows if not r["Email"] or not (r["WhatsApp"] or r["Telefono"])]
    print("a completar", len(need), flush=True)
    with ThreadPoolExecutor(3) as ex, open(salida, "w", encoding="utf8") as fh:
        for i, x in enumerate(ex.map(lambda r: trabajar(r, cfg, bios), need)):
            fh.write(json.dumps(x, ensure_ascii=False) + "\n")
            fh.flush()
            if i % 10 == 0:
                print("P", i, len(need), flush=True)
    print("done:", salida, flush=True)


if __name__ == "__main__":
    main()
