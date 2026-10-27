/* DepthCo — interacción de la portada: menú, contenido desde config.js y el catálogo, pestañas del cotizador. */
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
  function menu(abrir) {
    toggle.setAttribute("aria-expanded", String(abrir));
    toggle.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
    nav.classList.toggle("is-open", abrir);
    document.documentElement.classList.toggle("menu-open", abrir);
  }
  toggle.addEventListener("click", function () { menu(toggle.getAttribute("aria-expanded") !== "true"); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) menu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) { menu(false); toggle.focus(); } });

  // Contador de materiales del hero: sale de config.js
  var statMat = document.getElementById("stat-materiales");
  if (statMat) { statMat.setAttribute("data-count", cfg.MATERIALES.length); statMat.textContent = cfg.MATERIALES.length; }

  // Hero: cotizaciones de ejemplo calculadas con la misma fórmula del cotizador (config.js)
  var ticket = document.querySelector(".ticket");
  if (ticket && window.DepthCoPricing) {
    var ejemplos = [
      { pieza: "Engranaje de repuesto", material: "petg", gramos: 40 },
      { pieza: "Soporte de motor", material: "pla", gramos: 80 },
      { pieza: "Buje de desgaste", material: "pa6", gramos: 30 },
      { pieza: "Carcasa de comando", material: "petg", gramos: 120 }
    ].filter(function (e) { return cfg.MATERIALES.some(function (m) { return m.id === e.material; }); });
    var campos = {};
    ticket.querySelectorAll("[data-ticket]").forEach(function (el) { campos[el.getAttribute("data-ticket")] = el; });
    var actual = 0, pausa = false;
    function mostrar(i) {
      var e = ejemplos[i];
      if (!e) return;
      var c = DepthCoPricing.cotizarImpresion(cfg, { gramos: e.gramos, material: e.material, cantidad: 1, urgente: false });
      var min = Math.round(c.horas * 60);
      campos.pieza.textContent = e.pieza;
      campos.material.textContent = cfg.MATERIALES.filter(function (m) { return m.id === e.material; })[0].nombre;
      campos.gramos.textContent = e.gramos + " g";
      campos.horas.textContent = ((min >= 60 ? Math.floor(min / 60) + " h " : "") + (min % 60 ? (min % 60) + " min" : "")).trim();
      campos.total.textContent = pesos(c.total);
      ticket.classList.remove("is-printing");
      void ticket.offsetWidth; // reinicia la animación de capas
      ticket.classList.add("is-printing");
    }
    mostrar(0);
    ticket.addEventListener("pointerenter", function () { pausa = true; });
    ticket.addEventListener("pointerleave", function () { pausa = false; });
    if (ejemplos.length > 1 && document.documentElement.classList.contains("motion")) {
      setInterval(function () {
        if (pausa || document.hidden || ticket.getBoundingClientRect().bottom < 0) return;
        actual = (actual + 1) % ejemplos.length;
        mostrar(actual);
      }, 5200);
    }
  }

  // Llaveros y lámparas: precio "desde", cantidad de modelos y foto, leídos del catálogo
  if (window.DepthCoDatos && document.querySelector("[data-prod-meta]")) {
    var D = window.DepthCoDatos;
    D.cargar().then(function (cat) {
      var L = cat.llaveros, LA = cat.lamparas;
      var minimo = Math.min.apply(null, L.precios.map(function (p) { return p.unitario; }));
      document.querySelector('[data-prod-meta="llaveros"]').textContent =
        "Desde " + pesos(minimo) + " c/u · en el color que quieras";
      var n = LA.modelos.length;
      if (n) document.querySelector('[data-prod-meta="lamparas"]').textContent =
        n + (n === 1 ? " modelo" : " modelos") + " · de mesa y colgantes · en una sola pieza";
      var fotoLl = (L.fotos || []).map(function (f) { return f.src; }).concat(L.modelos.map(function (m) { return m.foto; })).filter(function (u) { return D.url(u); })[0];
      var fotoLa = LA.modelos.map(function (m) { return m.foto; }).filter(function (u) { return D.url(u); })[0];
      [["llaveros", fotoLl], ["lamparas", fotoLa]].forEach(function (par) {
        if (!par[1]) return;
        var caja = document.querySelector('[data-prod-foto="' + par[0] + '"]');
        caja.innerHTML = '<img src="' + esc(D.url(par[1])) + '" alt="" loading="lazy">';
        caja.parentNode.classList.add("prod--foto");
      });
    }).catch(function () { /* sin catálogo quedan los textos por defecto */ });
  }

  // Niveles de diseño en Servicios
  var niveles = document.getElementById("niveles-servicio");
  if (niveles) {
    niveles.innerHTML = Object.keys(cfg.NIVELES_DISENO).map(function (k) {
      var n = cfg.NIVELES_DISENO[k];
      var extra = n.incluye ? "Incluye " + n.incluye + ". " : "";
      if (n.nota) extra += n.nota.charAt(0).toUpperCase() + n.nota.slice(1) + ". ";
      return '<div class="level reveal">' +
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
      return '<div class="mgroup reveal"><h3>' + g[1] + '</h3><ul class="mlist">' +
        items.map(function (m) {
          return '<li><strong>' + esc(m.nombre) + '</strong><span class="muso">' + esc(m.uso) + '</span>' +
            '<p>' + esc(m.cuando) + '</p></li>';
        }).join("") + '</ul></div>';
    }).join("");
  }

  // Pestañas del cotizador (accesibles con teclado), con un indicador que se desliza a la pestaña activa
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  var tira = document.querySelector(".tabs");
  var tinta = null;
  if (tira) {
    tinta = document.createElement("span");
    tinta.className = "tabs__ink";
    tinta.setAttribute("aria-hidden", "true");
    tira.appendChild(tinta);
  }
  function moverTinta() {
    var t = tabs.filter(function (x) { return x.getAttribute("aria-selected") === "true"; })[0];
    if (!tinta || !t) return;
    tinta.style.width = t.offsetWidth + "px";
    tinta.style.transform = "translate3d(" + t.offsetLeft + "px,0,0)";
  }
  window.addEventListener("resize", moverTinta);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverTinta);
  function activar(tab, foco) {
    tabs.forEach(function (t) {
      var sel = t === tab;
      t.setAttribute("aria-selected", String(sel));
      t.tabIndex = sel ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !sel;
    });
    moverTinta();
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
  moverTinta();
})();
