#!/usr/bin/env python
"""Descarga una página con Scrapling para poder inspeccionarla antes de armar selectores.

Uso:
  python fetch.py <url> [--stealth] [--html] [--out archivo]

Sin --stealth usa el fetcher simple (rápido, para sitios sin protección anti-bot).
Con --stealth usa StealthyFetcher (navegador real, para sitios con JS o Cloudflare/anti-bot).
Sin --out imprime a stdout; con --out guarda el resultado en un archivo.
"""
import argparse
import sys

from scrapling.fetchers import Fetcher, StealthyFetcher


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--stealth", action="store_true", help="usar navegador real (sitios con JS/anti-bot)")
    parser.add_argument("--html", action="store_true", help="imprimir HTML crudo en vez de texto visible")
    parser.add_argument("--out", help="guardar en este archivo en vez de imprimir")
    args = parser.parse_args()

    if args.stealth:
        page = StealthyFetcher.fetch(args.url, headless=True)
    else:
        page = Fetcher.get(args.url)

    content = page.html_content if args.html else page.get_all_text(ignore_tags=("script", "style"))

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Guardado en {args.out} ({len(content)} caracteres)")
    else:
        sys.stdout.write(content)


if __name__ == "__main__":
    main()
