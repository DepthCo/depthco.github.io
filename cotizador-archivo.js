/* DepthCo — cotizador, pestaña "Tengo el archivo": visor 3D, volumen de STL/3MF y precio. */
const cfg = window.DEPTHCO_CONFIG;
const P = window.DepthCoPricing;
const form = document.getElementById("form-archivo");

const el = {
  input: document.getElementById("archivo-input"),
  drop: document.getElementById("drop"),
  ejemplo: document.getElementById("archivo-ejemplo"),
  error: document.getElementById("archivo-error"),
  viewer: document.getElementById("viewer"),
  empty: document.getElementById("viewer-empty"),
  info: document.getElementById("viewer-info"),
  material: document.getElementById("archivo-material"),
  color: document.getElementById("archivo-color"),
  relleno: document.getElementById("archivo-relleno"),
  total: document.getElementById("archivo-total"),
  unidad: document.getElementById("archivo-unidad"),
  alerta: document.getElementById("archivo-alerta"),
  desglose: document.getElementById("archivo-desglose"),
  wa: document.getElementById("archivo-wa")
};

// Pieza cargada: { nombre, volumenCm3, dims: [x, y, z] mm }
let pieza = null;

/* ---------- Opciones del formulario (desde config.js) ---------- */
el.material.innerHTML = ["Estándar", "Técnico"].map((g) =>
  `<optgroup label="${g === "Técnico" ? "Técnicos" : g}">` +
  cfg.MATERIALES.filter((m) => m.grupo === g)
    .map((m) => `<option value="${m.id}"${m.id === "petg" ? " selected" : ""}>${m.nombre} — ${m.uso}</option>`).join("") +
  "</optgroup>"
).join("");
el.color.innerHTML = cfg.COLORES.map((c) => `<option>${c}</option>`).join("");
el.relleno.innerHTML = Object.keys(cfg.FACTOR_RELLENO)
  .map((r) => `<option value="${r}"${Number(r) === cfg.RELLENO_POR_DEFECTO ? " selected" : ""}>${r}%${r === "100" ? " (macizo)" : ""}</option>`).join("");

/* ---------- Precio ---------- */
const li = (label, valor) => `<li><span>${label}</span><strong>${valor}</strong></li>`;
const mm = (n) => (Math.round(n * 10) / 10).toString().replace(".", ",");
const fmtHoras = (h) => {
  const hh = Math.floor(h), min = Math.round((h - hh) * 60);
  return hh ? `${hh} h ${min.toString().padStart(2, "0")} min` : `${min} min`;
};

function actualizar() {
  const material = el.material.value;
  const relleno = Number(el.relleno.value);
  const cantidad = Math.max(1, parseInt(form.cantidad.value, 10) || 1);
  const urgente = form.urgente.checked;
  const waBase = `https://wa.me/${cfg.WHATSAPP}?text=`;

  if (!pieza) {
    el.wa.href = waBase + encodeURIComponent("pedido:\nTengo un archivo para imprimir.");
    return;
  }

  const medidas = `${mm(pieza.dims[0])} × ${mm(pieza.dims[1])} × ${mm(pieza.dims[2])} mm`;
  const mat = P.material(cfg, material);
  let precioLinea;

  if (!P.entraEnVolumen(cfg, pieza.dims)) {
    el.total.textContent = "A cotizar";
    el.unidad.textContent = medidas;
    el.alerta.textContent = `Tu pieza supera ${cfg.VOLUMEN_MAXIMO[0]} mm: la imprimimos en partes. Escribinos para cotizarla.`;
    el.desglose.innerHTML = "";
    precioLinea = "Precio estimado: a cotizar (supera el volumen máximo)";
  } else {
    const r = P.cotizarArchivo(cfg, { volumenCm3: pieza.volumenCm3, material, relleno, cantidad, urgente });
    if (r.consultar) {
      el.total.textContent = "A consultar";
      el.unidad.textContent = `${cantidad} unidades`;
      el.alerta.textContent = `Desde ${cfg.CANTIDAD_CONSULTAR} unidades: escribinos para precio por volumen.`;
      precioLinea = "Precio estimado: a consultar (precio por volumen)";
    } else {
      el.total.textContent = P.formatoPesos(r.total);
      el.unidad.textContent = cantidad > 1
        ? `${P.formatoPesos(r.porUnidad)} por unidad · ${cantidad} unidades`
        : "1 unidad";
      el.alerta.textContent = "";
      precioLinea = `Precio estimado: ${P.formatoPesos(r.total)} (${P.formatoPesos(r.porUnidad)} c/u)`;
    }
    const filas = [
      li("Material estimado por unidad", `${Math.round(r.gramos)} g`),
      li("Tiempo de máquina por unidad", fmtHoras(r.horas)),
      li("Volumen de la pieza", `${mm(pieza.volumenCm3)} cm³`)
    ];
    if (r.descuento) filas.push(li("Descuento por cantidad", `${Math.round(r.descuento * 100)}%`));
    if (urgente) filas.push(li("Urgente", `+${Math.round(cfg.RECARGO_URGENTE * 100)}%`));
    if (r.aplicaMinimo && !r.consultar) filas.push(li("Pedido mínimo", P.formatoPesos(cfg.PRECIO_MINIMO)));
    el.desglose.innerHTML = filas.join("");
  }

  const msg = [
    "pedido:",
    `Pieza: ${pieza.nombre}`,
    `Material: ${mat.nombre} | Color: ${el.color.value} | Relleno: ${relleno}%`,
    `Cantidad: ${cantidad} | Urgente: ${urgente ? "sí" : "no"}`,
    `Medidas: ${medidas}`,
    precioLinea
  ].join("\n");
  el.wa.href = waBase + encodeURIComponent(msg);
}

form.addEventListener("input", actualizar);
form.addEventListener("change", actualizar);
form.addEventListener("submit", (e) => e.preventDefault());
actualizar();

/* ---------- three.js (se carga recién cuando hace falta) ---------- */
let three = null;
async function cargarThree() {
  if (!three) {
    three = Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
      import("three/addons/loaders/STLLoader.js"),
      import("three/addons/loaders/3MFLoader.js")
    ]).then(([THREE, oc, stl, tmf]) => ({
      THREE, OrbitControls: oc.OrbitControls, STLLoader: stl.STLLoader, ThreeMFLoader: tmf.ThreeMFLoader
    }));
  }
  return three;
}

// Volumen de una malla cerrada: suma de tetraedros con signo (mm³).
function volumenObjeto(THREE, root) {
  let vol = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry, pos = g.attributes.position, idx = g.index, m = o.matrixWorld;
    const n = idx ? idx.count : pos.count;
    let v = 0;
    for (let i = 0; i < n; i += 3) {
      const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
      a.fromBufferAttribute(pos, i0).applyMatrix4(m);
      b.fromBufferAttribute(pos, i1).applyMatrix4(m);
      c.fromBufferAttribute(pos, i2).applyMatrix4(m);
      v += a.dot(b.clone().cross(c)) / 6;
    }
    vol += v;
  });
  return Math.abs(vol);
}

let escena = null;
function iniciarVisor(T) {
  const { THREE, OrbitControls } = T;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.viewer.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", "Vista 3D de la pieza");
  renderer.domElement.setAttribute("role", "img");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 10000);
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x5b3a29, 1.6));
  const sol = new THREE.DirectionalLight(0xffffff, 2.2);
  sol.position.set(1, 2, 1.5);
  scene.add(sol);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const render = () => renderer.render(scene, camera);
  let animando = false;
  controls.addEventListener("change", () => {
    if (animando) return;
    animando = true;
    requestAnimationFrame(function tick() {
      const sigue = controls.update();
      render();
      if (sigue) requestAnimationFrame(tick); else animando = false;
    });
  });

  const ajustar = () => {
    const w = el.viewer.clientWidth, h = el.viewer.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  };
  new ResizeObserver(ajustar).observe(el.viewer);

  escena = { THREE, scene, camera, controls, render, ajustar, objeto: null, grilla: null };
  return escena;
}

function mostrar(T, objeto) {
  const s = escena || iniciarVisor(T);
  const { THREE } = s;
  if (s.objeto) {
    s.scene.remove(s.objeto);
    s.objeto.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); } });
  }
  if (s.grilla) s.scene.remove(s.grilla);

  const material = new THREE.MeshStandardMaterial({ color: 0xa4522f, roughness: 0.62, metalness: 0.05 });
  objeto.traverse((o) => { if (o.isMesh) o.material = material; });

  // Los archivos de impresión vienen con Z hacia arriba; three usa Y hacia arriba.
  const pivote = new THREE.Group();
  objeto.rotation.x = -Math.PI / 2;
  pivote.add(objeto);
  pivote.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(pivote);
  const centro = box.getCenter(new THREE.Vector3());
  objeto.position.sub(new THREE.Vector3(centro.x, box.min.y, centro.z));
  s.scene.add(pivote);
  s.objeto = pivote;

  const size = box.getSize(new THREE.Vector3());
  const radio = Math.max(size.x, size.y, size.z);
  s.grilla = new THREE.GridHelper(radio * 2.4, 24, 0x8a8f94, 0xc9bfaf);
  s.scene.add(s.grilla);

  s.controls.target.set(0, size.y / 2, 0);
  s.camera.position.set(radio * 1.4, radio * 1.1, radio * 1.6);
  s.camera.near = radio / 100;
  s.camera.far = radio * 100;
  s.controls.update();
  el.empty.hidden = true;
  s.ajustar();
}

async function procesar(nombre, buffer) {
  el.error.textContent = "";
  const ext = nombre.split(".").pop().toLowerCase();
  if (ext !== "stl" && ext !== "3mf") {
    el.error.textContent = "Formato no soportado. Subí un archivo STL o 3MF.";
    return;
  }
  el.empty.textContent = "Procesando la pieza…";
  el.empty.hidden = false;
  try {
    const T = await cargarThree();
    let objeto;
    if (ext === "stl") {
      objeto = new T.THREE.Mesh(new T.STLLoader().parse(buffer));
    } else {
      objeto = new T.ThreeMFLoader().parse(buffer);
    }
    const volMm3 = volumenObjeto(T.THREE, objeto);
    objeto.updateMatrixWorld(true);
    const box = new T.THREE.Box3().setFromObject(objeto);
    const size = box.getSize(new T.THREE.Vector3());
    if (!isFinite(volMm3) || volMm3 < 1 || box.isEmpty()) {
      throw new Error("No encontramos un volumen cerrado en el archivo.");
    }
    pieza = { nombre, volumenCm3: volMm3 / 1000, dims: [size.x, size.y, size.z] };
    mostrar(T, objeto);
    el.info.innerHTML = `<span><strong>${nombre.replace(/[<>&]/g, "")}</strong></span>` +
      `<span>${mm(size.x)} × ${mm(size.y)} × ${mm(size.z)} mm</span>` +
      `<span>${mm(pieza.volumenCm3)} cm³</span>`;
    actualizar();
  } catch (err) {
    console.warn(err);
    pieza = null;
    el.empty.textContent = "Acá vas a ver tu pieza en 3D. Arrastrá para girarla.";
    el.error.textContent = "No pudimos leer el archivo. Verificá que sea un STL o 3MF válido, o mandánoslo por WhatsApp y lo revisamos.";
    el.total.textContent = "—";
    el.unidad.textContent = "Subí un archivo para ver el precio.";
    el.alerta.textContent = "";
    el.desglose.innerHTML = "";
    el.info.innerHTML = "";
    actualizar();
  }
}

function leerArchivo(file) {
  if (!file) return;
  file.arrayBuffer().then((buf) => procesar(file.name, buf));
}

el.input.addEventListener("change", () => leerArchivo(el.input.files[0]));
["dragenter", "dragover"].forEach((t) => el.drop.addEventListener(t, (e) => { e.preventDefault(); el.drop.classList.add("is-over"); }));
["dragleave", "drop"].forEach((t) => el.drop.addEventListener(t, (e) => { e.preventDefault(); el.drop.classList.remove("is-over"); }));
el.drop.addEventListener("drop", (e) => leerArchivo(e.dataTransfer.files[0]));

// Pieza de ejemplo: engranaje de 40 mm con agujero central, generado como STL
el.ejemplo.addEventListener("click", async () => {
  const T = await cargarThree();
  const { THREE } = T;
  const { STLExporter } = await import("three/addons/exporters/STLExporter.js");
  const forma = new THREE.Shape();
  const dientes = 16, rExt = 20, rInt = 17.5;
  for (let i = 0; i < dientes * 4; i++) {
    const ang = (i / (dientes * 4)) * Math.PI * 2;
    const r = (i % 4 === 1 || i % 4 === 2) ? rExt : rInt;
    const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
    i === 0 ? forma.moveTo(x, y) : forma.lineTo(x, y);
  }
  const agujero = new THREE.Path();
  agujero.absarc(0, 0, 4, 0, Math.PI * 2, true);
  forma.holes.push(agujero);
  const geo = new THREE.ExtrudeGeometry(forma, { depth: 8, bevelEnabled: false, curveSegments: 24 });
  const stl = new STLExporter().parse(new THREE.Mesh(geo), { binary: true });
  geo.dispose();
  procesar("engranaje-ejemplo.stl", stl.buffer);
});

// Precargar three.js al abrir la pestaña, para que el primer archivo cargue rápido
document.addEventListener("depthco:tab", (e) => { if (e.detail === "tab-archivo") cargarThree(); });
