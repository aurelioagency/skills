# Troubleshooting

## "La dirección debe ser válida" en el Redirect URI

Mercado Libre exige `https://` y algo que parezca un dominio real con TLD. `https://localhost:8080/callback` lo rechaza porque `localhost` no tiene punto/TLD. Solución: `https://<slug>.127.0.0.1.nip.io:8080/callback` — nip.io resuelve cualquier subdominio de una IP embebida en el propio nombre a esa IP, así que sigue apuntando a la PC del usuario pero pasa el validador.

Esto **solo** sirve para el Redirect URI del flujo OAuth (lo abre el navegador de la persona). No sirve para la "Notificaciones callbacks URL" de los Tópicos — esa la llama el servidor de Mercado Libre directamente, necesita ser pública de verdad. Si no hay servidor público, no tildar ningún Tópico y ese campo deja de ser obligatorio.

## "La app ya está creada, por favor elija otro nombre"

Los nombres de app son únicos **globalmente** en Mercado Libre, no por cuenta. Si el nombre que elegiste ya lo usó cualquier otra persona en el mundo, salta este error aunque la cuenta del usuario no tenga ninguna app propia. Solución: agregar un sufijo único (iniciales + año, por ejemplo) y reintentar — no hace falta preguntarle al usuario, es un detalle técnico.

## El campo de Logo pide una imagen aunque parezca opcional

Si el formulario no deja avanzar sin logo, generar uno al vuelo:

```bash
python -c "from PIL import Image; Image.new('RGB',(512,512),(30,64,175)).save('logo.png')"
```

## Verificar si una foto es realmente del usuario antes de subirla

```bash
python -c "
from PIL import Image
from PIL.ExifTags import TAGS
img = Image.open('archivo.jpg')
exif = img._getexif()
if exif:
    for tag_id, value in exif.items():
        tag = TAGS.get(tag_id, tag_id)
        if tag in ('Make','Model','Software','DateTimeOriginal','GPSInfo'):
            print(tag, ':', value)
else:
    print('sin EXIF')
"
```

Señales de alarma: `Software: Picasa` (típico de fotos bajadas de Google Photos/Maps), ausencia total de `Make`/`Model` de cámara en una foto que dicen haber sacado con el celular o con drone, o una fecha `DateTimeOriginal` muy anterior a "recién la saqué". El nombre de la carpeta/archivo también cuenta como evidencia (`...-google-maps-fotos\` no es un nombre que se pone a fotos propias).

## `/sites/MLA/search` devuelve 403 forbidden

No es un bug de la app ni de los permisos configurados — Mercado Libre bloqueó el buscador público vía API para apps nuevas (para frenar scraping de precios), tanto con token como sin él. Para comparar precios de la competencia, navegar el sitio público con el navegador (`listado.mercadolibre.com.ar` o `inmuebles.mercadolibre.com.ar` para el vertical de inmuebles) y leer la página, no pegarle a la API.

## La Secret Key pide verificar la cuenta

La primera vez que se entra a ver la Secret Key de una app, Mercado Libre pide un código por SMS/WhatsApp/llamada al celular de la cuenta. Es una verificación de identidad de la persona dueña de la cuenta — no se puede resolver por API ni por navegador automatizado, hay que pedirle a la persona que lo haga y pase la clave resultante.
