---
name: resource-page
description: Crea la página web del recurso de un reel en aurelioagency.com (aurelioagency.com/blog/<slug>), una por reel, que no aparece en la lista de /blog ni en Google, y devuelve su URL, que replykaro-automation manda como único link del DM. Usar cuando social-video-producer entrega un video aprobado que promete un recurso por DM, o cuando el usuario pida "armá la página del recurso", "creá la URL del recurso" o sume un recurso nuevo a la web. Va ANTES de replykaro-automation, que usa esa URL en el DM. No publica nada en Instagram.
---

# Página de recurso (aurelioagency.com/blog/<slug>)

Cada reel promete un recurso (casi siempre un repo de GitHub). En vez de mandar el link directo, el DM manda a una página de la web de la agencia con ese recurso, la comunidad de Skool y la consultoría. La gente entra a la web, no al repo.

La página no aparece en la lista de `/blog`, lleva `noindex` y no hay ningún link a ella: solo llega quien recibe el DM. Así nadie ve los recursos viejos.

## Lugar en el flujo

1. El usuario aprueba el video en `social-video-producer` → se sube a Drive.
2. **Esta skill** crea la página y devuelve su URL.
3. `replykaro-automation` crea la automatización con `--link <esa URL>`. Esa URL es el único link que manda la automatización (los mensajes ya no los envía Aurelio a mano: los envía ReplyKaro).

Todo es parte del mismo "aprobado". No pedir un segundo OK.

### Cuándo NO usar esta skill

Esta skill existe para un recurso que **no es de Aurelio** (un repo de GitHub, la herramienta de otro, un sitio externo) — ahí hace falta una página propia que lo presente, con la comunidad de Skool y la consultoría al lado, en vez de mandar a la gente directo afuera.

Si el recurso que promete el reel **ya es una página propia de aurelioagency.com** (porque el reel promociona contenido/herramienta que la agencia ya publicó en su web), no hay nada que crear: ese link ya existe y es el que va directo a `replykaro-automation --link <esa URL>`. Confirmar con el usuario cuál es el link exacto si no es un repo (el video puede mostrar la página de fondo sin que se lea completa la URL en la barra de direcciones) — nunca adivinarlo ni crear una página nueva "por si acaso" cuando ya existe una.

## Qué se necesita por recurso

| Dato | De dónde sale |
|---|---|
| `slug` | El slug del video (`<slug>` de la carpeta de entrega), en minúsculas y con guiones |
| `name` | El nombre del recurso, como lo dice el video |
| link del recurso | El del recurso que promete el video (repo, sitio de la herramienta, etc.), sacado de lo que muestra o dice el video. Se pasa con `--github <url>` (el nombre del flag es histórico: **no significa que sea un GitHub**) |
| texto del botón | Depende de qué es el recurso, ver abajo. Se razona en cada recurso, nunca se deja el de la plantilla por costumbre |
| descripción `es` / `en` / `br` | Se escribe leyendo el recurso (ver abajo), 2 a 3 frases |
| `reel` (opcional) | No cargarlo: el reel todavía no está subido cuando se crea la página |

## El botón principal (nunca "GitHub" si no es GitHub)

La plantilla de la web trae un botón con el texto "Abrir GitHub". Ese texto **solo es correcto cuando el recurso es un repo de github.com**. Antes de crear la página, mirar qué es el recurso realmente y decidir el botón:

- **Repo de github.com**: no pasar `--cta-*`; sale "Abrir GitHub".
- **Cualquier otra cosa** (sitio de una herramienta, app, documentación, descarga): el script pone solo "Abrir <nombre>" / "Open <nombre>" / "Abrir <nombre>" y rechaza cualquier texto que diga GitHub. Si otro texto queda mejor ("Ir a Treg", "Probar Notion", "Descargar la guía"), pasarlo con `--cta-es`, `--cta-en` y `--cta-br`. El texto es corto, con voseo y dice qué hace el botón.
- Revisar con `--dry-run` que el botón y la descripción coincidan con el recurso. La descripción también se adapta: no hablar de "repo" ni de "código abierto" si el recurso no es eso, ni copiar la forma de un recurso anterior (confirmado 2026-10-10: la página de Treg salió con "Abrir GitHub" sin ser un GitHub).

## Cómo armar la descripción

La descripción es lo primero que lee quien entra a la página, y también la usa Google y las redes como texto de vista previa. Tiene que ser buena y salir **del propio recurso**, no solo de lo que dice el video:

1. **Leer el recurso.** Si es un repo de GitHub: `gh repo view <owner>/<repo> --json description,homepageUrl,repositoryTopics` y el README (`gh api repos/<owner>/<repo>/readme --jq .content` en base64, o `WebFetch` del repo y de su `homepageUrl`). Si es un sitio, leerlo con `WebFetch`. Cruzarlo con el transcript aprobado del video.
2. **Escribir 2 a 3 frases (unos 200 a 350 caracteres)** en este orden: qué es, qué problema resuelve para quien lo usa, y 1 o 2 cosas concretas que hace. Si el README lo confirma, cerrar con lo que más pesa para la decisión (gratis, código abierto, cómo se instala). Ejemplo de tono, sobre Scrapling: "Scrapling es un framework de web scraping gratuito y de código abierto. Sirve desde una sola solicitud hasta un rastreo completo de un sitio."
3. **Solo lo confirmado.** Cada dato (cifras, compatibilidades, funciones) tiene que estar en el README, la descripción oficial o el video. Nada de inventar cómo funciona ni de copiar eslóganes de marketing tal cual.
4. **Palabras simples**, en español con voseo. Las tres lenguas (`es`, `en`, `br`) dicen lo mismo, escritas con naturalidad y no traducidas palabra por palabra.
5. Una sola línea de texto corrido: sin listas, sin emojis, sin enlaces.

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

Flags: `--github <url>` (obligatorio; link del recurso, sea o no de GitHub), `--cta-es/--cta-en/--cta-br "<texto>"` (texto del botón, los tres juntos), `--reel <url>`, `--repo <ruta>`, `--wait <seg>`, `--dry-run` (muestra el bloque sin escribir nada), `--no-git` (solo edita el archivo; para pruebas).

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
- Al terminar, devolver siempre la URL de la página al usuario.
- No publicar la página de un recurso que el usuario no aprobó.
