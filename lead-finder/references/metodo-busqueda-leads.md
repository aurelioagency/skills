# Método para buscar leads NUEVOS y completar su contacto (sirve para cualquier rubro)

Reglas tomadas del documento interno "Método de búsqueda y enriquecimiento de leads (autopartes ML)" (5/10/2026) y de la búsqueda
de autopartes en México y Colombia de octubre de 2026. **El rubro y los países cambian en cada búsqueda; el método no.**
Autopartes en Mercado Libre es solo el primer ejemplo de configuración.

## 1. Qué cambia en cada búsqueda y qué no

- **Cambia (va en `scripts/pipeline/rubros/<rubro>.json` y `paises.json`, ver `rubros-y-paises.md`):** el rubro, los sub-rubros,
  los países (prefijo de teléfono, dónde se vende), las zonas (ciudades o estados), las consultas, la lista de qué descartar
  y cómo se reconoce que una tienda o una cuenta de Instagram es del rubro.
- **No cambia:** las reglas de abajo. Para otro rubro se copia el archivo de un rubro parecido, se cambian esos campos y se corre igual.
  Rubros y países se eligen en el menú que muestra la skill al invocarla; el proceso corre solo para cada combinación.
- Si el rubro no vende en Mercado Libre, `tiendas_ml.activar` queda en `false` y la búsqueda sale de Instagram, webs, Google Maps y directorios.

## 2. Fuente de verdad y anti-duplicados

- El **Excel de campaña** es la fuente de verdad. La ruta la da el usuario. Hoy tiene **solo dos pestañas visibles: `Leads` (el listado
  completo) y `Seguimientos` (la agenda)**. Nunca crear pestañas ni copias nuevas.
- Es `.xlsm`: abrirlo y guardarlo siempre con `openpyxl` y `keep_vba=True`.
- Dos niveles de anti-duplicado:
  1. **No volver a agregar empresas** que ya están: se compara por nombre normalizado, por handle de Instagram, por dominio de
     mail o web, por teléfono y por la tienda de Mercado Libre. Se hace **antes** de gastar tiempo en buscarles contacto.
  2. **No re-contactar:** una fila con Mail enviado `SI`, `REBOTADO`, o con Instagram `SI`, `CUENTA_NO_DISPONIBLE` o `NO_ENVIAR`
     queda fuera de cualquier envío. Solo `NO` o vacío con un dato de contacto válido es "mandable". Los estados tienen formatos
     raros (`SI\t2026-09-25`): no filtrar solo por `== "SI"`, usar "empieza con SI".
- Agregar solo filas nuevas al final. Nunca sobrescribir filas existentes.

## 3. Flujo (los scripts están en `scripts/pipeline/`)

| Paso | Qué se hace | Script |
|---|---|---|
| 1 | Leer el Excel y armar el índice de lo que ya existe (nombres, handles, dominios, teléfonos, mails, tiendas) | `leads_common.build_index` |
| 2 | Buscar candidatos: tiendas de Mercado Libre y cuentas de Instagram, por sub-rubro y por ciudad o estado | `buscar_leads.py` etapa A |
| 3 | Descartar al toque lo que ya está en el índice | `buscar_leads.py` |
| 4 | Verificar que sea del rubro: tiendas por los productos que venden, Instagram por la bio | etapas B y C |
| 5 | Sacar mail, WhatsApp, Instagram y web, **solo de fuentes propias** | etapa D |
| 6 | Completar lo que falta con una segunda pasada | `completar_datos.py` |
| 7 | Controlar que cada dato corresponda a su empresa | `verificar_datos.py` |
| 8 | Mostrar el CSV al usuario. **Solo si lo pide**, cargarlo al Excel | `cargar_excel.py` |

Cada etapa guarda su avance en la carpeta de trabajo y se puede reanudar. Las búsquedas son lentas (unos 40 a 60 segundos por consulta
con 3 en paralelo): lanzarlas en segundo plano y avisar el avance por hitos.

## 4. Cómo buscar candidatos (dorks)

- Se varía por **sub-rubro** y por **ciudad o estado**, para que cada consulta traiga candidatos distintos.
- Sobre tiendas: `site:<mercadolibre del país>/tienda <sub-rubro>` y `/pagina <sub-rubro>`.
- Sobre Instagram: `site:instagram.com <rubro> <zona> envios mercado libre` y `... whatsapp`.
- Sobre negocios con web: `<rubro> <zona> tienda en linea mercadolibre whatsapp`.
- Aprovechar las **menciones cruzadas**: las cuentas del rubro etiquetan a otras, y esas son candidatos nuevos.
- **Buscadores que andan con Scrapling: Brave y Yahoo.** Google da captcha y Bing devuelve resultados sin relación con el rubro
  (frases del día, viajes). El buscador interno de Mercado Libre tiene muro anti-bot: a las tiendas se llega por los buscadores,
  y la página de la tienda (`/tienda/<slug>`, `/pagina/<slug>`) sí se abre.

## 5. Verificar el rubro

- **Tiendas de Mercado Libre:** abrir la tienda y leer los títulos de sus productos. Se queda si la mayoría (70 % o más) son del
  rubro y casi ninguno de lo que se excluye (por ejemplo motos). El nombre de la tienda no alcanza: hay "Autopartes" que venden
  lencería y "Refacciones" que venden filtros de agua.
- **Instagram:** abrir el perfil en vivo. Perfil que no existe: cuenta muerta (`CUENTA_NO_DISPONIBLE`). Privada, con muy pocos
  seguidores (menos de 20), de otro rubro o de otro país: `NO_ENVIAR` o directamente no entra. Viva y del rubro: queda pendiente.
  Ideal con el Chrome logueado de la cuenta de la empresa (confirmar la cuenta en `instagram.com/accounts/edit/`); si no se puede,
  alcanza con leerlo en público con Scrapling, y se aclara que se hizo así.
- **Descartar siempre:** fábricas y marcas que no revenden; concesionarias; ferreterías y corralones; detailing y cosmética; rubros
  parecidos pero distintos (hogar, náutica, camping, montacargas); coleccionables; cuentas privadas o con casi cero seguidores;
  handles genéricos no verificables; nombres engañosos ("Tienda Wix" es "hecha en Wix", no una marca); **empresas de otro país**.
  La lista exacta de cada rubro va en el config (`descartar_nombre_regex`, `descartar_marcas`, `instagram.excluir_regex`).

## 6. De dónde sale cada dato de contacto (orden: de la que más rinde a la que menos)

1. **Web propia de la empresa** (la que mejor da mails): home, `/contacto`, `/contactanos`, `/nosotros`, `/aviso-de-privacidad`,
   `/politica-de-privacidad`, `/pages/contacto` y las páginas que lista el `sitemap.xml`. Buscar `mailto:` y el símbolo `@`; el
   WhatsApp y el teléfono casi siempre están en el pie. Las tiendas de Tiendanube o Mercado Shops también muestran el mail en el pie.
2. **Bio de Instagram y su linktree:** WhatsApp, teléfono, mail y link a la web. Confirma el nombre real para el saludo.
3. **Página de Facebook de la empresa** (sección Información). Vale solo si el nombre de la página lleva la marca.
4. **Ficha de Google Maps** (con la ciudad que dice la bio). Vale solo si el nombre de la ficha lleva la marca. Da el teléfono y la web.
5. **Directorios** (Páginas Amarillas, Cybo). Valen solo si el título de la página lleva la marca. Dan teléfono y dirección.

Lo que **no** sirve como fuente: el resultado suelto de un buscador ("el panel resumen" mezcla empresas con nombre parecido) y los
datos que aparecen para varias empresas a la vez (suelen ser de un directorio o un agregador).

## 7. Reglas de oro de calidad

- **Nunca inventar un mail ni un teléfono.** Si no está público, queda vacío. La mayoría de las pymes no publica mail y usa solo
  WhatsApp o Instagram: es normal. En el CSV cada lead lleva su **Estado** ("Completo" o "Falta: ...") y la columna "De_donde_sale".
- **El dominio del mail tiene que coincidir con la marca** o con su web propia. Si "Empresa X" tiene un mail `@otracosa.com`, puede
  ser el sitio de otra empresa: se saca. (Excepción: el mail que sale de la bio, del linktree o de la página de Facebook de la empresa.)
- **Un teléfono o un mail que aparece en dos empresas distintas no es de ninguna de las dos:** se saca de las dos.
- **Un dato que ya está en el Excel** (teléfono, mail, handle, tienda) indica una empresa repetida: se saca o se omite la fila.
- **El país tiene que ser el pedido:** el prefijo del teléfono, el sufijo de la web (`.com.ar`, `.ve`) y la bio ("Caracas",
  "Valencia, Carabobo", "ZOOM y Domesa") delatan otro país. Se filtra desde el principio, no al final.
- Una web que es un acortador (`bit.ly`, `wa.link`, `g.co`, `linktr.ee`) no es la web de la empresa.
- Guardar el **nombre real** que muestra el perfil o la web, no el nombre crudo en mayúsculas del listado.
- **No sacar números de la columna de teléfono / WhatsApp por suposición** (decisión del usuario): si no se sabe si un teléfono tiene
  WhatsApp, queda tal cual, con su fuente en las notas.

## 8. Cargar al Excel (solo cuando el usuario lo pide)

- `cargar_excel.py` copia el Excel a una carpeta temporal, agrega las filas nuevas al final con `Mail enviado`, `IG enviado` y
  `WhatsApp enviado` en `NO`, comprueba que **todas** las celdas existentes de **todas** las hojas quedaron idénticas, y recién
  ahí reemplaza el original, si nadie lo cambió mientras tanto.
- La columna "Teléfono / WhatsApp" lleva los números de WhatsApp; si una empresa no tiene, lleva el teléfono encontrado.
- La columna "Carga" marca las filas de esa corrida (por ejemplo "2026-10-20 (búsqueda MX/CO)") para poder filtrarlas.
- **Si el Excel está abierto** (Windows lo bloquea con `PermissionError`), pedirle al usuario que lo cierre. No cerrar nada vos.
- **Un solo escritor a la vez:** si dos sesiones guardan a la vez, una pisa a la otra.
- No dejar copias ni backups sueltos en las carpetas del usuario salvo que los pida. El usuario trabaja con **un solo archivo**.
- Las correcciones van al Excel, no a un JSON temporal: otra sesión puede usar el dato sucio.

## 9. Errores que ya ocurrieron (y cómo se resuelven)

- **El navegador de Scrapling desapareció** (una limpieza de caché borró `ms-playwright`) y las búsquedas daban cero resultados sin error.
  Los scripts lo chequean al empezar y avisan. Se arregla con `python -m patchright install chromium` (pedir OK, baja unos 115 MB).
  Si dentro de un shell sandboxeado dice `spawn UNKNOWN`, correr fuera del sandbox o desde la terminal de la PC. No se reemplaza por otra herramienta.
- **Instagram bloquea el contacto de negocio** (mail y teléfono del botón "Contactar") con error 429, también con el Chrome logueado.
  No forzarlo: arriesga la cuenta de la empresa.
- **Se colaron leads de otro país** (Argentina, Venezuela, Honduras, Panamá). Filtrar por sufijo de web, bio y prefijo desde el principio.
- **Empresas con dos Instagram** (MR Refacciones y Mercado de Refacciones): `verificar_datos.py` las lista como "posible empresa repetida" para unirlas a mano.
- **Escribir scripts con expresiones regulares generadas desde otro script rompe las barras invertidas.** Escribir los scripts como archivo.
- **La carpeta temporal de la sesión se vacía sola:** los scripts viven en la skill, no en el scratchpad.
- Las reglas para el **envío** (otra skill, no esta): no dar por enviado sin verificar con captura del mensaje enviado, no pegar con `\n`
  en el editor de Instagram (usar Shift+Enter), frenar ante el primer error por límite anti-spam, confirmar el navegador y la cuenta
  correctos antes de enviar, y Gmail reescribe los links salientes.

## 10. Resultado de referencia: autopartes en México y Colombia (octubre de 2026)

Con 266 consultas y unos 300 candidatos se llegó a **262 leads nuevos** (los que no estaban en el Excel): 252 con Instagram, 104 con
mail y 153 con WhatsApp o teléfono; unos 70 con los tres datos y unos 90 solo con Instagram. Los negocios chicos de Colombia dan
más Instagram que mails o teléfonos. Después de cargarlos, el Excel quedó en 1.831 filas.

## 11. Mejoras pendientes

- **Más mails:** el contacto de negocio de Instagram es la fuente que más sumaría. Solo con el Chrome logueado, de a 10 o 15 perfiles
  por hora, y **avisando antes al usuario** por el riesgo para la cuenta.
- **Prioridad:** agregar a `Leads` una columna con el estado de los datos ("Completo" o qué falta) y otra con la reputación de la tienda
  en Mercado Libre, para empezar por los mejores.
- **Programarlo:** correr la búsqueda una vez por semana en segundo plano y dejar el CSV para revisar (nunca cargar solo).
- **Otros países:** `norm_phone` y `TLD_PAIS` en `leads_common.py` cubren México y Colombia con reglas simples; para Argentina u otro país
  hay que definir su largo de número y su prefijo en el config.
