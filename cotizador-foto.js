/* DepthCo — cotizador, pestaña "Tengo una foto o la pieza" (relevamiento + diseño + impresión). */
(function () {
  var cfg = window.DEPTHCO_CONFIG;
  var P = window.DepthCoPricing;
  var form = document.getElementById("form-foto");
  if (!form) return;

  var TENGO = { fotos: "fotos", pieza: "pieza", plano: "plano" };

  // Ilustraciones de nivel con el motivo de capas: anchos de cada capa, de abajo hacia arriba
  var CAPAS = {
    simple:   [1, 1, 1, 1],
    media:    [1, .7, 1, .7, 1, .7],
    compleja: [.5, .8, 1, .9, .6, .85, .45, .7],
    nose:     [1, .8, .6, .4]
  };
  function ilustracion(id) {
    var capas = CAPAS[id], h = 36, gap = h / capas.length;
    var bars = capas.map(function (w, i) {
      var y = h - (i + 1) * gap + 1;
      var x = (1 - w) * 30;
      var color = i % 2 ? "#5B3A29" : "#A4522F";
      var dash = id === "nose" ? ' stroke-dasharray="3 3" fill="none" stroke="' + color + '"' : ' fill="' + color + '"';
      return '<rect x="' + x + '" y="' + y + '" width="' + (60 * w) + '" height="' + (gap - 2) + '" rx="' + ((gap - 2) / 2) + '"' + dash + '/>';
    }).join("");
    return '<svg class="lvl-ill" viewBox="0 0 60 36" preserveAspectRatio="xMinYMid meet" aria-hidden="true" focusable="false">' + bars + '</svg>';
  }

  // Tarjetas de nivel
  var nivelesBox = document.getElementById("niveles-cotizador");
  var html = Object.keys(cfg.NIVELES_DISENO).map(function (k, i) {
    var n = cfg.NIVELES_DISENO[k];
    return '<label class="choice"><input type="radio" name="nivel" value="' + k + '"' + (i === 0 ? " checked" : "") + '>' +
      '<span class="choice__box">' + ilustracion(k) + '<strong>' + n.nombre + '</strong>' +
      '<small>' + n.ejemplos.charAt(0).toUpperCase() + n.ejemplos.slice(1) + '.</small>' +
      '<span class="choice__price">Diseño desde ' + P.formatoPesos(n.desde) + '</span></span></label>';
  }).join("");
  html += '<label class="choice"><input type="radio" name="nivel" value="nose">' +
    '<span class="choice__box">' + ilustracion("nose") + '<strong>No sé</strong>' +
    '<small>Lo cotizamos como media y lo confirmamos al ver las fotos.</small></span></label>';
  nivelesBox.innerHTML = html;

  // Materiales
  var sel = document.getElementById("foto-material");
  var opts = '<option value="recomendame">Recomendame vos</option>';
  ["Estándar", "Técnico"].forEach(function (g) {
    opts += '<optgroup label="' + (g === "Técnico" ? "Técnicos" : g) + '">' +
      cfg.MATERIALES.filter(function (m) { return m.grupo === g; }).map(function (m) {
        return '<option value="' + m.id + '">' + m.nombre + ' — ' + m.uso + '</option>';
      }).join("") + '</optgroup>';
  });
  sel.innerHTML = opts;

  var el = {
    diseno: document.getElementById("foto-diseno"),
    disenoMeta: document.getElementById("foto-diseno-meta"),
    impresion: document.getElementById("foto-impresion"),
    impresionMeta: document.getElementById("foto-impresion-meta"),
    suma: document.getElementById("foto-suma"),
    alerta: document.getElementById("foto-alerta"),
    desglose: document.getElementById("foto-desglose"),
    wa: document.getElementById("foto-wa"),
    disclaimer: document.getElementById("foto-disclaimer"),
    guiaPieza: document.getElementById("guia-pieza")
  };

  function li(label, valor) {
    return "<li><span>" + label + "</span><strong>" + valor + "</strong></li>";
  }

  function actualizar() {
    var tengo = form.tengo.value;
    var nivel = form.nivel.value;
    var material = sel.value;
    var cantidad = Math.max(1, parseInt(form.cantidad.value, 10) || 1);
    var urgente = form.urgente.checked;

    var r = P.cotizarRelevamiento(cfg, { nivel: nivel, material: material, cantidad: cantidad, urgente: urgente });
    var d = r.diseno, imp = r.impresion;
    var nivelCfg = cfg.NIVELES_DISENO[r.nivel];
    var matNombre = material === "recomendame" ? "a recomendar" : P.material(cfg, material).nombre;
    var nivelTexto = nivel === "nose" ? "no sé" : nivelCfg.nombre.toLowerCase();

    el.guiaPieza.hidden = tengo !== "pieza";

    // Módulo 1: diseño
    var disenoTexto;
    if (d.bonificado) {
      el.diseno.textContent = "Bonificado";
      disenoTexto = "bonificado";
    } else {
      el.diseno.innerHTML = "<small>Desde</small>" + P.formatoPesos(d.total);
      disenoTexto = "desde " + P.formatoPesos(d.total);
    }
    el.disenoMeta.textContent = "Nivel " + nivelCfg.nombre.toLowerCase() + " · se paga una sola vez" +
      (nivelCfg.incluye ? " · incluye " + nivelCfg.incluye : "");

    // Módulo 2: impresión
    var impTexto;
    var refMaterial = P.material(cfg, r.materialUsado).nombre;
    if (imp.consultar) {
      el.impresion.textContent = "A consultar";
      el.impresionMeta.textContent = cantidad + " unidades";
      impTexto = "a consultar";
    } else {
      el.impresion.textContent = P.formatoPesos(imp.total);
      el.impresionMeta.textContent = (cantidad > 1 ? cantidad + " unidades · " + P.formatoPesos(imp.porUnidad) + " c/u" : "1 unidad") +
        " · " + cfg.GRAMOS_RELEVAMIENTO + " g c/u en " + refMaterial + (material === "recomendame" ? " (referencia)" : "");
      impTexto = P.formatoPesos(imp.total);
    }

    el.suma.textContent = imp.consultar ? "" : "Las dos cosas juntas: desde " + P.formatoPesos(r.total);

    var alertas = [];
    if (nivel === "nose") alertas.push("Cotizamos el diseño como nivel medio: lo confirmamos al ver las fotos.");
    if (nivelCfg.nota) alertas.push("Pieza compleja: " + nivelCfg.nota + ".");
    if (imp.consultar) alertas.push("Desde " + cfg.CANTIDAD_CONSULTAR + " unidades: escribinos para precio de impresión por volumen.");
    el.alerta.textContent = alertas.join(" ");

    var filas = [];
    if (imp.descuento && !imp.consultar) filas.push(li("Descuento por cantidad", Math.round(imp.descuento * 100) + "% en impresión"));
    if (urgente) filas.push(li("Urgente", "+" + Math.round(cfg.RECARGO_URGENTE * 100) + "% en cada módulo"));
    if (imp.aplicaMinimo && !imp.consultar) filas.push(li("Impresión: pedido mínimo", P.formatoPesos(cfg.PRECIO_MINIMO)));
    filas.push(li("Plazo", nivelCfg.plazo));
    el.desglose.innerHTML = filas.join("");

    el.disclaimer.textContent = "Precios estimados. La impresión se calcula con " + cfg.GRAMOS_RELEVAMIENTO +
      " g por unidad; confirmamos los dos valores al revisar tu pieza.";

    var msg = "pedido: relevamiento | tengo: " + TENGO[tengo] +
      " | nivel: " + nivelTexto +
      " | material: " + matNombre +
      " | cantidad: " + cantidad +
      " | urgente: " + (urgente ? "sí" : "no") +
      " | diseño: " + disenoTexto +
      " | impresión: " + impTexto + ". Te mando las fotos.";
    el.wa.href = "https://wa.me/" + cfg.WHATSAPP + "?text=" + encodeURIComponent(msg);
  }

  form.addEventListener("input", actualizar);
  form.addEventListener("change", actualizar);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  actualizar();
})();
