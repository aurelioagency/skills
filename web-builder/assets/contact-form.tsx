"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// npm i react-hook-form zod @hookform/resolvers
// Ejemplo de formulario de contacto con validación (punto 17) y honeypot
// anti-spam (punto 18). Adaptar campos al formulario real que necesite el sitio.

const schema = z.object({
  name: z.string().min(2, "Ingresá tu nombre"),
  email: z.string().email("Email inválido"),
  message: z.string().min(10, "Contanos un poco más"),
  // Campo honeypot: invisible para humanos vía CSS, un bot lo completa.
  website: z.string().max(0).optional(),
});

type FormData = z.infer<typeof schema>;

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    if (data.website) return; // honeypot lleno = bot, descartar en silencio

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      alert("Hubo un error al enviar el formulario. Probá de nuevo.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <input
        {...register("website")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px]"
      />

      <div>
        <label htmlFor="name">Nombre</label>
        <input id="name" {...register("name")} className="w-full border p-2" />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" {...register("email")} className="w-full border p-2" />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="message">Mensaje</label>
        <textarea id="message" {...register("message")} className="w-full border p-2" />
        {errors.message && <p className="text-sm text-red-600">{errors.message.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="rounded bg-black px-5 py-2 text-white">
        {isSubmitting ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
