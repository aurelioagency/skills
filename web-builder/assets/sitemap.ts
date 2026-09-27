import type { MetadataRoute } from "next";

// Copiar a app/sitemap.ts. Completar SITE_URL y la lista de rutas reales del sitio.
const SITE_URL = "https://{{dominio_del_sitio}}";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/servicios", "/contacto", "/politica-de-privacidad", "/terminos"];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));
}
