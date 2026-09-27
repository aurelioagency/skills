# Auth.js (NextAuth) — setup para App Router

```bash
npm i next-auth
```

`app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Opción social — requiere GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.local
    Google,

    // Opción email/password — reemplazar authorize() por la verificación real
    // contra la base de datos del usuario (hash de contraseña, nunca en texto plano).
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        // TODO: verificar contra la base de datos real.
        return null;
      },
    }),
  ],
});

export const { GET, POST } = handlers;
```

`middleware.ts` (si no hay ya uno de web-builder para HTTPS, combinar ambos en el mismo archivo):

```ts
export { auth as middleware } from "@/app/api/auth/[...nextauth]/route";
```

Para proteger una página (ej. "Mis compras"), en el propio Server Component:

```ts
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function MisComprasPage() {
  const session = await auth();
  if (!session) redirect("/login");
  // ... mostrar las compras del usuario
}
```

Variables de entorno necesarias en `.env.local`: `AUTH_SECRET` (generar con `npx auth secret`), y las del proveedor elegido (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` si es login social).
