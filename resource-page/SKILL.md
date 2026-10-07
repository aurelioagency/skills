---
name: resource-page
description: Crea la página web del recurso de un reel en aurelioagency.com (aurelioagency.com/blog/<slug>), una por reel, que no aparece en la lista de /blog ni en Google, y devuelve su URL, que replykaro-automation manda como único link del DM. Usar cuando social-video-producer entrega un video con `dm-reply-<slug>.txt`, el usuario lo aprobó y se subió a Drive, o cuando el usuario pida "armá la página del recurso", "creá la URL del recurso" o sume un recurso nuevo a la web. Va ANTES de replykaro-automation, que usa esa URL en el DM. No publica nada en Instagram.
---

# Página de recurso (aurelioagency.com/blog/<slug>)

Cada reel promete un recurso (casi siempre un repo de GitHub). En vez de mandar el link directo, el DM manda a una página de la web de la agencia con ese recurso, la comunidad de Skool y la consultoría. La gente entra a la web, no al repo.

La página no aparece en la lista de `/blog`, lleva `noindex` y no hay ningún link a ella: solo llega quien recibe el DM. Así nadie ve los recursos viejos.

## Lugar en el flujo

1. El usuario aprueba el video en `social-video-producer` → se sube a Drive.
2. **Esta skill** crea la página y devuelve su URL. **No toca el `dm-reply-<slug>.txt`**: ese archivo es el mensaje de respaldo para mandar a mano y trae la URL de esta página como único link del recurso (el link real del recurso se pasa con `--github`).
3. `replykaro-automation` crea la automatización con `--link <esa URL>`. Esa URL es el único link que manda la automatización (los mensajes ya no los envía Aurelio a mano: los envía ReplyKaro).

Todo es parte del mismo "aprobado". No pedir un segundo OK.

## Qué se necesita por recurso

| Dato | De dónde sale |
|---|---|
| `slug` | El slug del video (`<slug>` de la carpeta de entrega), en minúsculas y con guiones |
| `name` | El nombre del recurso, como lo dice el video |
| link del recurso | Se pasa con `--github <url>`, sacado de lo que muestra o dice el video (el `dm-reply` ya no lo trae) |
| resumen `es` / `en` / `br` | Se escribe acá, de 1 a 2 frases |
| `reel` (opcional) | No cargarlo: el reel todavía no está subido cuando se crea la página |

**El resumen** solo dice lo que el recurso es, sacado de lo que el video y el repo confirman (descripción oficial del repo, transcript aprobado). Nada de inventar cómo funciona. Palabras simples y, en español, voseo. Las tres lenguas tienen que decir lo mismo.

## Uso

El repo de la web tiene que estar en `%USERPROFILE%\Documents\Aurelio-Agency-Website` (si no existe: `git clone https://github.com/aurelioagency/Aurelio-Agency-Website.git` ahí). Es un repo compartido con otra persona: el script se niega a trabajar si tiene cambios sin commitear.

```
node "<skill-dir>\scripts\add-resource.mjs" --slug scrapling --name "Scrapling" ^
  --summary-es "Scrapling es un framework de web scraping gratuito y de código abierto. Sirve desde una sola solicitud hasta un rastreo completo de un sitio." ^
  --summary-en "Scrapling is a free, open-source web scraping framework. It handles everything from a single request to a full-scale crawl." ^
  --summary-br "Scrapling é um framework de web scraping gratuito e de código aberto. Serve desde uma única requisição até um rastreamento completo de um site." ^
  --github "<url del repo o recurso>"
```

Qué hace, en orden: `git pull`, agrega el bloque a `src/lib/resource-drops.ts`, corre `tsc`, commit y push a `main` (sin `Co-Authored-By`), espera hasta 5 minutos a que `https://www.aurelioagency.com/blog/<slug>` responda 200, y la imprime en la última línea (`ONLINE: <url>`). La URL no lleva idioma: la web redirige sola al de cada persona (es, en o br).

Flags: `--github <url>` (obligatorio hoy), `--reel <url>`, `--repo <ruta>`, `--wait <seg>`, `--dry-run` (muestra el bloque sin escribir nada), `--no-git` (solo edita el archivo; para pruebas).

Códigos de salida: `0` la página está online · `4` quedó subida pero todavía no responde · `1` error (slug repetido, tsc falló, repo sucio, etc.).

## Si no queda online (código 4)

El script imprime el estado del deploy. **No seguir con replykaro-automation**: el DM saldría con un link que da 404. Decirle al usuario el estado exacto y esperar. El caso conocido (2026-10-06) es `Deployment was blocked`: el hosting bloquea los commits de una cuenta que no está aceptada en el equipo; lo resuelve quien administra el hosting.

## Problemas conocidos al publicar

- `tsc falló ... Cannot find module '@opennextjs/cloudflare'`: al hacer pull llegó una dependencia nueva que no está instalada. Correr `npm install` en el repo de la web y **revertir `package-lock.json`** (`git checkout package-lock.json`), porque el script se niega a trabajar con el repo sucio. Después repetir el comando.
- Instalar puede tardar varios minutos: avisarle al usuario que es eso lo que demora.
- Siempre devolverle al usuario la URL de la página, como link, en la respuesta final.

## Reglas

- El link del recurso es siempre https.
- El slug no se reutiliza: si ya existe, el script falla. Para corregir un recurso ya cargado, editar su bloque en `resource-drops.ts` a mano.
- Cada recurso nuevo es un commit chico a `main`. No tocar nada más del repo de la web.
- El repo exige los tres idiomas (`es`, `en`, `br`): el script no deja cargar uno solo.
- El `dm-reply` no se modifica nunca desde esta skill.
- Al terminar, devolver siempre la URL de la página al usuario.
- No publicar la página de un recurso que el usuario no aprobó.
