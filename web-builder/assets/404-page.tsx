// Copiar a app/not-found.tsx. Adaptar colores/tipografía a la identidad
// visual definida en el Paso 3 del SKILL.md — este es solo el esqueleto.
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-bold">Página no encontrada</h1>
      <p className="text-neutral-600">
        La página que buscás no existe o se movió de lugar.
      </p>
      <Link href="/" className="rounded bg-black px-5 py-2 text-white">
        Volver al inicio
      </Link>
    </main>
  );
}
