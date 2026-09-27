import type { MetadataRoute } from "next";

// Copiar a app/robots.ts. Completar SITE_URL.
const SITE_URL = "https://{{dominio_del_sitio}}";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
