/* DepthCo — Llaveros: personalizador, precio por cantidad y fotos del catálogo. */
(function () {
  var cfg = window.DEPTHCO_CONFIG;
  var cat = window.DEPTHCO_CATALOGO;
  var L = cat.LLAVEROS;

  function pesos(n) {
    return "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function color(id) {
    return cat.COLORES.find(function (c) { return c.id === id; }) || cat.COLORES[0];
  }
  /* ---------- Fotos reales (solo si hay) ---------- */
  var fotosSec = document.getElementById("ll-fotos-sec");
  if (fotosSec && L.FOTOS.length) {
    document.getElementById("ll-fotos").innerHTML = L.FOTOS.map(function (f) {
      return '<img src="' + esc(f.src) + '" alt="' + esc(f.alt || "Llavero DepthCo") + '" loading="lazy">';
    }).join("");
    fotosSec.hidden = false;
  }

  /* ---------- Personalizador ---------- */
  var form = document.getElementById("form-llavero");
  if (!form) return;
  var el = {
    texto: document.getElementById("ll-texto"),
    textoHint: document.getElementById("ll-texto-hint"),
    logo: document.getElementById("ll-logo"),
    cantidad: document.getElementById("ll-cantidad"),
    resumen: document.getElementById("ll-resumen"),
    colorHint: document.getElementById("ll-color-hint"),
    total: document.getElementById("ll-total"),
    unit: document.getElementById("ll-unit"),
    logoRow: document.getElementById("ll-logo-row"),
    logoPrecio: document.getElementById("ll-logo-precio"),
    alerta: document.getElementById("ll-alerta"),
    wa: document.getElementById("ll-wa"),
    fine: document.getElementById("ll-fine"),
    tiers: document.getElementById("ll-tiers"),
    usos: document.getElementById("ll-usos")
  };

  el.texto.maxLength = L.LARGO_MAX_TEXTO;
  el.texto.value = L.TEXTO_EJEMPLO;

  document.getElementById("ll-formas").innerHTML = L.FORMAS.map(function (f, i) {
    return '<label class="chip"><input type="radio" name="forma" value="' + f.id + '"' + (i === 0 ? " checked" : "") + '><span>' + esc(f.nombre) + '</span></label>';
  }).join("");
  function swatches(name, def) {
    return cat.COLORES.map(function (c) {
      return '<label class="swatch"><input type="radio" name="' + name + '" value="' + c.id + '"' + (c.id === def ? " checked" : "") + '>' +
        '<i style="background:' + c.hex + '"></i>' + esc(c.nombre) + '</label>';
    }).join("");
  }
  document.getElementById("ll-base").innerHTML = swatches("base", "hueso");
  document.getElementById("ll-tinta").innerHTML = swatches("tinta", "oxido");

  el.usos.innerHTML = L.USOS.map(function (u) {
    return '<article class="use"><h3>' + esc(u.titulo) + '</h3><p>' + esc(u.texto) + '</p></article>';
  }).join("");

  function tramo(cantidad) {
    var t = L.PRECIOS[0];
    L.PRECIOS.forEach(function (p) { if (cantidad >= p.desde) t = p; });
    return t;
  }

  function dibujarTramos(activo) {
    el.tiers.innerHTML = L.PRECIOS.map(function (p, i) {
      var sig = L.PRECIOS[i + 1];
      var rango = sig ? (p.desde === sig.desde - 1 ? p.desde : p.desde + " a " + (sig.desde - 1)) + " u." : p.desde + " u. o más";
      return '<li class="tier' + (p === activo ? " is-active" : "") + '"><span class="tier__qty">' + rango + '</span>' +
        '<span class="tier__price">' + pesos(p.unitario) + '</span><span class="tier__unit">por llavero</span></li>';
    }).join("");
  }

  function actualizar() {
    var conLogo = el.logo.checked;
    el.texto.disabled = conLogo;
    var forma = form.forma.value, base = form.base.value, tinta = form.tinta.value;
    var cantidad = Math.max(1, parseInt(el.cantidad.value, 10) || 1);

    el.resumen.textContent = (conLogo ? "Con tu logo" : "\u201C" + (el.texto.value.trim() || "…") + "\u201D") + " · " +
      L.FORMAS.find(function (f) { return f.id === forma; }).nombre + " · " +
      color(base).nombre + " con " + (conLogo ? "logo" : "texto") + " en " + color(tinta).nombre.toLowerCase();
    el.colorHint.hidden = base !== tinta;
    el.textoHint.textContent = conLogo
      ? "Después de tocar el botón, mandanos el logo por WhatsApp (imagen o archivo)."
      : el.texto.value.length + " de " + L.LARGO_MAX_TEXTO + " caracteres";

    var t = tramo(cantidad);
    dibujarTramos(t);
    var consultar = cantidad >= L.CANTIDAD_CONSULTAR;
    var subtotal = t.unitario * cantidad;

    if (consultar) {
      el.total.textContent = "A consultar";
      el.unit.textContent = cantidad + " llaveros";
      el.alerta.textContent = "Desde " + L.CANTIDAD_CONSULTAR + " unidades te pasamos un precio por volumen.";
      el.alerta.hidden = false;
    } else {
      el.total.textContent = pesos(subtotal);
      el.unit.textContent = (cantidad > 1 ? cantidad + " llaveros · " : "1 llavero · ") + pesos(t.unitario) + " c/u";
      var sig = L.PRECIOS.find(function (p) { return p.desde > cantidad; });
      el.alerta.hidden = !sig;
      if (sig) el.alerta.textContent = "Desde " + sig.desde + " unidades bajan a " + pesos(sig.unitario) + " c/u.";
    }
    el.logoRow.hidden = !conLogo;
    el.logoPrecio.textContent = pesos(L.DISENO_LOGO);
    el.fine.textContent = "Precio estimado. Plazo: " + L.PLAZO + ". Retiro en San Isidro o envío a cargo del cliente.";

    var msg = "pedido: llaveros | " + (conLogo ? "con logo" : "texto: " + el.texto.value.trim()) +
      " | forma: " + L.FORMAS.find(function (f) { return f.id === forma; }).nombre.toLowerCase() +
      " | color: " + color(base).nombre.toLowerCase() + " | texto en: " + color(tinta).nombre.toLowerCase() +
      " | cantidad: " + cantidad +
      " | precio: " + (consultar ? "a consultar" : pesos(subtotal)) +
      (conLogo ? " + diseño del logo " + pesos(L.DISENO_LOGO) + ". Te mando el logo." : "");
    el.wa.href = "https://wa.me/" + cfg.WHATSAPP + "?text=" + encodeURIComponent(msg);
  }

  form.querySelectorAll(".qty__btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = Math.max(1, (parseInt(el.cantidad.value, 10) || 1) + Number(b.getAttribute("data-step")));
      el.cantidad.value = v;
      actualizar();
    });
  });
  form.addEventListener("input", actualizar);
  form.addEventListener("change", actualizar);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  actualizar();
})();
