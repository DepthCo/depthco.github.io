/*
 * Chequeo contra el mercado (ver CLAUDE.md).
 * Uso: node test/precios.test.js
 */
const cfg = require("../config.js");
const P = require("../pricing.js");

const CASOS = [
  { nombre: "Engranaje PETG 18 g", material: "petg", gramos: 18, esperado: 4300 },
  { nombre: "Pieza PLA 80 g", material: "pla", gramos: 80, esperado: 9500 },
  { nombre: "Maceta PETG 120 g", material: "petg", gramos: 120, esperado: 14800 },
  { nombre: "Pieza PLA 300 g", material: "pla", gramos: 300, esperado: 28800 }
];

let fallas = 0;
function check(ok, msg) {
  console.log((ok ? "  ok   " : "  FALLA") + "  " + msg);
  if (!ok) fallas++;
}

console.log("Chequeo contra el mercado (1 unidad, sin urgencia):");
CASOS.forEach((c) => {
  const r = P.cotizarImpresion(cfg, { gramos: c.gramos, material: c.material, cantidad: 1, urgente: false });
  check(r.subtotalRedondeado === c.esperado,
    `${c.nombre}: fórmula ${P.formatoPesos(r.subtotalRedondeado)} (esperado ~${P.formatoPesos(c.esperado)})`);
  const final = Math.max(c.esperado, cfg.PRECIO_MINIMO);
  check(r.total === final,
    `${c.nombre}: precio final ${P.formatoPesos(r.total)}${r.aplicaMinimo ? " (aplica PRECIO_MINIMO)" : ""}`);
});

console.log("Reglas del cotizador:");
const urg = P.cotizarImpresion(cfg, { gramos: 80, material: "pla", cantidad: 1, urgente: true });
check(urg.total === P.redondearCentena(9500 * 1.3), `Urgente +30%: ${P.formatoPesos(urg.total)}`);

const tec = P.unitario(cfg, 20, "petgcf");
check(Math.abs(tec.maquina - (20 / 18) * 1500 * 1.25) < 1e-9, "Recargo técnico +25% sobre la hora");

check(P.descuentoPorCantidad(cfg, 4) === 0 && P.descuentoPorCantidad(cfg, 5) === 0.05 &&
  P.descuentoPorCantidad(cfg, 10) === 0.10 && P.descuentoPorCantidad(cfg, 50) === 0.15, "Descuentos por cantidad 5/10/50");
check(P.cotizarImpresion(cfg, { gramos: 10, material: "pla", cantidad: 100 }).consultar, "Desde 100 unidades: a consultar");

const vol = P.cotizarArchivo(cfg, { volumenCm3: 10, material: "pla", relleno: 20, cantidad: 1 });
check(Math.abs(vol.gramos - 10 * 1.24 * 0.45) < 1e-9, `Gramos desde volumen: 10 cm³ PLA 20% = ${vol.gramos.toFixed(2)} g`);

check(P.entraEnVolumen(cfg, [256, 100, 50]) && !P.entraEnVolumen(cfg, [257, 10, 10]), "Volumen máximo 256 mm");

const rel = P.cotizarRelevamiento(cfg, { nivel: "simple", material: "recomendame", cantidad: 1, urgente: false });
check(rel.diseno.total === 15000 && rel.impresion.total === 7600,
  `Relevamiento simple, 1 u.: diseño ${P.formatoPesos(rel.diseno.total)} + impresión ${P.formatoPesos(rel.impresion.total)} (50 g PETG), por separado`);
const comp = P.cotizarRelevamiento(cfg, { nivel: "compleja", material: "pla", cantidad: 3 });
const soloImp = P.cotizarImpresion(cfg, { gramos: cfg.GRAMOS_RELEVAMIENTO, material: "pla", cantidad: 3 });
check(comp.impresion.total === soloImp.total, "La impresión no depende del nivel de diseño");
const urgRel = P.cotizarRelevamiento(cfg, { nivel: "media", material: "pla", cantidad: 1, urgente: true });
check(urgRel.diseno.total === 45500, `Urgente también en el diseño: ${P.formatoPesos(urgRel.diseno.total)}`);
const nose = P.cotizarRelevamiento(cfg, { nivel: "nose", material: "pla", cantidad: 1 });
check(nose.nivel === "media" && nose.diseno.base === 35000, "\"No sé\" se cotiza como media");
const bon = P.cotizarRelevamiento(cfg, { nivel: "simple", material: "pla", cantidad: 10 });
check(bon.diseno.bonificado && bon.diseno.total === 0, "Diseño simple bonificado desde 10 unidades");
const noBon = P.cotizarRelevamiento(cfg, { nivel: "media", material: "pla", cantidad: 10 });
check(!noBon.diseno.bonificado, "Diseño medio no se bonifica");

console.log("Catálogo (data/catalogo.json):");
let cat = null;
try { cat = JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "../data/catalogo.json"), "utf8")); } catch (e) { /* se informa abajo */ }
check(!!cat, "El archivo es JSON válido");
if (cat) {
  const tr = cat.llaveros.precios;
  check(tr.length > 0 && tr[0].desde === 1 && tr.every((t, i) => i === 0 || t.desde > tr[i - 1].desde),
    "Llaveros: los tramos de precio arrancan en 1 unidad y van en orden");
  check(cat.llaveros.modelos.every(m => m.nombre) && cat.lamparas.modelos.every(m => m.nombre), "Todos los productos tienen nombre");
  check(cat.llaveros.colores.every(c => /^#[0-9a-f]{6}$/i.test(c.hex)), "Colores de llaveros con código válido");
}

console.log(fallas ? `\n${fallas} chequeo(s) fallaron.` : "\nTodo OK.");
process.exit(fallas ? 1 : 0);
