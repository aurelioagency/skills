# Estado — formato de archivos

Todo vive en `Documents\content-diario\` (se crea la primera vez que hace falta). No es parte de la carpeta de la skill: así sobrevive a un `git pull` / reinstalación de la skill.

## `backlog.json`

Todas las ideas propuestas, de cualquier ronda. Nunca se borra una entrada, solo cambia de estado.

```json
[
  {
    "id": "2026-09-22-carrusel-01",
    "fecha_propuesta": "2026-09-22",
    "formato": "carrusel",
    "tipo": "novedad",
    "titulo": "Anthropic lanza tal función",
    "fuente": "https://www.anthropic.com/news/...",
    "por_que": "release del día, alto interés esperado",
    "verificar_antes_de_publicar": false,
    "estado": "pendiente"
  },
  {
    "id": "2026-09-22-reel-01",
    "fecha_propuesta": "2026-09-22",
    "formato": "reel",
    "tipo": "reel-copia",
    "titulo": "Cómo armar un agente con memoria",
    "fuente": "https://www.instagram.com/reel/XXXXXXXXX/",
    "cuenta_origen": "nombredeusuario",
    "por_que": "1.2M views, 5x el promedio de la cuenta",
    "verificar_antes_de_publicar": false,
    "estado": "elegido"
  }
]
```

`estado` es uno de: `pendiente` (propuesta, no elegida todavía), `elegido` (el usuario la seleccionó, ya se generó o se está generando el contenido).

`tipo` es uno de: `novedad`, `teoria`, `reel-copia`.

## `guiones\<id>.md`

Para cada idea de reel elegida: el guion final (~40 segundos) + las opciones de hook que se le dieron al usuario. Se crea al completar el paso 5 de la skill.
