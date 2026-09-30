import { createServer } from "node:https";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { exec } from "node:child_process";
import { loadEnv } from "./env.mjs";

const env = loadEnv();
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = env;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  throw new Error("Completá CLIENT_ID, CLIENT_SECRET y REDIRECT_URI en .env");
}

const certPath = "localhost-cert.pem";
const keyPath = "localhost-key.pem";
if (!existsSync(certPath) || !existsSync(keyPath)) {
  throw new Error(
    "Falta el certificado HTTPS local. Generalo con:\n" +
      'openssl req -x509 -newkey rsa:2048 -keyout localhost-key.pem -out localhost-cert.pem -days 3650 -nodes -subj "/CN=localhost"'
  );
}

const redirectUrl = new URL(REDIRECT_URI);
const port = Number(redirectUrl.port || 443);

const authUrl = new URL("https://auth.mercadolibre.com.ar/authorization");
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);

const httpsOptions = {
  key: readFileSync(keyPath),
  cert: readFileSync(certPath),
};

const server = createServer(httpsOptions, async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== redirectUrl.pathname) {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>Error de autorización: ${error}</h2>`);
    server.close();
    return;
  }

  try {
    const tokenRes = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(JSON.stringify(tokenData));

    writeFileSync("tokens.json", JSON.stringify({ ...tokenData, obtained_at: Date.now() }, null, 2));

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>Listo. Ya podés cerrar esta pestaña y volver a la terminal.</h2>");
    console.log("Tokens guardados en tokens.json. User ID:", tokenData.user_id);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>Error al pedir el token</h2><pre>${err.message}</pre>`);
    console.error(err);
  } finally {
    server.close();
  }
});

server.listen(port, () => {
  console.log(`Escuchando en ${REDIRECT_URI}`);
  console.log("Abriendo el navegador para autorizar...");
  console.log(authUrl.toString());
  const opener = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
  exec(`${opener} "${authUrl.toString()}"`, { shell: process.platform === "win32" ? "cmd.exe" : undefined });
});
