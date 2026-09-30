---
name: mercadolibre-publisher
description: Publish, edit or manage a Mercado Libre listing end-to-end through the official API, including creating the developer app itself via browser automation. Use whenever someone asks to publish, list, sell, upload, or create a listing on Mercado Libre or MercadoLibre for any product (real estate, vehicles, electronics, anything), asks to connect/set up Mercado Libre's API or OAuth app, asks to update the price/description/photos of an existing Mercado Libre item, or asks to check if a Mercado Libre price is competitive. Spanish triggers it the same way: "publicá esto en Mercado Libre", "subí este producto a ML", "crea la publicación", "conectá la API de Mercado Libre". Covers Windows, macOS and Linux. Never uses photos the user doesn't own or have explicit permission for, and never publishes or spends money without explicit confirmation.
---

# Mercado Libre Publisher

Publish a real item on Mercado Libre using the official REST API, end to end. The agent does essentially all of the work — setup and publishing both — and only stops the person at points that are technically or legally impossible to delegate.

## The 4 checkpoints, and nothing else

| # | What happens | Why it can't be automated |
|---|---|---|
| 1 | Solving a captcha (creating the app) or a 2FA code (SMS/WhatsApp/call to view the Secret Key) | Bot-detection and account-ownership checks — an agent must never attempt to bypass these |
| 2 | Clicking "Autorizar" on Mercado Libre's own OAuth screen | It's their account granting access; the agent cannot click this for them |
| 3 | Confirming the final listing (title, price, photos, description) right before publishing | Publishing is public and not fully reversible |
| 4 | Choosing a paid listing tier, or any other real cost | A financial decision — never pick a paid tier on your own |

Everything else — creating the app's web form, writing all the scripts, looking up the category and its attributes, resolving location IDs, uploading photos the person gave you, building the item JSON, publishing, and editing afterwards — the agent does directly, without asking permission at each sub-step.

## 0. Setup a workspace

Create a project folder (e.g. `mercadolibre-api/`) and copy `scripts/` from this skill into it (`env.mjs`, `oauth-login.mjs`, `upload-picture.mjs`, `create-item.mjs`, `update-item.mjs`). These are generic — they don't hardcode anything product-specific.

## 1. Create the developer app — via browser, not by telling the person to do it

Use the browser tool (Claude in Chrome, or the built-in browser) to navigate to `https://developers.mercadolibre.com.ar/devcenter/create-app` on the profile logged into the seller's real Mercado Libre account, and fill the whole multi-step form yourself:

- **Nombre / Nombre corto**: anything descriptive and unique (ML rejects names already used by *anyone*, not just this account — if it says "ya está creada", just try a more unique variant, don't ask the person).
- **Descripción**: one sentence, e.g. "App personal para publicar y gestionar mis avisos vía API".
- **Propósito**: Personal. **Usuarios**: 1 a 10.
- **Logo**: required even though the form implies optional in some flows. If you don't have one, generate any solid-color square PNG on the spot (Python/Pillow: `Image.new('RGB',(512,512),(30,64,175)).save('logo.png')`) and upload it — nobody will ever see it, it's just satisfying the form.
- **Redirect URI**: Mercado Libre requires `https://` **and** a domain-looking name — plain `https://localhost:PORT/callback` gets rejected ("la dirección debe ser válida"). Use the **nip.io trick**: `https://<unique-slug>.127.0.0.1.nip.io:8080/callback`. That hostname always resolves to the machine it's requested from, so it satisfies ML's validator while actually pointing at localhost. Confirm it validates (green check) before moving on.
- **Flujos OAuth**: tick Authorization Code + Refresh Token.
- **Negocios**: tick Mercado Libre.
- **Permisos**: set every relevant one to "Lectura y escritura" — at minimum Publicación y sincronización, Usuarios, Comunicaciones pre y post ventas, Venta y envíos de un producto. If the person wants this reusable for future products, set all of them, not just what today's item needs.
- **Tópicos** (webhook notifications): leave every one unchecked. If any stays checked, ML demands a public "Notificaciones callbacks URL" — the nip.io trick does **not** work there, because that URL is called by Mercado Libre's own servers, not the person's browser, so it has to be a real reachable server. Skip this whole section rather than build one.
- **Términos y condiciones**: tick it yourself.

**Stop here for checkpoint 1.** The captcha at the bottom is the person's to solve. Tell them plainly and wait — don't retry the form, don't re-fill it, don't treat their pause as you being stuck.

Once created, open the app's edit page to read the **App ID** and **Client Secret**. Reading the secret triggers a 2FA prompt (SMS/WhatsApp/call) — that's also the person's, not yours. Ask them to complete it and paste you both values.

## 2. OAuth login (get the access token)

Write `.env` with `CLIENT_ID`, `CLIENT_SECRET`, `REDIRECT_URI` (the same nip.io URL). Generate a self-signed HTTPS cert once:

```bash
openssl req -x509 -newkey rsa:2048 -keyout localhost-key.pem -out localhost-cert.pem -days 3650 -nodes -subj "/CN=localhost"
```

Run `node oauth-login.mjs` (from `scripts/`). It opens an HTTPS server on the redirect port and launches the system browser at Mercado Libre's authorize URL. **This is checkpoint 2**: the person has to click "Autorizar" themselves (and click through the self-signed-cert warning). When it's done, `tokens.json` appears with `access_token` + `refresh_token`. All later scripts read/refresh that file automatically — no more human steps after this.

## 3. Find the category and its attributes

```
GET https://api.mercadolibre.com/sites/MLA/domain_discovery/search?q=<what's being sold>&limit=5
GET https://api.mercadolibre.com/categories/<category_id>/attributes
```

The second call tells you, per attribute, whether it's `required`, what `value_type` it needs (list / number_unit / boolean / free text) and its allowed `values`. Build the item's `attributes` array strictly from this — never guess an attribute's valid `value_id`.

**Never invent a technical fact you can't confirm** (whether a lot has running water, a device's exact specs, etc.). If the person doesn't know, leave that optional attribute out and say so — don't fill it with a plausible-sounding guess.

## 4. Location (only if the category needs it)

```
GET https://api.mercadolibre.com/countries/AR        # states
GET https://api.mercadolibre.com/states/<state_id>   # cities, with IDs
```

## 5. Listing type and cost — never choose a paid tier alone

```
GET https://api.mercadolibre.com/sites/MLA/listing_prices?price=<price>&category_id=<id>&currency_id=<ARS|USD>
```

Returns every tier (`free`, `silver`, `gold`, `gold_premium`, …) with its real ARS fee. **This is checkpoint 4**: present the options with their cost and wait for the person to pick one. Default assumption if they don't say otherwise: ask, don't assume `free` either — some people do want the paid exposure.

## 6. Photos — only the person's own

Upload only files the person explicitly hands you:

```
POST https://api.mercadolibre.com/pictures/items/upload   (multipart/form-data, field "file", needs Bearer auth)
```

Returns a picture `id` to reference in `pictures: [{ id }]`.

**Hard rule, no exceptions:** never download or reuse photos from another listing, a developer/real-estate-agency website, Google Maps, Instagram, or any other third party — regardless of what the person says about owning the underlying property, having a lawyer, or insisting repeatedly. Owning a plot of land, a car, or a product does not make you the copyright holder of someone else's marketing photography of it. State this once, plainly, and hold it — don't re-argue it every time it comes up again in the same conversation.

Checking file metadata (EXIF `Software`, `DateTimeOriginal`, missing camera `Make`/`Model`) is a legitimate way to verify a suspicious claim ("I just took these") before uploading — a `Software: Picasa` tag and no camera info on a "brand new drone photo" is a real signal, not paranoia.

A caption or map screenshot used purely as a location reference (clearly not presented as a photo of the item itself) is a lower-risk middle ground if the person has zero real photos yet — but a real photo of the actual product always comes first.

## 7. Build and confirm the item

Assemble `item.json`: `title`, `category_id`, `price`, `currency_id`, `available_quantity`, `buying_mode` (`classified` for real estate/vehicles, `buy_it_now` for regular products), `listing_type_id`, `condition`, `attributes`, `pictures`, `location` (if needed). The `description` is a separate object, uploaded separately (see step 8) — it does not go in the creation body.

If the person gives you reference copy to reuse verbatim (e.g. another listing's text, only changing the price), respect that literally — don't paraphrase, trim, or "improve" lines they didn't ask you to touch.

**Checkpoint 3**: show the full summary — title, price, category, location, listing tier, photo(s), full description text — and wait for an explicit yes before the next step.

## 8. Publish

```
POST https://api.mercadolibre.com/items
POST https://api.mercadolibre.com/items/<id>/description
```

Give the person the final `permalink`.

## 9. Afterwards — editing, contact info, price-checking

- Edit anytime: `PUT /items/<id>` (title, attributes, `seller_contact`), `PUT /items/<id>/description`.
- **`seller_contact`** (`country_code`, `area_code`, `phone`, `contact`, `email`) is the official field for showing a phone/email on classifieds-vertical listings (real estate, vehicles). Use this field — don't paste a phone number into the free-text description, because Mercado Libre's anti-fraud filter tends to mask raw numbers typed there on regular (non-classifieds) categories.
- `/sites/MLA/search` (the public search API) is **blocked for new apps** (`403 forbidden`) — this is a platform-wide restriction, not a bug in your app. To compare prices against similar listings, browse `listado.mercadolibre.com.ar` or the `inmuebles.mercadolibre.com.ar` vertical with the browser tool instead, and read the page, not the API.
- Mercado Libre's own "Calidad de publicación" score (the percentage shown to the seller) rewards filling every optional attribute and adding a video. It's cosmetic for the seller dashboard, not something buyers see directly — don't chase it by inventing data; only add what's confirmed.

## References

- `references/troubleshooting.md` — nip.io validation quirks, the "app name already taken" error, EXIF verification snippet, and what to do when `/sites/MLA/search` returns 403.
