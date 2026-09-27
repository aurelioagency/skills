# Recursos de terceros

Todos estos son proyectos publicados por otra gente, no código propio de esta skill. Avisale siempre al usuario antes de correr el comando de instalación — son paquetes externos que se agregan al proyecto o al harness.

## Skills de diseño (se instalan como skills de Claude Code/Codex, vía `npx skills add`)

| Recurso | Qué hace | Instalación | Repo |
|---|---|---|---|
| Emil Kowalski — skills de animación | Da criterio de qué animar, con qué curva y duración, para que el motion se sienta intencional y no decorativo | `npx skills add emilkowalski/skills` | https://github.com/emilkowalski/skills |
| Impeccable | 23 comandos que corrigen tipografía, contraste, estructura y espaciado con una sola instrucción | `npx impeccable install` | https://github.com/pbakaus/impeccable |
| Taste | Reverse-engineerea el "por qué" del diseño de una web de referencia (tokens + trade-offs), para no caer en diseño genérico | `npx skills add Leonxlnx/taste-skill`, después `/taste <url>` | https://github.com/Leonxlnx/taste-skill |
| UI/UX Pro Max | Base de datos de estilos, paletas, tipografías y guías UX para elegir identidad visual cuando no hay web de referencia | ver repo | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill |

Si alguna de estas skills no está instalada y el usuario no quiere instalarla en el momento, seguí sin ella — el resultado va a ser más genérico en ese aspecto puntual, pero no bloquea el resto del trabajo. Decíselo explícitamente en el reporte final.

## MCP servers

| Recurso | Qué hace | Config | Repo |
|---|---|---|---|
| Playwright MCP (oficial de Microsoft) | Le da a Claude un navegador real para abrir el sitio construido, revisarlo visualmente (contraste, mobile, enlaces) y autocorregir | `npx @playwright/mcp@latest` como servidor MCP | https://github.com/microsoft/playwright-mcp |
| 21st.dev / Magic MCP | Busca e inserta componentes React/Tailwind reales (hero, pricing, testimonios) en vez de generar UI desde cero | ver https://21st.dev/mcp para el setup con API key | https://github.com/21st-dev/magic-mcp |

Si estos MCP no están conectados en la sesión actual, la skill sigue funcionando sin ellos (ver Paso 4 y Paso 7 del SKILL.md) — no son un bloqueante, son un plus de calidad.

## Librerías de código (npm, no son skills)

- `framer-motion` — animaciones.
- `react-hook-form` + `zod` + `@hookform/resolvers` — formularios y validación.
- `@vercel/analytics` — analytics gratis (o tag de Google Analytics como alternativa, también gratis).
- `sharp` — usado por `scripts/optimize-images.mjs` para comprimir imágenes (viene como dependencia de `next/image` en muchos setups, verificar si hace falta instalarlo aparte).
