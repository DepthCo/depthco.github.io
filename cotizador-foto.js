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
    total: document.getElementById("foto-total"),
    unidad: document.getElementById("foto-unidad"),
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
    var nivelCfg = cfg.NIVELES_DISENO[r.nivel];
    var matNombre = material === "recomendame"
      ? "a recomendar"
      : P.material(cfg, material).nombre;
    var nivelTexto = nivel === "nose" ? "no sé" : nivelCfg.nombre.toLowerCase();

    el.guiaPieza.hidden = tengo !== "pieza";

    var precioTexto;
    if (r.consultar) {
      el.total.innerHTML = "A consultar";
      el.unidad.textContent = "";
      el.alerta.textContent = "Desde " + cfg.CANTIDAD_CONSULTAR + " unidades: escribinos para precio por volumen.";
      el.desglose.innerHTML = "";
      precioTexto = "a consultar";
    } else {
      el.total.innerHTML = "<small>Desde</small>" + P.formatoPesos(r.total);
      el.unidad.textContent = cantidad > 1 ? cantidad + " unidades" : "1 unidad";
      var alertas = [];
      if (nivel === "nose") alertas.push("Lo cotizamos como nivel medio: lo confirmamos al ver las fotos.");
      if (nivelCfg.nota) alertas.push("Pieza compleja: " + nivelCfg.nota + ".");
      el.alerta.textContent = alertas.join(" ");

      var filas = [];
      filas.push(li("Diseño (" + nivelCfg.nombre.toLowerCase() + ", una sola vez)",
        r.disenoBonificado ? "Diseño bonificado" : P.formatoPesos(r.disenoConRecargo)));
      filas.push(li("Impresión estimada (" + cfg.GRAMOS_RELEVAMIENTO + " g c/u" +
        (material === "recomendame" ? ", ref. " + P.material(cfg, r.materialUsado).nombre : "") + ")",
        P.formatoPesos(r.impresionConRecargo)));
      if (r.descuento) filas.push(li("Descuento por cantidad", Math.round(r.descuento * 100) + "% en impresión"));
      if (urgente) filas.push(li("Urgente", "+" + Math.round(cfg.RECARGO_URGENTE * 100) + "%"));
      if (r.aplicaMinimo) filas.push(li("Pedido mínimo", P.formatoPesos(cfg.PRECIO_MINIMO)));
      if (nivelCfg.incluye) filas.push(li("Incluye", nivelCfg.incluye));
      filas.push(li("Plazo", nivelCfg.plazo));
      el.desglose.innerHTML = filas.join("");
      precioTexto = P.formatoPesos(r.total);
    }

    el.disclaimer.textContent = "Precio estimado: la impresión se calcula con " + cfg.GRAMOS_RELEVAMIENTO +
      " g por unidad. Confirmamos el valor final al revisar tu pieza.";

    var msg = "pedido: relevamiento | tengo: " + TENGO[tengo] +
      " | nivel: " + nivelTexto +
      " | material: " + matNombre +
      " | cantidad: " + cantidad +
      " | urgente: " + (urgente ? "sí" : "no") +
      " | precio desde: " + precioTexto + ". Te mando las fotos.";
    el.wa.href = "https://wa.me/" + cfg.WHATSAPP + "?text=" + encodeURIComponent(msg);
  }

  form.addEventListener("input", actualizar);
  form.addEventListener("change", actualizar);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  actualizar();
})();
