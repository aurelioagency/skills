"use client";

import { useEffect, useState } from "react";

// Copiar a components/CookieBanner.tsx y montarlo en app/layout.tsx dentro del <body>.
// Guarda la elección en localStorage. Analytics debe leer esta misma clave
// antes de cargar cualquier script de tracking (ver punto 19 del checklist).

const STORAGE_KEY = "cookie-consent";

export function hasCookieConsent(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "accepted";
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function choose(value: "accepted" | "rejected") {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
    window.location.reload(); // para que analytics se cargue/descargue según la elección
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimiento de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col gap-3 border-t bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm">
        Usamos cookies para analítica del sitio. Podés aceptarlas o rechazarlas.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => choose("rejected")}
          className="rounded border px-4 py-2 text-sm"
        >
          Rechazar
        </button>
        <button
          onClick={() => choose("accepted")}
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
