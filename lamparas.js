/* DepthCo — Lámparas: catálogo desde data/catalogo.json, elección de color y pedido por WhatsApp. */
(function () {
  var cfg = window.DEPTHCO_CONFIG;
  var D = window.DepthCoDatos;
  var pesos = D.pesos, esc = D.esc;

  D.cargar().then(iniciar).catch(function (err) {
    console.warn(err);
    document.getElementById("lamparas").innerHTML =
      '<p class="vacio">No pudimos cargar el catálogo. <a href="https://wa.me/' + cfg.WHATSAPP + '" target="_blank" rel="noopener">Escribinos por WhatsApp</a> y te mostramos los modelos.</p>';
  });

  function iniciar(datos) {
    var LA = datos.lamparas;
    var lista = document.getElementById("lamparas");

    document.getElementById("dato-incluye").textContent = LA.incluye;
    document.getElementById("dato-plazo").textContent = LA.plazo + " desde que confirmás el pedido.";

    function waHref(m, color) {
      var msg = "pedido: lámpara " + m.nombre + " | color: " + color.toLowerCase() +
        (m.medidas ? " | medidas: " + m.medidas : "") +
        " | precio: " + (m.precio ? pesos(m.precio) : "¿me pasás el precio?");
      return "https://wa.me/" + cfg.WHATSAPP + "?text=" + encodeURIComponent(msg);
    }

    if (!LA.modelos.length) {
      lista.innerHTML = '<p class="vacio">Estamos preparando los modelos. Mientras tanto, <a href="https://wa.me/' + cfg.WHATSAPP + '" target="_blank" rel="noopener">escribinos por WhatsApp</a>.</p>';
      return;
    }

    lista.innerHTML = LA.modelos.map(function (m, i) {
      var fotoUrl = D.url(m.foto), mlUrl = D.url(m.mercadoLibre, true);
      var foto = fotoUrl
        ? '<figure class="modelo__foto"><img src="' + esc(fotoUrl) + '" alt="Lámpara ' + esc(m.nombre) + '" loading="lazy"></figure>'
        : "";
      var colores = LA.colores.concat(["Otro"]).map(function (c, j) {
        return '<label class="color"><input type="radio" name="color-' + i + '" value="' + esc(c) + '"' + (j === 0 ? " checked" : "") + '>' +
          '<span>' + esc(c) + '</span></label>';
      }).join("");
      var precio = m.precio
        ? '<span class="modelo__precio">' + pesos(m.precio) + '</span>'
        : '<span class="modelo__consulta">Consultá el precio</span>';
      return '<article class="modelo reveal' + (fotoUrl ? " modelo--foto" : "") + '" data-i="' + i + '">' + foto +
        '<div class="modelo__nombre">' + (m.tipo ? '<span class="modelo__n">' + esc(m.tipo) + '</span>' : "") +
        '<h2>' + esc(m.nombre) + '</h2>' + (m.medidas ? '<span class="modelo__spec">' + esc(m.medidas) + '</span>' : "") + '</div>' +
        '<div class="modelo__body">' + (m.descripcion ? '<p class="modelo__desc">' + esc(m.descripcion) + '</p>' : "") +
        '<fieldset class="colores"><legend>Color</legend><div class="colores__fila">' + colores + '</div></fieldset>' +
        '<div class="modelo__compra">' + precio +
        '<a class="btn" target="_blank" rel="noopener" href="' + waHref(m, LA.colores[0] || "a definir") + '">' +
        '<svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true" focusable="false"><use href="#ico-wa"/></svg>' +
        (m.precio ? "Encargala" : "Consultar") + '</a>' +
        (mlUrl ? '<a class="link-ml" href="' + esc(mlUrl) + '" target="_blank" rel="noopener">Ver en Mercado Libre</a>' : "") +
        '</div></div></article>';
    }).join("");

    lista.dispatchEvent(new CustomEvent("depthco:contenido", { bubbles: true }));

    lista.addEventListener("change", function (e) {
      if (e.target.type !== "radio") return;
      var art = e.target.closest(".modelo");
      var m = LA.modelos[Number(art.getAttribute("data-i"))];
      art.querySelector(".btn").href = waHref(m, e.target.value === "Otro" ? "otro (lo charlamos)" : e.target.value);
    });
  }
})();
