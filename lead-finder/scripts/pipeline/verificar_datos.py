"""Controla que cada dato de un CSV de leads corresponda a su empresa, y suma lo que trajo completar_datos.py.

Uso:
  python verificar_datos.py --config config.json --excel "<Excel>" --csv tanda1.csv [--csv tanda2.csv ...]
         [--completados tanda1.completados.jsonl ...] [--hoja Leads]

Controles (lo que no pasa se SACA del dato, no de la empresa; se imprime qué se sacó):
  - teléfono o mail compartido entre empresas distintas, o que ya esté en el Excel
  - mail de un dominio que no es el de su web ni lleva la marca (salvo que salga de la bio, linktree o Facebook de la empresa)
  - prefijo de teléfono que no es el del país del lead
  - webs que en realidad son acortadores (bit.ly, wa.link, g.co) o están repetidas en varias empresas
  - filas de otro país (web o bio) y filas cuyo Instagram ya está en el Excel
  - empresas repetidas dentro de las tandas (mismo mail de dominio propio, misma web): se listan para unirlas a mano
Reescribe los CSV con la columna Estado actualizada. No toca el Excel.
"""
import collections
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from leads_common import *  # noqa: F401,F403,E402
import leads_common as C  # noqa: E402
from buscar_leads import fuera_de_pais  # noqa: E402

FREE = ("gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "yahoo.com.mx", "live.com", "icloud.com", "hotmail.es", "live.com.mx", "gmx.com")


def src_add(r, kind, val, where):
    r["De_donde_sale"] = (r["De_donde_sale"] + " | " if r.get("De_donde_sale") else "") + f"{kind} {val}: {where}"


def main():
    cfg = C.load_config(C.arg_value("--config"))
    excel, hoja = C.arg_value("--excel"), C.arg_value("--hoja", "Leads")
    paths = C.arg_list("--csv")
    comps = C.arg_list("--completados")
    tandas = {p: list(csv.DictReader(open(p, encoding="utf-8-sig"))) for p in paths}
    comp = {}
    for p in comps:
        for l in open(p, encoding="utf8"):
            x = json.loads(l)
            comp[x["Empresa"]] = x
    log = collections.defaultdict(list)
    # ---- 1) sumar lo nuevo de completar_datos.py
    for p, rows in tandas.items():
        for r in rows:
            c = comp.get(r["Empresa"])
            if not c:
                continue
            have = {C.d10(x) for x in C.split(r["WhatsApp"]) + C.split(r["Telefono"])}
            for e, w in c["em"].items():
                if e not in r["Email"] and len(C.split(r["Email"])) < 2:
                    r["Email"] = "; ".join(C.split(r["Email"]) + [e])
                    src_add(r, "mail", e, w)
                    log["mail agregado"].append(r["Empresa"])
            for k, col in (("wa", "WhatsApp"), ("tel", "Telefono")):
                for ph, w in c[k].items():
                    if C.d10(ph) not in have and len(C.split(r[col])) < 2:
                        r[col] = "; ".join(C.split(r[col]) + [ph])
                        have.add(C.d10(ph))
                        src_add(r, "WA" if k == "wa" else "tel", ph, w)
                        log[("WA" if k == "wa" else "tel") + " agregado"].append(r["Empresa"])
            for w_ in c["webs"]:
                if w_ not in r["Web"]:
                    r["Web"] = ", ".join(C.split(r["Web"].replace(",", ";")) + [w_])
    # ---- 2) controles
    ex = C.build_index(excel, hoja)
    allrows = [(p, r) for p, rows in tandas.items() for r in rows]
    ph_count, em_count, web_count = collections.Counter(), collections.Counter(), collections.Counter()
    for _, r in allrows:
        for ph in set(C.d10(x) for x in C.split(r["WhatsApp"]) + C.split(r["Telefono"])):
            ph_count[ph] += 1
        for e in set(C.split(r["Email"])):
            em_count[e.lower()] += 1
        for w in set(re.sub(r"^https?://(www\.)?", "", x).rstrip("/") for x in re.split(r"[;,]", r["Web"]) if x.strip()):
            web_count[w] += 1
    quitar = set()
    for p, r in allrows:
        nm = r["Empresa"]
        pc = cfg["paises"].get(r["Pais"])
        for col in ("WhatsApp", "Telefono"):
            keep = []
            for ph in C.split(r[col]):
                d = C.d10(ph)
                if ph_count[d] > 1:
                    log["teléfono compartido entre empresas (sacado)"].append(f"{nm} {ph}")
                elif d in ex["phones"]:
                    log["teléfono que ya está en el Excel (sacado)"].append(f"{nm} {ph}")
                elif pc and not ph.startswith("+" + str(pc["prefijo"])):
                    log["teléfono de otro país (sacado)"].append(f"{nm} {ph}")
                else:
                    keep.append(ph)
            r[col] = "; ".join(keep)
        tk = C.tok(nm, cfg.get("palabras_genericas", [])) + C.tok(C.handle_of(r["Instagram"]), cfg.get("palabras_genericas", []))
        webs = [re.sub(r"^https?://(www\.)?", "", w).split("/")[0].lower() for w in re.split(r"[;,]", r["Web"]) if w.strip()]
        keep = []
        for e in C.split(r["Email"]):
            dom = e.split("@")[1].lower()
            if em_count[e.lower()] > 1:
                log["mail compartido entre empresas (sacado)"].append(f"{nm} {e}")
            elif e.lower() in ex["emails"]:
                log["mail que ya está en el Excel (sacado)"].append(f"{nm} {e}")
            else:
                okdom = any(dom.endswith(w) or w.endswith(dom) for w in webs) or any(t in C.nt(e) for t in tk) or dom in FREE
                propia = f"mail {e}: bio IG" in r["De_donde_sale"] or f"mail {e}: Facebook de la empresa" in r["De_donde_sale"] or f"mail {e}: linktree" in r["De_donde_sale"]
                if okdom or propia:
                    keep.append(e)
                else:
                    log["mail de dominio ajeno (sacado)"].append(f"{nm} {e}")
        r["Email"] = "; ".join(keep)
        keepw = []
        for w in [x.strip() for x in re.split(r"[;,]", r["Web"]) if x.strip()]:
            wn = re.sub(r"^https?://(www\.)?", "", w).rstrip("/")
            if any(s in wn.lower() for s in C.ACORTADORES):
                log["web acortada o de otro servicio (sacada)"].append(f"{nm} {w}")
            elif web_count[wn] > 1:
                log["web compartida entre empresas (sacada)"].append(f"{nm} {w}")
            else:
                keepw.append(w)
        r["Web"] = ", ".join(keepw)
        if fuera_de_pais(" ".join([nm, r["Web"], r["Email"]]), [w for w in re.split(r"[;,]", r["Web"]) if w.strip()], C.split(r["Email"]), list(cfg["paises"])):
            quitar.add((p, nm, "parece de otro país"))
        h = C.handle_of(r["Instagram"])
        if h and h in ex["handles"]:
            quitar.add((p, nm, "su Instagram ya está en el Excel"))
        if not (r["Instagram"] or r["Email"] or r["WhatsApp"] or r["Telefono"]):
            quitar.add((p, nm, "sin ningún dato"))
    # empresas repetidas dentro de las tandas
    dom_rows = collections.defaultdict(set)
    for i, (_, r) in enumerate(allrows):
        for e in C.split(r["Email"]):
            if e.split("@")[1].lower() not in FREE:
                dom_rows[e.split("@")[1].lower()].add(r["Empresa"])
        for w in re.split(r"[;,]", r["Web"]):
            if w.strip():
                dom_rows[re.sub(r"^https?://(www\.)?", "", w.strip()).split("/")[0].lower()].add(r["Empresa"])
    for d, names in dom_rows.items():
        if len(names) > 1:
            log["posible empresa repetida (revisar a mano)"].append(f"{d}: " + " / ".join(sorted(names)))
    qn = {(p, n) for p, n, _ in quitar}
    for p, n, why in quitar:
        log["fila sacada: " + why].append(n)
    for p, rows in tandas.items():
        keep = [r for r in rows if (p, r["Empresa"]) not in qn]
        for r in keep:
            r["Estado"] = C.estado(r)
        C.write_csv(p, keep)
        f = lambda k: sum(bool(o[k]) for o in keep)  # noqa: E731
        print(os.path.basename(p), len(keep), "| ig", f("Instagram"), "mail", f("Email"), "wa", f("WhatsApp"), "wa|tel", sum(bool(o["WhatsApp"] or o["Telefono"]) for o in keep),
              "completo", sum(o["Estado"] == "Completo" for o in keep))
    for k, v in log.items():
        print(k, len(v), "|", "; ".join(v[:4]))


if __name__ == "__main__":
    main()
