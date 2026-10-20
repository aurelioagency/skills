"""Busca leads NUEVOS de un rubro (sin repetir lo que ya está en el Excel) y les saca el contacto.

Uso:
  python buscar_leads.py --rubro inmobiliarias --paises AR,MX --excel "<Excel>" --salida leads-nuevos.csv
         [--hoja Leads] [--previos otro.csv ...] [--trabajo carpeta_intermedios] [--limite-consultas N] [--prueba]
  (rubros en rubros.json, países en paises.json; o --config <archivo.json> con una configuración completa)

Etapas (cada una guarda su avance en --trabajo y se puede reanudar):
  A  buscar candidatos con Brave/Yahoo (tiendas de Mercado Libre y cuentas de Instagram)
  B  abrir cada tienda de Mercado Libre y quedarse solo con las del rubro (por los productos que vende)
  C  verificar en vivo cada cuenta de Instagram (rubro por la bio, mínimo de seguidores)
  D  contacto de cada lead, SOLO de fuentes propias (bio de Instagram, linktree, web propia, Facebook, ficha de Google Maps)
Deja un CSV para revisar. No escribe en el Excel (eso lo hace cargar_excel.py, y solo si el usuario lo pide).
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

OTROS_PAISES = re.compile(r"vzla|venez|caracas|valencia carabobo|maracay|maracaibo|barquisimeto|panam|\bpty\b|costa ?rica|honduras|guatemala|ecuador|quito|guayaquil|per[uú]\b|chile|argentin|bolivia|paraguay|uruguay|nicaragua|el salvador|dominican|puerto rico|miami|houston|espa[nñ]a|madrid|brasil|cashea|🇻🇪|🇦🇷|🇵🇦|🇨🇱", re.I)


def fuera_de_pais(texto, webs, emails, paises_ok):
    """True si el lead parece de otro país: web o mail con sufijo de otro país, o la bio lo dice."""
    if OTROS_PAISES.search(texto or ""):
        return True
    ok = tuple(s for p in paises_ok for s in C.TLD_PAIS.get(p, ()))
    for w in list(webs) + [e.split("@")[-1] for e in emails]:
        wl = w.lower().rstrip("/")
        for p, sufs in C.TLD_PAIS.items():
            if p in paises_ok:
                continue
            if any(wl.endswith(s) for s in sufs) and not any(wl.endswith(s) for s in ok):
                return True
    return False


def consultas(cfg):
    """Todas las consultas, intercaladas entre países y entre tipos de consulta: si se corta con --limite-consultas, queda algo de cada país."""
    from itertools import zip_longest
    por_pais = []
    for pais, pc in cfg["paises"].items():
        q = []
        for t in cfg["consultas"].get(pais, []):
            if "{marketplace}" in t["texto"] and not pc.get("marketplace"):
                continue  # ese país no tiene Mercado Libre
            lista = cfg["subrubros"].get(pais, []) if t["para"] == "subrubros" else cfg["zonas"].get(pais, [])
            q.append([(pais, t["texto"].format(marketplace=pc.get("marketplace") or "", x=x, palabra=cfg.get("palabra", {}).get(pais, ""), pais=pc["nombre"].lower())) for x in lista])
        por_pais.append([x for grupo in zip_longest(*q) for x in grupo if x] if q else [])
    return [x for grupo in zip_longest(*por_pais) for x in grupo if x]


def etapa_a(cfg, idx, trabajo, prueba):
    pat = re.compile(r"mercadolibre\.(?:com\.|co\.)?(ar|mx|co|cl|pe|uy|ec|cr|pa|ve|bo|py)/(tienda|pagina)/([A-Za-z0-9_\-\.]+)")
    igp = re.compile(r"instagram\.com/([A-Za-z0-9_\.]{3,30})(?:/|[^A-Za-z0-9_\.])")
    f = os.path.join(trabajo, "cands.json")
    cand = json.load(open(f, encoding="utf8")) if os.path.exists(f) else {"tie": {}, "ig": {}, "qs": []}
    Q = consultas(cfg)
    lim = C.arg_value("--limite-consultas")
    if lim:
        Q = Q[: int(lim)]
    if prueba:
        Q = Q[:2]
    hechas = set(cand["qs"])

    def doq(item):
        pais, q = item
        txt = ""
        for off in (0, 1):
            txt += C.fetch_serp("https://search.brave.com/search?q=" + urllib.parse.quote(q) + f"&offset={off}")
            time.sleep(2)
        for b in (1, 11):
            txt += C.fetch_serp("https://search.yahoo.com/search?p=" + urllib.parse.quote(q) + f"&b={b}")
            time.sleep(2)
        txt += C.fetch_serp("https://lite.duckduckgo.com/lite/?q=" + urllib.parse.quote(q))
        time.sleep(2)
        txt = urllib.parse.unquote(txt)
        if len(txt) < 5000:  # sin resultados (buscadores limitando): no se marca como hecha, queda para reintentar
            print("A", "sin resultados para:", q[:60], flush=True)
            return
        with C.LK:
            for m in pat.finditer(txt):
                if m.group(1).upper() != pais:
                    continue
                s = m.group(3).lower().rstrip(".")
                if s in idx["slugs"] or s.endswith("..."):
                    continue
                cand["tie"].setdefault(s, dict(pais=pais, kind=m.group(2), q=q))
            for m in igp.finditer(txt):
                g = m.group(1).lower().rstrip(".")
                if g in C.CUENTAS_IG_NO or g in idx["handles"]:
                    continue
                cand["ig"].setdefault(g, dict(pais=pais, q=q))
            cand["qs"].append(q)
            json.dump(cand, open(f, "w", encoding="utf8"), ensure_ascii=False)
            print("A", len(cand["qs"]), len(Q), len(cand["tie"]), len(cand["ig"]), flush=True)

    with ThreadPoolExecutor(3) as ex:
        list(ex.map(doq, [x for x in Q if x[1] not in hechas]))
    return cand


def etapa_b(cfg, cand, idx, trabajo, prueba):
    tm = cfg.get("tiendas_ml") or {}
    if not tm.get("activar"):
        return []
    prod = re.compile(tm["producto_regex"], re.I)
    exc = re.compile(tm["excluir_producto_regex"], re.I) if tm.get("excluir_producto_regex") else None
    desc = re.compile(cfg.get("descartar_nombre_regex") or "a^", re.I)
    marcas = [norm(m) for m in (cfg.get("descartar_marcas") or [])]

    def titles(u):
        for mode in ("f", "s"):
            try:
                r = C.Fetcher.get(u, stealthy_headers=True, timeout=30) if mode == "f" else C.StealthyFetcher.fetch(u, headless=True, network_idle=True, wait=2000)
                if r.status != 200:
                    continue
                t = [x.strip() for x in r.css(".poly-component__title::text").getall() if x.strip()]
                name = (r.css("title::text").get() or "").split("|")[0].strip()
                if t:
                    return name, t
            except Exception:
                time.sleep(1)
        return None, []

    def one(item):
        slug, info = item
        tld = cfg["paises"][info["pais"]].get("marketplace") or ""
        u = f"https://www.{tld}/{info['kind']}/{slug}"
        name, t = titles(u)
        a = sum(1 for x in t if prod.search(x))
        m = sum(1 for x in t if exc.search(x)) if exc else 0
        ok = bool(t) and a / len(t) >= tm.get("minimo_producto", 0.7) and m / len(t) < tm.get("maximo_excluido", 0.3)
        ok = ok and norm(name) not in idx["names"] and not desc.search(f"{name} {slug}") and norm(name) not in marcas
        return dict(slug=slug, url=u, pais=info["pais"], name=name or slug, n=len(t), ok=ok)

    items = list(cand["tie"].items())
    if prueba:
        items = items[:5]
    res = []
    with ThreadPoolExecutor(4) as ex:
        for i, r in enumerate(ex.map(one, items)):
            res.append(r)
            if i % 25 == 0:
                print("B", i, len(items), flush=True)
    json.dump(res, open(os.path.join(trabajo, "tiendas.json"), "w", encoding="utf8"), ensure_ascii=False)
    return [r for r in res if r["ok"]]


def contactos(ent, cfg, idx):
    pais = ent["pais"]
    pc = cfg["paises"][pais]
    extra = cfg.get("palabras_genericas", [])
    tk = C.tok(ent["name"], extra) + (C.tok(ent["ig"], extra) if ent.get("ig") else []) + C.tok(ent.get("slug", ""), extra)
    tk = tk[:6] or [C.nt(ent["name"])]
    em, wa, tel = {}, {}, {}

    def add(d, vals, where):
        for v in vals:
            d.setdefault(v, where)

    webs = []
    ig = C.ig_check(ent["ig"]) if ent.get("ig") else None
    if ig:
        add(em, C.emails_txt(ig["bio"]), "bio IG")
        add(wa, C.wa_txt(ig["bio"] + " " + " ".join(ig["links"])), "bio IG")
        add(tel, C.phones_txt(ig["bio"], pc), "bio IG")
        for l in ig["links"]:
            dm = re.sub(r"^https?://(www\.)?", "", l).split("/")[0].lower()
            if any(s in dm for s in ("linktr", "beacons", "linkin.bio", "taplink", "bio.link", "msha.ke")):
                t = C.get(l)
                add(wa, C.wa_txt(t), "linktree")
                add(em, C.emails_txt(t), "linktree")
            elif dm and not any(s in dm for s in C.SKIP_DOM) and not any(s in dm for s in C.ACORTADORES):
                webs.append(dm)
    # ficha de Google Maps: solo vale si el nombre de la ficha lleva la marca
    r = C.stealth("https://www.google.com/maps/search/" + urllib.parse.quote(f'{ent["name"]} {pc["nombre"]}'), network_idle=True, wait=3500)
    if r is not None:
        title = (r.css("title::text").get() or "").replace(" - Google Maps", "").strip()
        if any(x in C.nt(title) for x in tk[:4]):
            w = r.css('a[data-item-id="authority"]::attr(href)').get() or ""
            for p in r.css('button[data-item-id^="phone"]::attr(aria-label)').getall():
                add(tel, C.phones_txt(p, pc), "ficha Google Maps")
            dm = re.sub(r"^https?://(www\.)?", "", w).split("/")[0].lower()
            if dm and not any(s in dm for s in C.SKIP_DOM) and not any(s in dm for s in C.ACORTADORES):
                webs.append(dm)
            elif "facebook.com" in w:
                y = C.stealth(w.split("?")[0].replace("www.", "m.") + "/about")
                if y is not None:
                    tx = C.H.unescape(urllib.parse.unquote(y.body.decode("utf8", "ignore")))
                    add(em, [e for e in C.emails_txt(tx) if "facebook" not in e], "Facebook de la empresa")
                    add(wa, C.wa_txt(tx), "Facebook de la empresa")
    # Facebook: el nombre de la página tiene que llevar la marca
    t = C.search(f'site:facebook.com "{ent["name"]}" {pc["nombre"].lower()}')
    fbs = []
    for m in re.finditer(r"facebook\.com/(?!sharer|tr\?|plugins|dialog|login|groups|events|watch|marketplace|photo|story|share|policies|help|public|pages/category)([A-Za-z0-9\.\-_]{4,60})", t):
        v = m.group(1).strip(".")
        hv, key = C.nt(v), C.nt(ent["name"])
        if (key and (key in hv or hv in key) and len(hv) >= 5) or (ent.get("ig") and C.nt(ent["ig"]) in hv):
            if v not in fbs:
                fbs.append(v)
    for v in fbs[:2]:
        y = C.stealth(f"https://m.facebook.com/{v}/about")
        if y is None:
            continue
        tx = C.H.unescape(urllib.parse.unquote(y.body.decode("utf8", "ignore")))
        add(em, [e for e in C.emails_txt(tx) if "facebook" not in e], "Facebook de la empresa")
        add(wa, C.wa_txt(tx), "Facebook de la empresa")
    # web propia (linkeada desde Instagram o Maps): home + páginas de contacto
    for dm in list(dict.fromkeys(webs))[:2]:
        home = C.get("https://" + dm)
        paths = ["", "/contacto", "/contact", "/contactanos", "/pages/contacto", "/nosotros", "/aviso-de-privacidad", "/politica-de-privacidad"]
        for m in re.finditer(r'href="([^"#]+)"', home or ""):
            hh = m.group(1)
            if re.search(r"contact|nosotros|about|quienes|privacidad|sucursal|ubicacion", hh, re.I) and hh.startswith("/"):
                paths.append(hh)
        for p in list(dict.fromkeys(paths))[:9]:
            tx = C.get("https://" + dm + p)
            if not tx:
                continue
            add(em, C.emails_txt(tx), "web propia " + dm)
            add(wa, C.wa_txt(tx), "web propia " + dm)
            for m in re.finditer(r'href="tel:([^"]{8,22})"', tx):
                add(tel, C.phones_txt(m.group(1), pc), "web propia " + dm)
    wa_f = {}
    for k, v in wa.items():
        q = C.norm_phone(k, pc)
        if q:
            wa_f.setdefault(q, v)
    tel_f = {}
    for k, v in tel.items():
        q = C.norm_phone(k, pc)
        if q and q not in wa_f:
            tel_f.setdefault(q, v)
    ph_all = {C.d10(k) for k in list(wa_f) + list(tel_f)}
    dup = bool(ph_all & idx["phones"]) or any(dm in idx["domains"] for dm in webs)
    # un mail solo vale si es de la web propia, lleva la marca, o salió de la bio / linktree / Facebook de la empresa
    em_f = {}
    for e, w in em.items():
        dom = e.split("@")[1]
        if w in ("bio IG", "linktree", "Facebook de la empresa") or any(dom.endswith(x) for x in webs) or any(x in C.nt(e) for x in tk):
            if e not in idx["emails"]:
                em_f[e] = w
    texto = " ".join([ent["name"], ig["bio"] if ig else "", ent.get("ig", "")])
    ajeno = fuera_de_pais(texto, webs, list(em_f), list(cfg["paises"]))
    row = dict(Empresa=(ig["name"] if ig and ig["name"] else ent["name"]), Pais=pais, Rubro=cfg.get("rubro_nombre", ""), Fuente=ent["fuente"], Tienda_MercadoLibre=ent.get("ml", ""),
               Instagram=(f"https://www.instagram.com/{ent['ig']}/" if ig else ""), Seguidores_IG=(ig["followers"] if ig else ""),
               Web=", ".join(dict.fromkeys(webs)), Email="; ".join(list(em_f)[:2]), WhatsApp="; ".join(list(wa_f)[:2]), Telefono="; ".join(list(tel_f)[:2]),
               De_donde_sale=" | ".join([f"mail {e}: {w}" for e, w in list(em_f.items())[:2]] + [f"WA {p}: {w}" for p, w in list(wa_f.items())[:2]] + [f"tel {p}: {w}" for p, w in list(tel_f.items())[:2]]),
               _dup=dup or ajeno)
    row["Estado"] = C.estado(row)
    return row


def main():
    cfg = C.config_from_args()
    excel = C.arg_value("--excel")
    hoja = C.arg_value("--hoja", "Leads")
    salida = C.arg_value("--salida", "leads-nuevos.csv")
    trabajo = C.arg_value("--trabajo", "trabajo-leads")
    prueba = "--prueba" in sys.argv
    os.makedirs(trabajo, exist_ok=True)
    C.check_browser()
    idx = C.build_index(excel, hoja, C.arg_list("--previos"))
    print("indice:", {k: len(v) for k, v in idx.items()}, flush=True)
    cand = etapa_a(cfg, idx, trabajo, prueba)
    tiendas = etapa_b(cfg, cand, idx, trabajo, prueba)
    print("tiendas del rubro:", len(tiendas), flush=True)
    ents = [dict(name=t["name"], pais=t["pais"], slug=t["slug"], ml=t["url"], ig="", fuente="Tienda Mercado Libre") for t in tiendas]
    ic = cfg.get("instagram") or {}
    bio_ok = re.compile(ic.get("bio_regex", "."), re.I)
    bio_no = re.compile(ic.get("excluir_regex", "a^"), re.I)

    def chk(item):
        h, info = item
        c = C.ig_check(h)
        time.sleep(2)
        if not c or C.fol(c["followers"]) < ic.get("min_seguidores", 20):
            return None
        blob = c["name"] + " " + c["bio"]
        if not bio_ok.search(blob + " " + h) or bio_no.search(blob) or OTROS_PAISES.search(blob):
            return None
        return dict(name=c["name"], pais=info["pais"], slug="", ml="", ig=h, fuente="Instagram")

    items = list(cand["ig"].items())[: (5 if prueba else None)]
    with ThreadPoolExecutor(2) as ex:
        for i, r in enumerate(ex.map(chk, items)):
            if r:
                ents.append(r)
            if i % 25 == 0:
                print("C", i, len(items), len(ents), flush=True)
    print("entidades:", len(ents), flush=True)
    res = []
    with ThreadPoolExecutor(3) as ex, open(os.path.join(trabajo, "res.jsonl"), "a", encoding="utf8") as fh:
        for i, r in enumerate(ex.map(lambda e: contactos(e, cfg, idx), ents)):
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
            fh.flush()
            res.append(r)
            if i % 10 == 0:
                print("D", i, len(ents), flush=True)
    seen, final = set(), []
    for r in res:
        if r["_dup"]:
            continue
        k = norm(r["Empresa"])
        if k in idx["names"] or k in seen:
            continue
        h = handle_of(r["Instagram"])
        if h and h in idx["handles"]:
            continue
        if not (r["Email"] or r["WhatsApp"] or r["Telefono"] or r["Instagram"]):
            continue
        seen.add(k)
        final.append(r)
    C.write_csv(salida, final)
    print("FINAL", len(final), "mail", sum(bool(r["Email"]) for r in final), "wa|tel", sum(bool(r["WhatsApp"] or r["Telefono"]) for r in final), "ig", sum(bool(r["Instagram"]) for r in final), flush=True)
    print("CSV:", salida, flush=True)


if __name__ == "__main__":
    main()
