/*
 * DepthCo — Panel de administración.
 * Edita data/catalogo.json (llaveros y lámparas) y config.js (precios de repuestos).
 * Guarda directo en GitHub con un token del dueño (queda solo en este navegador), o descarga los archivos.
 */
(function () {
  var D = window.DepthCoDatos;
  var esc = D.esc;
  var S = { cat: null, cfg: null };          // estado editable
  var dirty = { cat: false, cfg: false };    // qué archivos cambiaron
  var pendientes = {};                       // fotos elegidas que todavía no se subieron: ruta → { base64, dataUrl }
  var vistas = {};                           // copia local de fotos ya subidas, para verlas antes de que se publique la web
  var tabActual = "llaveros";

  /* ---------- Utilidades ---------- */
  function $(id) { return document.getElementById(id); }
  function partes(path) { return path.split("."); }
  function get(path) {
    return partes(path).reduce(function (o, k) { return o == null ? undefined : o[k]; }, S);
  }
  function set(path, v) {
    var ks = partes(path), o = S;
    for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = v;
  }
  function marcar(path) {
    dirty[partes(path)[0]] = true;
    estado();
  }
  function slug(s) {
    return String(s || "foto").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "foto";
  }
  function storage(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
    } catch (e) { return null; }
  }
  function aviso(msg, tipo) {
    var a = $("aviso");
    a.textContent = msg;
    a.className = "aviso" + (tipo ? " aviso--" + tipo : "");
    a.hidden = !msg;
  }
  function estado(txt) {
    var hay = dirty.cat || dirty.cfg;
    $("estado").textContent = txt || (hay ? "Cambios sin guardar" : "Sin cambios");
    $("guardar").disabled = !hay;
  }

  /* ---------- Base64 UTF-8 ---------- */
  function aBase64(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function deBase64(b64) {
    var bin = atob(b64.replace(/\s/g, "")), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* ---------- GitHub ---------- */
  function gh() {
    var g = { owner: storage("gh-owner"), repo: storage("gh-repo"), branch: storage("gh-branch") || "main", token: storage("gh-token") };
    return g.owner && g.repo && g.token ? g : null;
  }
  function ghUrl(g, path) {
    return "https://api.github.com/repos/" + encodeURIComponent(g.owner) + "/" + encodeURIComponent(g.repo) +
      "/contents/" + path.split("/").map(encodeURIComponent).join("/");
  }
  function ghFetch(g, url, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ Authorization: "Bearer " + g.token, Accept: "application/vnd.github+json" }, opts.headers || {});
    return fetch(url, opts);
  }
  function ghLeer(g, path) {
    return ghFetch(g, ghUrl(g, path) + "?ref=" + encodeURIComponent(g.branch)).then(function (r) {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("GitHub respondió " + r.status + " al leer " + path);
      return r.json();
    });
  }
  function ghEscribir(g, path, base64, mensaje) {
    return ghLeer(g, path).then(function (actual) {
      var body = { message: mensaje, content: base64, branch: g.branch };
      if (actual && actual.sha) body.sha = actual.sha;
      return ghFetch(g, ghUrl(g, path), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
        throw new Error("No se pudo guardar " + path + " (" + r.status + (j.message ? ": " + j.message : "") + ")");
      });
    });
  }

  /* ---------- config.js ---------- */
  function generarConfig(cfg) {
    return "/*\n * DepthCo — configuración del cotizador de repuestos.\n" +
      " * Se edita desde admin.html (pestaña \"Precios de repuestos\") o a mano. Valores en pesos argentinos.\n" +
      " * VALOR_HORA: $ por hora de máquina · RECARGO_TECNICO: recargo sobre la hora en materiales técnicos (0.25 = 25%)\n" +
      " * CARGO_PREPARACION: $ fijo por trabajo · MERMA: 1.10 = +10% de material · PRECIO_MINIMO: $ por pedido\n" +
      " * RECARGO_URGENTE: 0.30 = +30% · FACTOR_RELLENO: fracción de material según relleno\n" +
      " * DESCUENTO_CANTIDAD: descuento desde X unidades · CANTIDAD_CONSULTAR: desde acá se pide consultar\n" +
      " * MATERIALES: densidad (g/cm³), costoKg ($), velocidad (g/h, se calibra contra el slicer)\n" +
      " * NIVELES_DISENO: precio \"desde\" del diseño por nivel · GRAMOS_RELEVAMIENTO: gramos por unidad sin archivo\n */\n" +
      "var DEPTHCO_CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n\n" +
      'if (typeof module !== "undefined") module.exports = DEPTHCO_CONFIG;\n';
  }
  function leerConfigJs(texto) {
    return new Function(texto + "\n;return DEPTHCO_CONFIG;")();
  }

  /* ---------- Campos ---------- */
  function valorMostrado(v, tipo) {
    if (v == null) return "";
    if (tipo === "pct") return Math.round(v * 1000) / 10;
    if (tipo === "merma") return Math.round((v - 1) * 1000) / 10;
    return v;
  }
  function campo(label, path, tipo, extra) {
    extra = extra || {};
    var v = get(path), id = "f-" + path.replace(/\./g, "-");
    var inputTipo = tipo === "text" || tipo === "url" ? "text" : tipo === "color" ? "color" : tipo === "area" ? null : "number";
    var input = tipo === "area"
      ? '<textarea id="' + id + '" data-path="' + path + '" data-type="text" rows="2">' + esc(v) + '</textarea>'
      : '<input id="' + id + '" type="' + inputTipo + '" data-path="' + path + '" data-type="' + tipo + '" value="' + esc(valorMostrado(v, tipo)) + '"' +
        (inputTipo === "number" ? ' inputmode="decimal" step="any" min="0"' : "") + (extra.placeholder ? ' placeholder="' + esc(extra.placeholder) + '"' : "") + '>';
    var unidad = extra.unidad ? '<i class="unidad">' + esc(extra.unidad) + '</i>' : "";
    return '<label class="f' + (extra.ancho ? " f--" + extra.ancho : "") + '" for="' + id + '"><span>' + esc(label) + '</span>' +
      '<span class="f__in">' + input + unidad + '</span>' + (extra.ayuda ? '<small>' + esc(extra.ayuda) + '</small>' : "") + '</label>';
  }
  function foto(path, prefijo, nombrePath) {
    var v = get(path) || "";
    var src = pendientes[v] ? pendientes[v].dataUrl : vistas[v] || v;
    return '<div class="foto">' +
      '<div class="foto__thumb">' + (src ? '<img src="' + esc(src) + '" alt="">' : '<span>Sin foto</span>') + '</div>' +
      '<div class="foto__ctrl">' +
      '<label class="btn btn--small">' + (v ? "Cambiar foto" : "Subir foto") +
      '<input type="file" accept="image/*" data-foto="' + path + '" data-prefijo="' + esc(prefijo) + '" data-nombre-path="' + esc(nombrePath || "") + '" hidden></label>' +
      (v ? '<button type="button" class="btn btn--small btn--ghost" data-act="sinfoto" data-path="' + path + '">Quitar</button>' : "") +
      (pendientes[v] ? '<small class="pend">Se sube al guardar</small>' : "") +
      '</div></div>';
  }
  function herramientas(arr, i, largo) {
    return '<div class="item__tools">' +
      '<button type="button" class="ico" data-act="up" data-arr="' + arr + '" data-i="' + i + '" aria-label="Subir"' + (i === 0 ? " disabled" : "") + '>↑</button>' +
      '<button type="button" class="ico" data-act="down" data-arr="' + arr + '" data-i="' + i + '" aria-label="Bajar"' + (i === largo - 1 ? " disabled" : "") + '>↓</button>' +
      '<button type="button" class="ico ico--del" data-act="del" data-arr="' + arr + '" data-i="' + i + '" aria-label="Eliminar">✕</button></div>';
  }
  function lista(arr, renderItem, tpl, textoAgregar, clase) {
    var items = get(arr) || [];
    return '<div class="items ' + (clase || "") + '">' + items.map(function (it, i) {
      return '<div class="item">' + renderItem(arr + "." + i, it, i) + herramientas(arr, i, items.length) + '</div>';
    }).join("") + '</div>' +
      '<button type="button" class="btn btn--ghost btn--add" data-act="add" data-arr="' + arr + '" data-tpl="' + tpl + '">+ ' + esc(textoAgregar) + '</button>';
  }
  function card(titulo, html, ayuda) {
    return '<div class="card"><h2>' + esc(titulo) + '</h2>' + (ayuda ? '<p class="nota">' + esc(ayuda) + '</p>' : "") + html + '</div>';
  }

  var PLANTILLAS = {
    tramo: function (arr) { var a = get(arr), u = a[a.length - 1] || { desde: 0, unitario: 0 }; return { desde: u.desde + 10, unitario: u.unitario }; },
    descuento: function (arr) { var a = get(arr), u = a[a.length - 1] || { desde: 0, desc: 0 }; return { desde: u.desde + 10, desc: u.desc }; },
    modeloLl: function () { return { nombre: "Nuevo modelo", descripcion: "", precio: null, foto: "" }; },
    color: function () { return { nombre: "Nuevo color", hex: "#8A8F94" }; },
    texto: function () { return "Nuevo"; },
    fotoLl: function () { return { src: "", alt: "" }; },
    uso: function () { return { titulo: "", texto: "" }; },
    modeloLa: function () { return { nombre: "Nueva lámpara", tipo: "", medidas: "", descripcion: "", precio: null, foto: "", mercadoLibre: "" }; }
  };

  /* ---------- Pestañas ---------- */
  function renderLlaveros() {
    var p = "cat.llaveros";
    return card("Precio por cantidad",
      lista(p + ".precios", function (b) {
        return '<div class="fila">' + campo("Desde (unidades)", b + ".desde", "num", { ancho: "s" }) +
          campo("Precio por llavero", b + ".unitario", "num", { unidad: "$", ancho: "s" }) + '</div>';
      }, "tramo", "Agregar tramo", "items--compact") +
      '<div class="fila">' +
      campo("Diseño del logo (una vez)", p + ".disenoLogo", "num", { unidad: "$" }) +
      campo("Desde cuántas unidades se pide consultar", p + ".cantidadConsultar", "num") +
      campo("Plazo", p + ".plazo", "text") +
      campo("Máximo de letras del nombre", p + ".largoMaxTexto", "num") +
      campo("Texto de ejemplo", p + ".textoEjemplo", "text") + '</div>',
      "El precio por llavero baja según la cantidad. Se aplica a nombres, logos, ideas y modelos del catálogo sin precio propio.") +
    card("Modelos del catálogo",
      lista(p + ".modelos", function (b, it) {
        return foto(b + ".foto", "llavero", b + ".nombre") + '<div class="campos">' +
          campo("Nombre", b + ".nombre", "text") + campo("Descripción", b + ".descripcion", "area") +
          campo("Precio propio", b + ".precio", "optnum", { unidad: "$", ayuda: "Vacío = usa el precio por cantidad" }) + '</div>';
      }, "modeloLl", "Agregar modelo"),
      "Llaveros listos para elegir. No se cobra diseño.") +
    card("Colores disponibles",
      lista(p + ".colores", function (b) {
        return '<div class="fila">' + campo("Color", b + ".hex", "color", { ancho: "xs" }) + campo("Nombre", b + ".nombre", "text") + '</div>';
      }, "color", "Agregar color", "items--compact"),
      "El cliente también puede elegir \"Otro\" y escribir el color que quiera.") +
    card("Formas (para nombre y logo)",
      lista(p + ".formas", function (b) { return campo("Forma", b, "text"); }, "texto", "Agregar forma", "items--compact")) +
    card("Fotos de llaveros hechos",
      lista(p + ".fotos", function (b, it, i) {
        return foto(b + ".src", "llavero-hecho") + '<div class="campos">' + campo("Descripción de la foto", b + ".alt", "text", { placeholder: "Ej.: llavero con nombre en negro y dorado" }) + '</div>';
      }, "fotoLl", "Agregar foto"),
      "Aparecen arriba de todo en la página de llaveros. Si no hay ninguna, no se muestra la sección.") +
    card("Para quién",
      lista(p + ".usos", function (b) {
        return '<div class="campos">' + campo("Título", b + ".titulo", "text") + campo("Texto", b + ".texto", "area") + '</div>';
      }, "uso", "Agregar tarjeta"));
  }

  function renderLamparas() {
    var p = "cat.lamparas";
    return card("Modelos",
      lista(p + ".modelos", function (b, it) {
        return foto(b + ".foto", "lampara", b + ".nombre") + '<div class="campos">' +
          '<div class="fila">' + campo("Nombre", b + ".nombre", "text") + campo("Tipo", b + ".tipo", "text", { placeholder: "De mesa, colgante…" }) +
          campo("Medidas", b + ".medidas", "text", { placeholder: "Ø 16 × 24 cm" }) + '</div>' +
          campo("Descripción", b + ".descripcion", "area") +
          '<div class="fila">' + campo("Precio", b + ".precio", "optnum", { unidad: "$", ayuda: "Vacío = muestra \"Consultá el precio\"" }) +
          campo("Link de Mercado Libre", b + ".mercadoLibre", "url", { placeholder: "https://…" }) + '</div></div>';
      }, "modeloLa", "Agregar lámpara")) +
    card("Colores",
      lista(p + ".colores", function (b) { return campo("Color", b, "text"); }, "texto", "Agregar color", "items--compact"),
      "Siempre se agrega la opción \"Otro\" al final.") +
    card("Datos generales",
      '<div class="campos">' + campo("Qué incluye", p + ".incluye", "area") + campo("Plazo", p + ".plazo", "text") + '</div>');
  }

  function renderRepuestos() {
    var c = "cfg";
    var niveles = Object.keys(S.cfg.NIVELES_DISENO).map(function (k) {
      var n = S.cfg.NIVELES_DISENO[k];
      return '<div class="fila"><strong class="fila__tit">' + esc(n.nombre) + '</strong>' +
        campo("Diseño desde", c + ".NIVELES_DISENO." + k + ".desde", "num", { unidad: "$" }) +
        campo("Plazo", c + ".NIVELES_DISENO." + k + ".plazo", "text") + '</div>';
    }).join("");
    var mats = '<div class="tabla"><div class="tabla__head"><span>Material</span><span>Costo por kg</span><span>Velocidad</span><span>Densidad</span></div>' +
      S.cfg.MATERIALES.map(function (m, i) {
        var b = c + ".MATERIALES." + i;
        return '<div class="tabla__row"><strong>' + esc(m.nombre) + '</strong>' +
          campo("Costo por kg", b + ".costoKg", "num", { unidad: "$" }) +
          campo("Velocidad (g/h)", b + ".velocidad", "num") +
          campo("Densidad (g/cm³)", b + ".densidad", "num") + '</div>';
      }).join("") + '</div>';
    return card("Impresión",
      '<div class="fila">' +
      campo("Hora de máquina", c + ".VALOR_HORA", "num", { unidad: "$" }) +
      campo("Cargo de preparación (por trabajo)", c + ".CARGO_PREPARACION", "num", { unidad: "$" }) +
      campo("Precio mínimo por pedido", c + ".PRECIO_MINIMO", "num", { unidad: "$" }) +
      campo("Recargo materiales técnicos", c + ".RECARGO_TECNICO", "pct", { unidad: "%" }) +
      campo("Recargo urgente", c + ".RECARGO_URGENTE", "pct", { unidad: "%" }) +
      campo("Merma de material", c + ".MERMA", "merma", { unidad: "%" }) +
      campo("Desde cuántas unidades se pide consultar", c + ".CANTIDAD_CONSULTAR", "num") +
      campo("Gramos por unidad (cotización por foto)", c + ".GRAMOS_RELEVAMIENTO", "num", { unidad: "g" }) + '</div>') +
    card("Descuentos por cantidad",
      lista(c + ".DESCUENTO_CANTIDAD", function (b) {
        return '<div class="fila">' + campo("Desde (unidades)", b + ".desde", "num", { ancho: "s" }) + campo("Descuento", b + ".desc", "pct", { unidad: "%", ancho: "s" }) + '</div>';
      }, "descuento", "Agregar descuento", "items--compact")) +
    card("Diseño de repuestos",
      niveles + '<div class="fila">' + campo("Diseño simple gratis desde (unidades)", c + ".DISENO_BONIFICADO_DESDE", "num") + '</div>') +
    card("Materiales", mats, "La velocidad se ajusta comparando con el slicer (ver la tabla de calibración del README).");
  }

  var RENDER = { llaveros: renderLlaveros, lamparas: renderLamparas, repuestos: renderRepuestos };
  function render(tab) {
    tab = tab || tabActual;
    if (!RENDER[tab] || !S.cat) return;
    var panel = $("panel-" + tab);
    var y = window.scrollY;
    panel.innerHTML = RENDER[tab]();
    window.scrollTo(0, y);
  }

  /* ---------- Eventos ---------- */
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () {
      tabActual = t.getAttribute("data-tab");
      document.querySelectorAll(".tab").forEach(function (x) { x.setAttribute("aria-selected", String(x === t)); });
      document.querySelectorAll(".panel").forEach(function (p) { p.hidden = p.id !== "panel-" + tabActual; });
      render();
    });
  });

  document.addEventListener("input", function (e) {
    var inp = e.target, path = inp.getAttribute("data-path");
    if (!path) return;
    var tipo = inp.getAttribute("data-type"), v = inp.value;
    if (tipo === "num") v = v === "" ? 0 : Number(v);
    else if (tipo === "optnum") v = v === "" ? null : Number(v);
    else if (tipo === "pct") v = (Number(v) || 0) / 100;
    else if (tipo === "merma") v = 1 + (Number(v) || 0) / 100;
    set(path, v);
    marcar(path);
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act"), arr = b.getAttribute("data-arr"), i = Number(b.getAttribute("data-i"));
    if (act === "sinfoto") { set(b.getAttribute("data-path"), ""); marcar(b.getAttribute("data-path")); render(); return; }
    var a = get(arr);
    if (act === "add") a.push(PLANTILLAS[b.getAttribute("data-tpl")](arr));
    if (act === "del") a.splice(i, 1);
    if (act === "up" && i > 0) a.splice(i - 1, 0, a.splice(i, 1)[0]);
    if (act === "down" && i < a.length - 1) a.splice(i + 1, 0, a.splice(i, 1)[0]);
    marcar(arr);
    render();
  });

  // Fotos: se achican en el navegador (máx. 1400 px, JPG) y se suben al guardar
  document.addEventListener("change", function (e) {
    var inp = e.target, path = inp.getAttribute("data-foto");
    if (!path || !inp.files[0]) return;
    achicar(inp.files[0]).then(function (dataUrl) {
      var np = inp.getAttribute("data-nombre-path");
      var nombre = inp.getAttribute("data-prefijo") + "-" + (np ? get(np) || "" : "");
      var ruta = "img/productos/" + slug(nombre) + "-" + Date.now().toString(36) + ".jpg";
      pendientes[ruta] = { dataUrl: dataUrl, base64: dataUrl.split(",")[1] };
      set(path, ruta);
      marcar(path);
      render();
      if (!gh()) aviso("La foto se va a subir cuando guardes, pero primero conectá GitHub en la pestaña Conexión.", "warn");
    }).catch(function () { aviso("No pudimos leer esa imagen. Probá con un JPG o PNG.", "error"); });
  });
  function achicar(file) {
    return new Promise(function (ok, mal) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1400, k = Math.min(1, max / Math.max(img.width, img.height));
        var cv = document.createElement("canvas");
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        ok(cv.toDataURL("image/jpeg", 0.84));
      };
      img.onerror = mal;
      img.src = url;
    });
  }

  /* ---------- Guardar ---------- */
  function normalizar() {
    var byDesde = function (a, b) { return a.desde - b.desde; };
    S.cat.llaveros.precios.sort(byDesde);
    S.cfg.DESCUENTO_CANTIDAD.sort(byDesde);
  }
  $("guardar").addEventListener("click", function () {
    var g = gh();
    if (!g) {
      aviso("Para publicar, conectá GitHub en la pestaña Conexión. También podés descargar los archivos desde ahí.", "warn");
      return;
    }
    normalizar();
    var json = JSON.stringify(S.cat, null, 2) + "\n";
    var fotos = Object.keys(pendientes).filter(function (ruta) { return json.indexOf(ruta) !== -1; });
    var btn = $("guardar");
    btn.disabled = true;
    estado("Guardando…");
    aviso("");
    var cadena = Promise.resolve();
    fotos.forEach(function (ruta, n) {
      cadena = cadena.then(function () {
        estado("Subiendo foto " + (n + 1) + " de " + fotos.length + "…");
        return ghEscribir(g, ruta, pendientes[ruta].base64, "Panel: foto " + ruta).then(function () { vistas[ruta] = pendientes[ruta].dataUrl; delete pendientes[ruta]; });
      });
    });
    if (dirty.cat) cadena = cadena.then(function () { estado("Guardando catálogo…"); return ghEscribir(g, "data/catalogo.json", aBase64(json), "Panel: actualizar catálogo"); });
    if (dirty.cfg) cadena = cadena.then(function () { estado("Guardando precios…"); return ghEscribir(g, "config.js", aBase64(generarConfig(S.cfg)), "Panel: actualizar precios de repuestos"); });
    cadena.then(function () {
      dirty.cat = dirty.cfg = false;
      estado("Guardado");
      aviso("Listo. La web se actualiza sola en 1 o 2 minutos.", "ok");
      render();
    }).catch(function (err) {
      estado();
      aviso(err.message + ". Revisá la conexión y probá de nuevo; tus cambios siguen acá.", "error");
    });
  });

  window.addEventListener("beforeunload", function (e) {
    if (dirty.cat || dirty.cfg) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------- Descargas (sin conexión) ---------- */
  function descargar(nombre, texto, tipo) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([texto], { type: tipo }));
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  $("descargar-catalogo").addEventListener("click", function () { normalizar(); descargar("catalogo.json", JSON.stringify(S.cat, null, 2) + "\n", "application/json"); });
  $("descargar-config").addEventListener("click", function () { normalizar(); descargar("config.js", generarConfig(S.cfg), "text/javascript"); });

  /* ---------- Conexión ---------- */
  ["owner", "repo", "branch", "token"].forEach(function (k) {
    var v = storage("gh-" + k);
    if (v) $("gh-" + k).value = v;
  });
  $("gh-probar").addEventListener("click", function () {
    ["owner", "repo", "branch", "token"].forEach(function (k) { storage("gh-" + k, $("gh-" + k).value.trim() || null); });
    var g = gh(), res = $("gh-resultado");
    if (!g) { res.textContent = "Completá usuario, repositorio y token."; return; }
    res.textContent = "Probando…";
    ghLeer(g, "data/catalogo.json").then(function (f) {
      res.textContent = f ? "Conectado. Ya podés guardar cambios desde el panel." : "Conectado, pero no encontramos data/catalogo.json en esa rama. Revisá el nombre del repo y la rama.";
      if (f) cargar();
    }).catch(function (err) { res.textContent = "No se pudo conectar: " + err.message + ". Revisá los datos y los permisos del token."; });
  });
  $("gh-olvidar").addEventListener("click", function () {
    ["owner", "repo", "branch", "token"].forEach(function (k) { storage("gh-" + k, null); $("gh-" + k).value = k === "branch" ? "main" : ""; });
    $("gh-resultado").textContent = "Listo, este dispositivo ya no tiene acceso.";
  });

  /* ---------- Carga inicial ---------- */
  // Con conexión se lee la última versión desde GitHub (la web publicada puede tardar unos minutos en actualizarse).
  function cargar() {
    var g = gh();
    var catP, cfgP;
    if (g) {
      catP = ghLeer(g, "data/catalogo.json").then(function (f) { return f ? JSON.parse(deBase64(f.content)) : D.cargar(); });
      cfgP = ghLeer(g, "config.js").then(function (f) { return f ? leerConfigJs(deBase64(f.content)) : window.DEPTHCO_CONFIG; });
    } else {
      catP = D.cargar();
      cfgP = Promise.resolve(window.DEPTHCO_CONFIG);
    }
    return Promise.all([catP, cfgP]).then(function (r) {
      S.cat = r[0];
      S.cfg = JSON.parse(JSON.stringify(r[1]));
      dirty.cat = dirty.cfg = false;
      estado();
      render();
      aviso(g ? "" : "Todavía no conectaste GitHub: podés editar, pero para publicar los cambios andá a la pestaña Conexión.", g ? "" : "warn");
    }).catch(function (err) {
      aviso("No pudimos cargar los datos: " + err.message, "error");
    });
  }
  cargar();
})();
