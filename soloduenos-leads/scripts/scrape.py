#!/usr/bin/env python3
"""Scrapea soloduenos.com con Scrapling y vuelca los avisos a un Excel (fuente de verdad).

Uso:
  python scrape.py login                         # abre el navegador del perfil para iniciar sesion a mano (una vez)
  python scrape.py run --excel RUTA.xlsx [--max-pages 3] [--ops venta alquiler alquiler_temporario]
                       [--zona "capital federal"] [--sin-contacto] [--headless]

El Excel se actualiza por link: lo nuevo se agrega, lo existente no se pisa
(las columnas de gestion quedan intactas). Los campos de contacto se completan
solo si estan vacios.
"""
import argparse, json, re, sys, time, unicodedata, datetime, urllib.request
from pathlib import Path

from openpyxl import Workbook, load_workbook
from scrapling.fetchers import DynamicSession

BASE = "https://www.soloduenos.com"
FUENTE = "soloduenos.com"
PROFILE = Path.home() / ".soloduenos-profile"
STATE = PROFILE / "state.json"  # cookies + localStorage de la sesion iniciada a mano

COLUMNAS = [
    "ID", "Fuente", "Link publicación", "Fecha de captura",
    "Nombre del dueño", "Teléfono / WhatsApp", "Email", "Otro contacto",
    "Tipo", "Operación", "Zona", "Precio y moneda", "Características",
    "Detalle breve", "Días publicado",
    "Estado de contacto", "Fecha de contacto", "Notas",
]
GESTION = {"Estado de contacto", "Fecha de contacto", "Notas"}


def norm(s):
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower()



# ---------- contacto en descripcion y fotos ----------
_OCR = None
RE_TEL = re.compile(r"(?<![\d$])(?:\+?54[\s\-\.]*)?(?:9[\s\-\.]*)?(?:\(?0?\d{2,4}\)?[\s\-\.]*)?(?:15[\s\-\.]*)?\d{3,4}[\s\-\.]*\d{4}(?!\d)")
RE_MAIL = re.compile(r"[\w\.\-+]+@[\w\-]+(?:\.[\w\-]+)+")
RE_IG = re.compile(r"(?:instagram\.com/|insta(?:gram)?\s*[:\-]?\s*@?|ig\s*[:\-]\s*@?|(?<![\w.])@)([A-Za-z0-9_.]{3,30})", re.I)


def _motor():
    global _OCR
    if _OCR is None:
        from rapidocr_onnxruntime import RapidOCR
        _OCR = RapidOCR()
    return _OCR


def _bajar(url, ancho=None):
    """Descarga una foto; con `ancho` pide la miniatura que sirve el propio storage (mucho más liviana)."""
    if ancho:
        url = url.replace("/object/public/", "/render/image/public/") + f"?width={ancho}"
    try:
        return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=20).read()
    except Exception:
        return None


def puntaje_texto(data):
    """Detección de texto SIN leerlo (rápido): fracción de la foto cubierta por cajas de texto."""
    import numpy as np, cv2
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return 0.0, 0
    res, _ = _motor()(img, use_det=True, use_cls=False, use_rec=False)
    if not res:
        return 0.0, 0
    area = 0.0
    for box in res:
        box = box[0] if isinstance(box[0][0], (list, tuple)) else box
        xs, ys = [p[0] for p in box], [p[1] for p in box]
        area += (max(xs) - min(xs)) * (max(ys) - min(ys))
    return area / (img.shape[0] * img.shape[1]), len(res)


def ocr_texto(data):
    res, _ = _motor()(data)
    return " ".join(r[1] for r in res) if res else ""


def extraer_contactos(texto):
    """Teléfonos, mails e Instagram dentro de un texto libre."""
    tels = []
    for m in RE_TEL.finditer(texto):
        dig = re.sub(r"\D", "", m.group(0))
        if 10 <= len(dig) <= 13 and not dig.startswith(("0000", "1111")):
            tels.append(m.group(0).strip())
    mails = [m for m in RE_MAIL.findall(texto) if not m.lower().endswith(("png", "jpg", "webp"))]
    igs = [i for i in RE_IG.findall(texto) if not i.lower().endswith((".com", ".ar")) and i.lower() not in ("gmail", "hotmail", "yahoo")]
    uniq = lambda l: list(dict.fromkeys(l))
    return uniq(tels), uniq(mails), uniq(igs)


def contactos_aviso(descripcion, imagenes, max_fotos, min_texto=0.01, min_cajas=2):
    """Contactos de la descripción y, si no alcanza, de las fotos que tienen texto.

    1) Descripción (gratis). 2) Miniaturas en paralelo + detección de texto sin leer.
    3) OCR completo solo en las fotos con texto, de más a menos texto, cortando al primer contacto.
    """
    from concurrent.futures import ThreadPoolExecutor
    r = {"tel": [], "mail": [], "ig": [], "origen": [], "fotos": 0, "con_texto": 0, "leidas": 0}

    def sumar(texto, origen):
        t, m, i = extraer_contactos(texto)
        for k, v in (("tel", t), ("mail", m), ("ig", i)):
            for x in v:
                if x not in r[k]:
                    r[k].append(x)
                    r["origen"].append(f"{k} en {origen}")
        return bool(t or m or i)

    if sumar(descripcion or "", "descripción") or not imagenes or max_fotos == 0:
        return r
    fotos = imagenes[:max_fotos]
    r["fotos"] = len(fotos)
    with ThreadPoolExecutor(6) as ex:
        minis = list(ex.map(lambda u: _bajar(u, 400), fotos))
    cand = []
    for n, (u, mini) in enumerate(zip(fotos, minis), 1):
        if mini:
            frac, cajas = puntaje_texto(mini)
            if frac >= min_texto and cajas >= min_cajas:
                cand.append((frac, n, u))
    r["con_texto"] = len(cand)
    for frac, n, u in sorted(cand, reverse=True):
        data = _bajar(u, 1000)
        r["leidas"] += 1
        if data and sumar(ocr_texto(data), f"foto {n} (OCR, verificar)"):
            break
    return r

# ---------- Excel ----------
def abrir_excel(path):
    path = Path(path)
    if path.exists():
        wb = load_workbook(path)
        ws = wb["Leads"]
    else:
        wb = Workbook()
        ws = wb.active
        ws.title = "Leads"
        ws.append(COLUMNAS)
        wb.create_sheet("Corridas").append(["Fecha", "Operaciones", "Zona", "Avisos vistos", "Nuevos", "Con contacto"])
        ws.freeze_panes = "A2"
        for col, w in zip("ABCDEFGHIJKLMNOPQR", [10, 15, 50, 16, 22, 20, 24, 20, 14, 12, 28, 18, 36, 60, 10, 18, 16, 30]):
            ws.column_dimensions[col].width = w
    return wb, ws


def indice_por_link(ws):
    hdr = [c.value for c in ws[1]]
    ci = hdr.index("Link publicación") + 1
    return hdr, {ws.cell(r, ci).value: r for r in range(2, ws.max_row + 1) if ws.cell(r, ci).value}


# ---------- Scrapling ----------
def listar_links(session, op, max_pages):
    links, vistos = [], set()
    for page in range(1, max_pages + 1):
        r = session.fetch(f"{BASE}/buscar?operation_type={op}&page={page}", wait_selector="a[href*='/propiedades/']")
        nuevos = [h for h in r.css("a[href*='/propiedades/']::attr(href)").getall()]
        nuevos = [h if h.startswith("http") else BASE + h for h in nuevos]
        nuevos = [h for h in dict.fromkeys(nuevos) if h not in vistos]
        if not nuevos:
            break
        vistos.update(nuevos)
        links += nuevos
        time.sleep(1)
    return links


def accion_detalle(con_contacto, out):
    """page_action: si se pide contacto, abre el boton de WhatsApp y junta lo que aparezca."""
    def _accion(page):
        if not con_contacto:
            return
        try:
            popups = []
            page.context.on("page", lambda p: popups.append(p))
            page.locator("button:has-text('Contactar por WhatsApp')").first.click(timeout=4000)
            page.wait_for_timeout(2500)
            out["login"] = bool(re.search(r"Ingres[aá].{0,40}cre[aá] tu cuenta", page.inner_text("body")))
            hrefs = page.eval_on_selector_all(
                "a[href*='wa.me'],a[href*='whatsapp'],a[href^='tel:'],a[href^='mailto:']", "e=>e.map(x=>x.href)")
            out["contacto"] = " | ".join(hrefs)
            if popups:
                out["contacto"] += " | " + popups[0].url
                popups[0].close()
        except Exception:
            pass
    return _accion


def parsear(url, body):
    lines = [l.strip() for l in body.splitlines() if l.strip()]
    d = {"url": url}
    m = re.search(r"/propiedades/(venta|alquiler-temporario|alquiler)-", url)
    d["operacion"] = {"venta": "Venta", "alquiler": "Alquiler", "alquiler-temporario": "Alquiler temporario"}.get(m.group(1), "") if m else ""
    m = re.search(r"C[oó]digo\s*[·•\-]?\s*#?(\d+)", body)
    d["id"] = m.group(1) if m else url.rsplit("-", 5)[-5:][0]
    d["titulo"], d["zona"], d["tipo"] = "", "", ""
    for i, l in enumerate(lines):
        if re.match(r"C[oó]digo", l):
            d["titulo"] = lines[i - 1] if i else ""
            d["zona"] = lines[i + 1] if i + 1 < len(lines) else ""
            break
    m = re.search(r"/propiedades/[a-z\-]+?-(departamento|casa|ph|oficina|local|terreno|campo|cochera|galpon|propiedad)-", url)
    d["tipo"] = ("PH" if m and m.group(1) == "ph" else m.group(1).capitalize()) if m else ""
    m = re.search(r"((?:US\$|\$|USD)\s*[\d\.\,]+)", body)
    d["precio"] = m.group(1).replace(" ", " ") if m else ""
    car = []
    for l in lines:
        if re.search(r"\b(m² (cubiertos|totales)|ambientes?|dormitorios?|baños?|cocheras?|a[nñ]os)\b", l) and len(l) < 40:
            car.append(l)
    d["caracteristicas"] = ", ".join(dict.fromkeys(car))
    desc = ""
    if "Descripción" in lines:
        i = lines.index("Descripción")
        desc = lines[i + 1] if i + 1 < len(lines) else ""
    d["descripcion"] = desc
    d["nombre"] = ""
    for i, l in enumerate(lines):
        if l.startswith("Dueño/a") and i + 1 < len(lines) and lines[i + 1] not in ("Dueño", "Dueño/a"):
            d["nombre"] = lines[i + 1]
    return d


def detalle_breve(d):
    base = " ".join(x for x in [d["tipo"], d["caracteristicas"].split(",")[0] if d["caracteristicas"] else "", "en", d["zona"].split(",")[0]] if x)
    extra = d["descripcion"].split(".")[0][:140]
    return f"{base}. {extra}".strip(". ") if extra else base


def parsear_contacto(txt, popup):
    blob = f"{txt} {popup}"
    tel = ""
    m = re.search(r"wa\.me/(\d+)|phone=(\d+)|tel:(\+?\d+)", blob)
    if m:
        tel = next(g for g in m.groups() if g)
    mail = re.search(r"mailto:([^\s|?]+)", blob)
    return tel, (mail.group(1) if mail else "")


# ---------- comandos ----------
def cmd_login(_):
    print(f"Se abre un navegador. Inicia sesion en soloduenos.com y despues cerra la ventana. Sesion en {STATE}")
    from playwright.sync_api import sync_playwright
    PROFILE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(str(PROFILE / "chromium"), headless=False)
        (ctx.pages[0] if ctx.pages else ctx.new_page()).goto(f"{BASE}/auth")
        try:
            while ctx.pages:
                ctx.storage_state(path=str(STATE))
                time.sleep(2)
        except Exception:
            pass
    print("Sesion guardada." if STATE.exists() else "No se guardo sesion.")


def opciones_sesion():
    """Restaura la sesion guardada (cookies + localStorage) si existe."""
    import json
    if not STATE.exists():
        return {}
    st = json.loads(STATE.read_text(encoding="utf8"))
    ls = {}
    for o in st.get("origins", []):
        if "soloduenos.com" in o["origin"]:
            ls = {i["name"]: i["value"] for i in o["localStorage"]}
    js = "try{const d=%s;for(const k in d)localStorage.setItem(k,d[k])}catch(e){}" % json.dumps(ls)
    return {"cookies": st.get("cookies", []), "init_script_text": js}


def cmd_run(a):
    wb, ws = abrir_excel(a.excel)
    hdr, idx = indice_por_link(ws)
    zona_f = norm(a.zona)
    hoy = datetime.date.today().isoformat()
    vistos = nuevos = con_tel = 0
    resultados = {}

    ses = opciones_sesion()
    kw = {"cookies": ses["cookies"]} if ses else {}
    if ses:
        tmp = PROFILE / "init.js"
        tmp.write_text(ses["init_script_text"], encoding="utf8")
        kw["init_script"] = str(tmp)
    with DynamicSession(headless=a.headless, network_idle=True, capture_xhr=r"rest/v1/properties", **kw) as s:
        for op in a.ops:
            for url in listar_links(s, op, a.max_pages):
                vistos += 1
                if url in idx and any(ws.cell(idx[url], hdr.index(k) + 1).value for k in ("Teléfono / WhatsApp", "Email", "Otro contacto")):
                    continue
                out = {"contacto": "", "login": False}
                resp = s.fetch(url, wait_selector="button:has-text('Contactar')", page_action=accion_detalle(not a.sin_contacto, out))
                datos = parsear(url, resp.get_all_text(separator="\n"))
                datos["contacto"] = out["contacto"]
                prop = {}
                for c in resp.captured_xhr or []:
                    if "rest/v1/properties" in c.url:
                        try:
                            j = json.loads(c.body)
                        except Exception:
                            continue
                        for cand_ in (j if isinstance(j, list) else [j]):
                            if isinstance(cand_, dict) and cand_.get("id") == url[-36:]:
                                prop = cand_
                datos["descripcion"] = prop.get("description") or datos["descripcion"]
                datos["imagenes"] = [i if isinstance(i, str) else i.get("url", "") for i in (prop.get("images") or [])]
                if zona_f and zona_f not in norm(datos["zona"]) and not (zona_f == "capital federal" and "ciudad autonoma" in norm(datos["zona"])):
                    continue
                datos["extra"] = contactos_aviso(datos["descripcion"], datos.get("imagenes", []), 0 if a.sin_ocr else a.max_fotos)
                ex_ = datos["extra"]
                print(f"  {datos['id']} {datos['zona'].split(',')[0]}: fotos {ex_['fotos']}, con texto {ex_['con_texto']}, leídas {ex_['leidas']}, contacto {bool(ex_['tel'] or ex_['mail'] or ex_['ig'])} {ex_['tel'][:1]}", flush=True)
                resultados[url] = datos
                time.sleep(1)

    for url, d in resultados.items():
        tel, mail = parsear_contacto(d.get("contacto", ""), "")
        ex = d["extra"]
        tel = tel or "; ".join(ex["tel"])
        mail = mail or "; ".join(ex["mail"])
        ig = "; ".join("@" + i for i in ex["ig"])
        origen = "; ".join(ex["origen"])
        fila = {
            "ID": d["id"], "Fuente": FUENTE, "Link publicación": url, "Fecha de captura": hoy,
            "Nombre del dueño": d["nombre"], "Teléfono / WhatsApp": tel, "Email": mail, "Otro contacto": ig,
            "Tipo": d["tipo"], "Operación": d["operacion"], "Zona": d["zona"], "Precio y moneda": d["precio"],
            "Características": d["caracteristicas"], "Detalle breve": detalle_breve(d), "Días publicado": "",
            "Estado de contacto": "nuevo" if (tel or mail or ig) else "sin contacto", "Fecha de contacto": "", "Notas": origen,
        }
        if url in idx:
            r = idx[url]
            for k in ("Nombre del dueño", "Teléfono / WhatsApp", "Email", "Otro contacto"):
                c = hdr.index(k) + 1
                if not ws.cell(r, c).value and fila[k]:
                    ws.cell(r, c).value = fila[k]
        else:
            ws.append([fila[c] for c in COLUMNAS])
            nuevos += 1
        con_tel += 1 if (tel or mail or ig) else 0

    wb["Corridas"].append([hoy, ",".join(a.ops), a.zona, vistos, nuevos, con_tel])
    wb.save(a.excel)
    print(f"Avisos vistos: {vistos} | en zona: {len(resultados)} | nuevos: {nuevos} | con algún contacto: {con_tel}")
    if con_tel == 0:
        print("AVISO: ningún contacto. Probá 'login' (el sitio entrega el número con cuenta).")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("login").set_defaults(fn=cmd_login)
    r = sub.add_parser("run")
    r.add_argument("--excel", required=True)
    r.add_argument("--max-pages", type=int, default=3)
    r.add_argument("--ops", nargs="+", default=["venta", "alquiler"])
    r.add_argument("--zona", default="capital federal")
    r.add_argument("--sin-contacto", action="store_true")
    r.add_argument("--sin-ocr", action="store_true")
    r.add_argument("--max-fotos", type=int, default=60)
    r.add_argument("--headless", action="store_true")
    r.set_defaults(fn=cmd_run)
    args = ap.parse_args()
    args.fn(args)
