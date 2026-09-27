import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Copiar este archivo a middleware.ts en la raíz del proyecto.
// Fuerza HTTPS en producción. En local (npm run dev) no hace nada,
// porque el dev server de Next no sirve HTTPS.
export function middleware(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto");

  if (process.env.NODE_ENV === "production" && proto === "http") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
