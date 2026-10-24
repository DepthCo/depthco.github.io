/* DepthCo — Lámparas: catálogo desde catalogo.js, elección de color y pedido por WhatsApp. */
(function () {
  var cfg = window.DEPTHCO_CONFIG;
  var cat = window.DEPTHCO_CATALOGO;
  var LA = cat.LAMPARAS;

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
  function waHref(m, colorId) {
    var msg = "pedido: lámpara " + m.nombre + " | color: " + color(colorId).nombre.toLowerCase() +
      " | medidas: " + m.medidas + " | precio: " + pesos(m.precio);
    return "https://wa.me/" + cfg.WHATSAPP + "?text=" + encodeURIComponent(msg);
  }

  document.getElementById("dato-incluye").textContent = LA.INCLUYE;
  document.getElementById("dato-plazo").textContent = LA.PLAZO + " desde que confirmás el pedido.";

  var lista = document.getElementById("lamparas");
  lista.innerHTML = LA.MODELOS.map(function (m) {
    var foto = m.foto
      ? '<figure class="modelo__foto"><img src="' + esc(m.foto) + '" alt="Lámpara ' + esc(m.nombre) + '" loading="lazy"></figure>'
      : "";
    var colores = cat.COLORES.map(function (c) {
      return '<label class="color"><input type="radio" name="color-' + m.id + '" value="' + c.id + '"' + (c.id === m.color ? " checked" : "") + '>' +
        '<span><i style="background:' + c.hex + '"></i>' + esc(c.nombre) + '</span></label>';
    }).join("");
    return '<article class="modelo' + (m.foto ? " modelo--foto" : "") + '" id="' + m.id + '" data-id="' + m.id + '">' + foto +
      '<div class="modelo__nombre"><span class="modelo__n">' + esc(m.tipo) + '</span>' +
      '<h2>' + esc(m.nombre) + '</h2><span class="modelo__spec">' + esc(m.medidas) + '</span></div>' +
      '<div class="modelo__body"><p class="modelo__desc">' + esc(m.descripcion) + '</p>' +
      '<fieldset class="colores"><legend>Color</legend><div class="colores__fila">' + colores + '</div></fieldset>' +
      '<div class="modelo__compra"><span class="modelo__precio">' + pesos(m.precio) + '</span>' +
      '<a class="btn" target="_blank" rel="noopener" href="' + waHref(m, m.color) + '">' +
      '<svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true" focusable="false"><use href="#ico-wa"/></svg>Encargala</a>' +
      (m.mercadoLibre ? '<a class="link-ml" href="' + esc(m.mercadoLibre) + '" target="_blank" rel="noopener">Ver en Mercado Libre</a>' : "") +
      '</div></div></article>';
  }).join("");

  lista.addEventListener("change", function (e) {
    if (e.target.type !== "radio") return;
    var art = e.target.closest(".modelo");
    var m = LA.MODELOS.find(function (x) { return x.id === art.getAttribute("data-id"); });
    art.querySelector(".btn").href = waHref(m, e.target.value);
  });
})();
