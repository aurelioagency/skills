"""Corre TODO el proceso para los rubros y países elegidos, uno atrás del otro, sin preguntar nada en el medio.

Uso:
  python buscar_todo.py --rubros autopartes,inmobiliarias --paises MX,AR --excel "<Excel>" --salida-dir <carpeta> --trabajo <carpeta> [--cargar] [--prueba]
  python buscar_todo.py --rubros autopartes,inmobiliarias --paises MX,AR --excel "<Excel>" --estimar     (solo cuenta consultas y estima el tiempo)

Para cada rubro, con los países elegidos:
  1. buscar_leads.py     candidatos, verificación del rubro y contactos de fuentes propias
  2. completar_datos.py  segunda pasada para lo que falte (Maps, Facebook, directorios, webs)
  3. verificar_datos.py  controla que cada dato corresponda a su empresa
  4. cargar_excel.py     SOLO si se pasó --cargar (si no, queda el CSV para revisar y se carga cuando el usuario lo pida)
Deja un CSV por rubro: leads-<rubro>-<paises>-<fecha>.csv. Un rubro que falla no corta a los demás.
"""
import datetime
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import leads_common as C  # noqa: E402
import buscar_leads as B  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))


def correr(script, *args):
    cmd = [sys.executable, "-I", os.path.join(HERE, script)] + list(args)
    print(">>", script, " ".join(a for a in args if a.startswith("--") or len(a) < 40), flush=True)
    return subprocess.call(cmd)


def main():
    rubros = [r.strip() for r in (C.arg_value("--rubros") or "").split(",") if r.strip()]
    paises = [p.strip().upper() for p in (C.arg_value("--paises") or "").split(",") if p.strip()]
    excel = C.arg_value("--excel")
    if not rubros or not paises or not excel:
        sys.exit("Faltan --rubros, --paises y --excel")
    hoy = datetime.date.today().isoformat()
    cfgs = {r: C.build_config(r, paises) for r in rubros}
    if "--estimar" in sys.argv:
        tot = 0
        for r, cfg in cfgs.items():
            n = len(B.consultas(cfg))
            tot += n
            print(f"{cfg['rubro_nombre']}: {n} consultas ≈ {int(n * 0.4)} min")
        print(f"TOTAL: {tot} consultas ≈ {int(tot * 0.4 / 60 * 10) / 10} horas (corre en segundo plano)")
        return
    salida = C.arg_value("--salida-dir", ".")
    trabajo = C.arg_value("--trabajo", "trabajo-leads")
    os.makedirs(salida, exist_ok=True)
    extra = ["--prueba"] if "--prueba" in sys.argv else []
    lim = C.arg_value("--limite-consultas")
    if lim:
        extra += ["--limite-consultas", lim]
    hechos = []
    for rid in rubros:
        cfg = cfgs[rid]
        tag = f"{rid}-{'-'.join(paises)}"
        csv_path = os.path.join(salida, f"leads-{tag}-{hoy}.csv")
        tr = os.path.join(trabajo, tag)
        base = ["--rubro", rid, "--paises", ",".join(paises)]
        previos = [x for p in hechos for x in ("--previos", p)]
        print(f"\n===== {cfg['rubro_nombre']} · {', '.join(paises)} =====", flush=True)
        if correr("buscar_leads.py", *base, "--excel", excel, "--salida", csv_path, "--trabajo", tr, *previos, *extra) != 0:
            print("FALLÓ la búsqueda de", rid, "(sigo con el próximo rubro)", flush=True)
            continue
        jsonl = os.path.splitext(csv_path)[0] + ".completados.jsonl"
        correr("completar_datos.py", *base, "--csv", csv_path, "--salida", jsonl, "--trabajo", tr)
        correr("verificar_datos.py", *base, "--excel", excel, "--csv", csv_path, "--completados", jsonl, "--trabajo", tr)
        hechos.append(csv_path)
        if "--cargar" in sys.argv:
            correr("cargar_excel.py", "--excel", excel, "--csv", csv_path, "--rubro", rid, "--carga", f"{hoy} (búsqueda {cfg['rubro_nombre']} {'/'.join(paises)})")
    print("\nLISTO. CSV generados:", flush=True)
    for p in hechos:
        print(" ", p, flush=True)


if __name__ == "__main__":
    main()
