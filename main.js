/* DepthCo — interacción general de la página (menú, animaciones, contenido desde config.js). */
(function () {
  var cfg = window.DEPTHCO_CONFIG;

  function pesos(n) {
    return "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Mail armado en el navegador: los bots que juntan direcciones para spam no lo encuentran en el código
  document.querySelectorAll(".js-mail").forEach(function (a) {
    var dir = a.getAttribute("data-u") + "@" + a.getAttribute("data-d");
    a.href = "mailto:" + dir;
    a.textContent = dir;
  });

  // Menú mobile
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    toggle.setAttribute("aria-label", open ? "Abrir menú" : "Cerrar menú");
    nav.classList.toggle("is-open", !open);
    document.documentElement.classList.toggle("menu-open", !open);
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
      nav.classList.remove("is-open");
      document.documentElement.classList.remove("menu-open");
    }
  });

  // Llaveros en la barra de arriba: el precio más bajo por unidad (comprando por cantidad), del catálogo
  if (window.DepthCoDatos && document.querySelector("[data-prod-precio]")) {
    window.DepthCoDatos.cargar().then(function (cat) {
      var tramos = cat.llaveros.precios.slice().sort(function (a, b) { return a.unitario - b.unitario; });
      if (tramos.length) {
        document.querySelector("[data-prod-precio]").textContent = pesos(tramos[0].unitario);
      }
    }).catch(function () { /* sin catálogo quedan los textos por defecto */ });
  }

  // Niveles de diseño en Servicios
  var niveles = document.getElementById("niveles-servicio");
  if (niveles) {
    niveles.innerHTML = Object.keys(cfg.NIVELES_DISENO).map(function (k) {
      var n = cfg.NIVELES_DISENO[k];
      var extra = n.incluye ? "Incluye " + n.incluye + ". " : "";
      if (n.nota) extra += n.nota.charAt(0).toUpperCase() + n.nota.slice(1) + ". ";
      return '<div class="level">' +
        '<div class="level__top"><h4>' + esc(n.nombre) + '</h4>' +
        '<span class="level__price"><small>desde</small>' + pesos(n.desde) + '</span></div>' +
        '<p>' + esc(n.ejemplos.charAt(0).toUpperCase() + n.ejemplos.slice(1)) + '.</p>' +
        '<p class="level__meta">' + esc(extra) + 'Modelado ' + esc(n.horas) + ' · Plazo ' + esc(n.plazo) + '.</p>' +
        '</div>';
    }).join("");
  }
  var bonif = document.getElementById("regla-bonificado");
  if (bonif) {
    bonif.textContent = "Desde " + cfg.DISENO_BONIFICADO_DESDE + " unidades de la misma pieza, el diseño simple va bonificado.";
  }

  // Materiales agrupados
  var lista = document.getElementById("lista-materiales");
  if (lista) {
    var grupos = [["Estándar", "Estándar"], ["Técnico", "Técnicos"]];
    lista.innerHTML = grupos.map(function (g) {
      var items = cfg.MATERIALES.filter(function (m) { return m.grupo === g[0]; });
      return '<div class="mgroup build"><h3>' + g[1] + '</h3><ul class="mlist">' +
        items.map(function (m) {
          return '<li><strong>' + esc(m.nombre) + '</strong><span class="muso">' + esc(m.uso) + '</span>' +
            '<p>' + esc(m.cuando) + '</p></li>';
        }).join("") + '</ul></div>';
    }).join("");
  }

  // Animación "se construye" capa por capa
  // Pestañas del cotizador (accesibles con teclado)
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  function activar(tab, foco) {
    tabs.forEach(function (t) {
      var sel = t === tab;
      t.setAttribute("aria-selected", String(sel));
      t.tabIndex = sel ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !sel;
    });
    if (foco) tab.focus();
    document.dispatchEvent(new CustomEvent("depthco:tab", { detail: tab.id }));
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { activar(t); });
    t.addEventListener("keydown", function (e) {
      var j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") j = 0;
      if (e.key === "End") j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); activar(tabs[j], true); }
    });
  });
  document.querySelectorAll("[data-tab]").forEach(function (a) {
    a.addEventListener("click", function () {
      var t = document.getElementById("tab-" + a.getAttribute("data-tab"));
      if (t) activar(t);
    });
  });
})();
