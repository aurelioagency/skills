# Estado — formato de archivos

Todo vive en `Documents\reels-referentes\` (se crea la primera vez que hace falta). No es parte de la carpeta de la skill: así sobrevive a un `git pull` / reinstalación de la skill.

## `cuentas.json`

Lista de cuentas referentes guardadas.

```json
[
  { "cuenta": "nombredeusuario", "agregada": "2026-09-13" }
]
```

## `candidatos\<cuenta>.json`

Reels propuestos para esa cuenta (todavía no aprobados). Se puede sobreescribir cada vez que se vuelve a buscar en esa cuenta.

```json
[
  {
    "link": "https://www.instagram.com/reel/XXXXXXXXX/",
    "views_aprox": "1.2M",
    "por_que": "tiene 5x más views que el resto de sus reels recientes",
    "propuesto": "2026-09-13"
  }
]
```

## `aprobados.json`

Reels que el usuario aprobó para usar. `reel_id` es el shortcode del link (lo que va después de `/reel/`), y es el nombre de la carpeta en `aprobados\`.

```json
[
  {
    "reel_id": "XXXXXXXXX",
    "cuenta": "nombredeusuario",
    "link": "https://www.instagram.com/reel/XXXXXXXXX/",
    "aprobado": "2026-09-13",
    "procesado": false
  }
]
```

`procesado` pasa a `true` una vez que existe `aprobados\<reel_id>\dialogo.txt`.

## `aprobados\<reel_id>\`

- `audio.<ext>` — audio bajado de cobalt.tools
- `dialogo.txt` — transcripción en el idioma original
- `dialogo_es.txt` — traducción al español (solo si el original no estaba en español)
- `recurso.txt` — recurso/link que menciona el reel, o "no se menciona ningún recurso"
