/*
 * Chequeos de seguridad de la web.
 * Uso: node test/seguridad.test.js
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const RAIZ = path.join(__dirname, "..");
const leer = (f) => fs.readFileSync(path.join(RAIZ, f), "utf8");

let fallas = 0;
function check(ok, msg) {
  console.log((ok ? "  ok   " : "  FALLA") + "  " + msg);
  if (!ok) fallas++;
}

console.log("Política de seguridad (CSP) en cada página:");
for (const pagina of ["index.html", "llaveros.html", "lamparas.html", "admin.html"]) {
  const html = leer(pagina);
  const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1] || "";
  check(/script-src 'self'/.test(csp) && /object-src 'none'/.test(csp), `${pagina}: scripts solo de sitios permitidos`);
  // Los únicos <script> sin src permitidos son el importmap (con hash) y los datos JSON-LD (no se ejecutan)
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].map((m) => m[1]);
  check(inline.every((a) => /type="(importmap|application\/ld\+json)"/.test(a)), `${pagina}: sin scripts sueltos dentro del HTML`);
}

console.log("three.js desde el CDN:");
const index = leer("index.html");
const imap = (index.match(/<script type="importmap">([\s\S]*?)<\/script>/) || [])[1] || "";
const hash = "sha256-" + crypto.createHash("sha256").update(imap).digest("base64");
check(index.includes(`'${hash}'`), "El hash del importmap coincide con la CSP (si cambiás el importmap, actualizá el hash)");
let mapa = {};
try { mapa = JSON.parse(imap); } catch (e) { /* se informa abajo */ }
const usados = [...leer("cotizador-archivo.js").matchAll(/import\("three(?:\/addons\/([^"]+))?"\)/g)]
  .map((m) => m[1] ? "examples/jsm/" + m[1] : "build/three.module.js");
const integ = mapa.integrity || {};
check(usados.length > 0 && usados.every((u) => Object.keys(integ).some((k) => k.endsWith(u))),
  "Cada módulo de three.js que se carga tiene su huella de integridad");

console.log("Datos sensibles:");
let archivos = [];
try { archivos = execSync("git ls-files", { cwd: RAIZ, encoding: "utf8" }).split("\n").filter((f) => /\.(js|json|html|md|css)$/.test(f)); } catch (e) { /* fuera de git */ }
const patron = /(github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;
const conSecretos = archivos.filter((f) => patron.test(leer(f)));
check(conSecretos.length === 0, "Ningún token ni clave en el repositorio" + (conSecretos.length ? ": " + conSecretos.join(", ") : ""));
check(!/[\w.]+@gmail\.com/.test(index), "El mail no aparece escrito en el HTML (los bots no lo pueden leer)");

console.log("Compatibilidad con la política de seguridad:");
const propios = ["main.js", "animaciones.js", "pricing.js", "cotizador-foto.js", "cotizador-archivo.js", "catalogo-datos.js", "llaveros.js", "lamparas.js", "admin.js"];
const conEval = propios.filter((f) => /\beval\s*\(|new Function\s*\(|set(Timeout|Interval)\s*\(\s*["'`]/.test(leer(f)));
check(conEval.length === 0, "Ningún script ejecuta texto como código (la CSP lo bloquearía)" + (conEval.length ? ": " + conEval.join(", ") : ""));
const cfgTxt = leer("config.js");
let cfgOk = false;
try { cfgOk = !!JSON.parse(cfgTxt.slice(cfgTxt.indexOf("{", cfgTxt.indexOf("DEPTHCO_CONFIG")), cfgTxt.lastIndexOf("};") + 1)).VALOR_HORA; } catch (e) { /* queda en false */ }
check(cfgOk, "config.js se puede leer como datos (así lo lee el panel)");

console.log(fallas ? `\n${fallas} chequeo(s) fallaron.` : "\nTodo OK.");
process.exit(fallas ? 1 : 0);
