#!/usr/bin/env python
"""Guarda una lista de resultados (JSON por stdin, lista de objetos) como CSV.

Uso:
  python export_csv.py <salida.csv> < resultados.json

Todas las claves que aparezcan en cualquier objeto se usan como columnas.
"""
import csv
import json
import sys


def main():
    if len(sys.argv) != 2:
        print("Uso: python export_csv.py <salida.csv> < resultados.json", file=sys.stderr)
        sys.exit(1)

    data = json.load(sys.stdin)
    if not isinstance(data, list):
        data = [data]

    columnas = []
    for row in data:
        for k in row.keys():
            if k not in columnas:
                columnas.append(k)

    with open(sys.argv[1], "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=columnas)
        writer.writeheader()
        for row in data:
            writer.writerow({k: (", ".join(v) if isinstance(v, list) else v) for k, v in row.items()})

    print(f"Guardado {len(data)} filas en {sys.argv[1]}")


if __name__ == "__main__":
    main()
