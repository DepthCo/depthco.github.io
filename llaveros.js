/* DepthCo — Llaveros: pedido con nombre, logo, modelo del catálogo o idea propia. Datos en data/catalogo.json. */
(function () {
  var cfg = window.DEPTHCO_CONFIG;
  var D = window.DepthCoDatos;
  var pesos = D.pesos, esc = D.esc;

  var MODOS = {
    nombre:   { resumen: "Con nombre",       color2: "Color del texto" },
    logo:     { resumen: "Con tu logo",      color2: "Color del logo" },
    catalogo: { resumen: "Del catálogo",     color2: "Segundo color" },
    idea:     { resumen: "Tu idea",          color2: "Segundo color" }
  };

  D.cargar().then(iniciar).catch(function (err) {
    console.warn(err);
    document.getElementById("ll-error").hidden = false;
    document.getElementById("form-llavero").hidden = true;
  });

  function iniciar(datos) {
    var L = datos.llaveros;
    var form = document.getElementById("form-llavero");
    var $ = function (id) { return document.getElementById(id); };
    var el = {
      texto: $("ll-texto"), textoHint: $("ll-texto-hint"), idea: $("ll-idea"), cantidad: $("ll-cantidad"),
      color1Otro: $("ll-color1-otro"), color2Otro: $("ll-color2-otro"), color2Label: $("ll-color2-label"),
      resumen: $("ll-resumen"), total: $("ll-total"), unit: $("ll-unit"),
      logoRow: $("ll-logo-row"), logoPrecio: $("ll-logo-precio"), alerta: $("ll-alerta"), wa: $("ll-wa"), fine: $("ll-fine")
    };

    /* ---------- Contenido desde los datos ---------- */
    if (L.fotos && L.fotos.length) {
      $("ll-fotos").innerHTML = L.fotos.map(function (f) {
        return '<img src="' + esc(f.src) + '" alt="' + esc(f.alt || "Llavero DepthCo") + '" loading="lazy">';
      }).join("");
      $("ll-fotos-sec").hidden = false;
    }

    el.texto.maxLength = L.largoMaxTexto;
    el.texto.value = L.textoEjemplo || "";

    $("ll-formas").innerHTML = L.formas.map(function (f, i) {
      return '<label class="chip"><input type="radio" name="forma" value="' + esc(f) + '"' + (i === 0 ? " checked" : "") + '><span>' + esc(f) + '</span></label>';
    }).join("");

    $("ll-modelos").innerHTML = L.modelos.length ? L.modelos.map(function (m, i) {
      return '<label class="modelo-ll"><input type="radio" name="modelo" value="' + i + '"' + (i === 0 ? " checked" : "") + '>' +
        '<span class="modelo-ll__box">' +
        (m.foto ? '<img src="' + esc(m.foto) + '" alt="" loading="lazy">' : "") +
        '<strong>' + esc(m.nombre) + '</strong>' +
        (m.descripcion ? '<small>' + esc(m.descripcion) + '</small>' : "") +
        '<em>' + (m.precio ? pesos(m.precio) + " c/u" : "Precio según cantidad") + '</em></span></label>';
    }).join("") : '<p class="ctrl__hint">Todavía no hay modelos cargados. Elegí "Tengo una idea" y contanos qué querés.</p>';

    function swatches(name, conNinguno) {
      var html = conNinguno ? '<label class="swatch"><input type="radio" name="' + name + '" value=""><i class="swatch__none"></i>Ninguno</label>' : "";
      html += L.colores.map(function (c) {
        return '<label class="swatch"><input type="radio" name="' + name + '" value="' + esc(c.nombre) + '">' +
          '<i style="background:' + esc(c.hex) + '"></i>' + esc(c.nombre) + '</label>';
      }).join("");
      return html + '<label class="swatch"><input type="radio" name="' + name + '" value="otro"><i class="swatch__otro">+</i>Otro</label>';
    }
    $("ll-color1").innerHTML = swatches("color1", false);
    $("ll-color2").innerHTML = swatches("color2", true);
    marcar("color1", L.colores[0] && L.colores[0].nombre);
    marcar("color2", L.colores[1] && L.colores[1].nombre);

    $("ll-usos").innerHTML = (L.usos || []).map(function (u) {
      return '<article class="use"><h3>' + esc(u.titulo) + '</h3><p>' + esc(u.texto) + '</p></article>';
    }).join("");

    function marcar(name, valor) {
      var inp = form.querySelector('input[name="' + name + '"][value="' + (valor || "").replace(/"/g, '\\"') + '"]');
      if (inp) inp.checked = true;
    }

    function colorElegido(name, otro) {
      var v = form[name].value;
      otro.hidden = v !== "otro";
      if (v === "otro") return otro.value.trim() || "a definir";
      return v;
    }

    function dibujarTramos(activo) {
      $("ll-tiers").innerHTML = L.precios.map(function (p, i) {
        var sig = L.precios[i + 1];
        var rango = sig ? (p.desde === sig.desde - 1 ? p.desde : p.desde + " a " + (sig.desde - 1)) + " u." : p.desde + " u. o más";
        return '<li class="tier' + (p === activo ? " is-active" : "") + '"><span class="tier__qty">' + rango + '</span>' +
          '<span class="tier__price">' + pesos(p.unitario) + '</span><span class="tier__unit">por llavero</span></li>';
      }).join("");
    }

    /* ---------- Cálculo y mensaje ---------- */
    function actualizar() {
      var modo = form.modo.value;
      form.querySelectorAll("[data-modo]").forEach(function (g) {
        g.hidden = g.getAttribute("data-modo").split(" ").indexOf(modo) === -1;
      });
      el.color2Label.textContent = MODOS[modo].color2;

      var cantidad = Math.max(1, parseInt(el.cantidad.value, 10) || 1);
      var color1 = colorElegido("color1", el.color1Otro);
      var color2 = colorElegido("color2", el.color2Otro);
      var forma = form.forma ? form.forma.value : "";
      var modelo = modo === "catalogo" && form.modelo ? L.modelos[Number(form.modelo.value)] : null;

      // Precio por unidad: modelo con precio fijo, o tramos por cantidad
      var t = D.tramo(L.precios, cantidad);
      var unitario = modelo && modelo.precio ? modelo.precio : t.unitario;
      dibujarTramos(modelo && modelo.precio ? null : t);
      var consultar = cantidad >= L.cantidadConsultar;
      var subtotal = unitario * cantidad;
      var conLogo = modo === "logo";

      var detalle = modo === "nombre" ? "“" + (el.texto.value.trim() || "…") + "”"
        : modo === "logo" ? "Con tu logo"
        : modo === "catalogo" ? (modelo ? modelo.nombre : "Modelo a elegir")
        : (el.idea.value.trim() ? "“" + el.idea.value.trim() + "”" : "Tu idea");
      el.resumen.textContent = detalle + (forma && (modo === "nombre" || modo === "logo") ? " · " + forma : "") +
        " · " + color1 + (color2 ? " y " + color2 : "");
      el.textoHint.textContent = el.texto.value.length + " de " + L.largoMaxTexto + " caracteres";

      if (consultar) {
        el.total.textContent = "A consultar";
        el.unit.textContent = cantidad + " llaveros";
        el.alerta.textContent = "Desde " + L.cantidadConsultar + " unidades te pasamos un precio por volumen.";
        el.alerta.hidden = false;
      } else {
        el.total.textContent = pesos(subtotal);
        el.unit.textContent = (cantidad > 1 ? cantidad + " llaveros · " : "1 llavero · ") + pesos(unitario) + " c/u";
        var sig = !(modelo && modelo.precio) && L.precios.find(function (p) { return p.desde > cantidad; });
        el.alerta.hidden = !sig;
        if (sig) el.alerta.textContent = "Desde " + sig.desde + " unidades bajan a " + pesos(sig.unitario) + " c/u.";
      }
      el.logoRow.hidden = !conLogo;
      el.logoPrecio.textContent = pesos(L.disenoLogo);
      el.fine.textContent = (modo === "idea" ? "Sin cargo de diseño. Te confirmamos si la idea se puede hacer y el precio final. " : "Precio estimado. ") +
        "Plazo: " + L.plazo + ". Retiro en San Isidro o envío a cargo del cliente.";

      var partes = ["pedido: llaveros"];
      if (modo === "nombre") partes.push("texto: " + (el.texto.value.trim() || "a definir"), "forma: " + forma.toLowerCase());
      if (modo === "logo") partes.push("con logo", "forma: " + forma.toLowerCase());
      if (modo === "catalogo") partes.push("modelo: " + (modelo ? modelo.nombre : "a definir"));
      if (modo === "idea") partes.push("idea: " + (el.idea.value.trim() || "te la cuento por acá"));
      partes.push("color: " + color1.toLowerCase() + (color2 ? " y " + color2.toLowerCase() : ""));
      partes.push("cantidad: " + cantidad);
      partes.push("precio: " + (consultar ? "a consultar" : pesos(subtotal)) + (conLogo ? " + diseño del logo " + pesos(L.disenoLogo) : ""));
      var cierre = conLogo ? ". Te mando el logo." : modo === "idea" ? ". Te mando una imagen de referencia." : ".";
      el.wa.href = "https://wa.me/" + cfg.WHATSAPP + "?text=" + encodeURIComponent(partes.join(" | ") + cierre);
    }

    form.querySelectorAll(".qty__btn").forEach(function (b) {
      b.addEventListener("click", function () {
        el.cantidad.value = Math.max(1, (parseInt(el.cantidad.value, 10) || 1) + Number(b.getAttribute("data-step")));
        actualizar();
      });
    });
    form.addEventListener("input", actualizar);
    form.addEventListener("change", actualizar);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    actualizar();
  }
})();
