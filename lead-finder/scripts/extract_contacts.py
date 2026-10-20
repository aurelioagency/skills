#!/usr/bin/env python
"""Extrae datos de contacto públicos de una página (perfil de vendedor, sitio, directorio).

No inventa nada: solo reporta lo que efectivamente encuentra en los links y el texto
visible de la página. Sirve tanto para enriquecer un perfil puntual (ML, sitio propio,
Instagram) como para sacar contactos de una página de listado de un directorio.

Uso:
  python extract_contacts.py <url> [--stealth]

Salida: JSON con emails, telefonos, whatsapp, instagram, facebook, sitios_externos.
"""
import argparse
import json
import re
import sys
from urllib.parse import urlparse

from scrapling.fetchers import Fetcher, StealthyFetcher

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
# Teléfonos AR/MX: secuencias de 8-13 dígitos, permitiendo espacios/guiones/paréntesis/+.
PHONE_RE = re.compile(r"(?:\+?\d[\d\s().-]{7,15}\d)")


def clean_phone(raw: str) -> str:
    return re.sub(r"[^\d+]", "", raw)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--stealth", action="store_true")
    args = parser.parse_args()

    if args.stealth:
        page = StealthyFetcher.fetch(args.url, headless=True)
    else:
        page = Fetcher.get(args.url)

    text = page.get_all_text(ignore_tags=("script", "style"))
    links = [a.attrib.get("href", "") for a in page.css("a") if a.attrib.get("href")]

    emails = set(EMAIL_RE.findall(text))
    for href in links:
        if href.startswith("mailto:"):
            emails.add(href.replace("mailto:", "").split("?")[0])

    whatsapp = set()
    instagram = set()
    facebook = set()
    sitios_externos = set()
    telefonos_tel = set()

    for href in links:
        if href.startswith("tel:"):
            telefonos_tel.add(clean_phone(href.replace("tel:", "")))
        elif "wa.me" in href or "api.whatsapp.com" in href:
            whatsapp.add(href)
        elif "instagram.com" in href:
            instagram.add(href.split("?")[0])
        elif "facebook.com" in href:
            facebook.add(href.split("?")[0])
        else:
            parsed = urlparse(href)
            if parsed.scheme in ("http", "https") and parsed.netloc and "mercadolibre" not in parsed.netloc:
                sitios_externos.add(href)

    telefonos_texto = set(clean_phone(m) for m in PHONE_RE.findall(text) if len(clean_phone(m)) >= 8)

    result = {
        "url": args.url,
        "emails": sorted(emails),
        "telefonos_tel_link": sorted(telefonos_tel),
        "telefonos_en_texto": sorted(telefonos_texto),
        "whatsapp": sorted(whatsapp),
        "instagram": sorted(instagram),
        "facebook": sorted(facebook),
        "sitios_externos": sorted(sitios_externos),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
