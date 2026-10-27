/*
 * DepthCo — sistema de movimiento común a todas las páginas (sin librerías).
 * Se carga en <head>: marca el documento antes de que se pinte, así nada parpadea.
 *
 * Qué hace:
 *  - Intro con el símbolo (solo index, una vez por sesión; ver .splash en styles.css).
 *  - Scroll arriba al entrar a cada página.
 *  - Entradas al scrollear: .reveal / .build (bloques) y [data-split] (títulos palabra por palabra, desde arriba).
 *  - [data-scrub]: párrafo que se "enciende" palabra por palabra mientras se scrollea.
 *  - [data-parallax="n"]: desplazamiento suave con el scroll.
 *  - [data-count]: contadores animados.
 *  - .magnetic: botones que siguen apenas al mouse.
 *  - [data-glow]: brillo que sigue al mouse dentro de un bloque.
 *  - [data-nav]: el menú se oculta al bajar, aparece al subir y se vuelve sólido fuera del hero.
 *  - [data-progress]: barra que se llena con el scroll de su sección.
 *
 * Todo anima solo opacity/transform (lo mueve la GPU). El contenido siempre está visible en reposo:
 * las animaciones arrancan cuando un bloque entra en pantalla. Respeta prefers-reduced-motion.
 */
(function () {
  var html = document.documentElement;
  html.classList.add("js");

  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducido) html.classList.add("motion");

  // Intro: solo en la portada, la primera vez de la sesión
  if (!reducido && html.hasAttribute("data-splash")) {
    var visto = false;
    try { visto = sessionStorage.getItem("depthco-intro") === "1"; sessionStorage.setItem("depthco-intro", "1"); } catch (e) { /* sin storage: se muestra */ }
    if (!visto) {
      html.classList.add("splash");
      setTimeout(function () { html.classList.remove("splash"); html.classList.add("splash-done"); }, 2600);
    }
  }

  // Empezar siempre arriba (no heredar el scroll de la página anterior)
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  function arriba() { if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }
  window.addEventListener("pageshow", arriba);

  document.addEventListener("DOMContentLoaded", function () {
    arriba();
    partirTextos(document);
    contadores();
    nav();
    if (reducido) return;
    entradas();
    scroll();
    magnetico();
    brillo();
  });

  /* ---------- Títulos palabra por palabra ---------- */
  // Envuelve cada palabra en una máscara, conservando <em>, <strong>, <br>, etc. El texto completo queda en aria-label.
  function partirTextos(raiz) {
    raiz.querySelectorAll("[data-split]:not(.is-split), [data-scrub]:not(.is-split)").forEach(function (el) {
      var scrub = el.hasAttribute("data-scrub");
      // Títulos: el texto completo queda en aria-label. Párrafos que se encienden: las palabras siguen siendo texto normal.
      if (!scrub && !el.hasAttribute("aria-label")) el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
      var i = 0;
      (function recorrer(nodo) {
        Array.prototype.slice.call(nodo.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var partes = n.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            partes.forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
              if (scrub) {
                var s = document.createElement("span");
                s.className = "sw";
                s.textContent = p;
                frag.appendChild(s);
              } else {
                var w = document.createElement("span");
                w.className = "w";
                var wi = document.createElement("span");
                wi.className = "wi";
                wi.style.setProperty("--i", i);
                wi.textContent = p;
                w.appendChild(wi);
                frag.appendChild(w);
              }
              i++;
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1 && n.tagName !== "BR") {
            recorrer(n);
          }
        });
      })(el);
      if (!scrub) {
        Array.prototype.forEach.call(el.children, function (c) { c.setAttribute("aria-hidden", "true"); });
        el.querySelectorAll(".w").forEach(function (w) { w.setAttribute("aria-hidden", "true"); });
      }
      el.classList.add("is-split");
    });
  }

  /* ---------- Entradas al scrollear ---------- */
  function entradas() {
    var vistos = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      var tanda = 0;
      entries.forEach(function (en) {
        var el = en.target;
        if (!vistos.has(el)) {
          // Primera lectura: lo que ya está en pantalla al cargar no se anima (salvo el hero, que tiene su propia entrada).
          vistos.add(el);
          if (en.isIntersecting) { io.unobserve(el); el.classList.add("is-built"); return; }
          return;
        }
        if (!en.isIntersecting) return;
        if (!el.hasAttribute("data-split")) el.style.setProperty("--retraso", Math.min(tanda++, 4) * 90 + "ms");
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -6% 0px" });

    function observar(raiz) {
      (raiz || document).querySelectorAll(".reveal, .build, [data-split]").forEach(function (el) {
        if (!el.classList.contains("is-in") && !el.classList.contains("is-built") && !el.closest(".hero")) io.observe(el);
      });
    }
    observar();

    // Limpieza al terminar: no queda ninguna capa extra ocupando memoria
    document.addEventListener("animationend", function (e) {
      var el = e.target;
      if (el.classList.contains("is-in") && (e.animationName === "drop-in")) {
        el.classList.remove("is-in");
        el.classList.add("is-built");
        el.style.removeProperty("--retraso");
      }
    });

    // Las páginas de catálogo agregan contenido después de leer los datos: avisan con este evento
    document.addEventListener("depthco:contenido", function (e) { partirTextos(e.target); observar(e.target); });
  }

  /* ---------- Contadores ---------- */
  function contadores() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    function formatear(n, dec) {
      return n.toFixed(dec).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    function correr(el) {
      var fin = parseFloat(el.getAttribute("data-count")) || 0;
      var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      if (reducido) { el.textContent = formatear(fin, dec); return; }
      var t0 = null, dur = 1400;
      requestAnimationFrame(function paso(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - k, 4);
        el.textContent = formatear(fin * e, dec);
        if (k < 1) requestAnimationFrame(paso);
      });
    }
    if (!("IntersectionObserver" in window)) { els.forEach(correr); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { io.unobserve(en.target); setTimeout(function () { correr(en.target); }, html.classList.contains("splash") ? 1500 : 250); }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Menú: sólido fuera del hero, se oculta al bajar ---------- */
  function nav() {
    var barra = document.querySelector("[data-nav]");
    if (!barra) return;
    var hero = document.querySelector("[data-hero]");
    var ultimo = window.scrollY, pendiente = false;
    function actualizar() {
      pendiente = false;
      var y = window.scrollY;
      var limite = hero ? hero.offsetHeight - barra.offsetHeight : 10;
      barra.classList.toggle("is-solid", y > limite);
      var abierto = html.classList.contains("menu-open");
      if (!abierto && !reducido) barra.classList.toggle("is-hidden", y > 320 && y > ultimo + 2);
      if (y < ultimo - 2 || y < 320) barra.classList.remove("is-hidden");
      ultimo = y;
    }
    window.addEventListener("scroll", function () { if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); } }, { passive: true });
    actualizar();
  }

  /* ---------- Scroll: parallax, párrafos que se encienden, barras de progreso ---------- */
  function scroll() {
    var parallax = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    var scrubs = Array.prototype.slice.call(document.querySelectorAll("[data-scrub]"));
    var barras = Array.prototype.slice.call(document.querySelectorAll("[data-progress]"));
    if (!parallax.length && !scrubs.length && !barras.length) return;
    var pendiente = false;
    function cuadro() {
      pendiente = false;
      var vh = window.innerHeight;
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var centro = r.top + r.height / 2 - vh / 2;
        var f = parseFloat(el.getAttribute("data-parallax")) || 0;
        el.style.transform = "translate3d(0," + (centro * f / 100).toFixed(1) + "px,0)";
      });
      scrubs.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        // 0 cuando el párrafo asoma abajo, 1 cuando llega a un 40% de la pantalla
        var p = Math.min(1, Math.max(0, (vh * 0.92 - r.top) / (vh * 0.52 + r.height * 0.6)));
        var ws = el._ws || (el._ws = el.querySelectorAll(".sw"));
        var encendidas = p * ws.length;
        for (var i = 0; i < ws.length; i++) {
          var o = Math.min(1, Math.max(0.22, 0.22 + (encendidas - i) * 0.78));
          if (ws[i]._o !== o) { ws[i].style.opacity = o; ws[i]._o = o; }
        }
      });
      barras.forEach(function (el) {
        var sec = el.closest("section") || el.parentElement;
        var r = sec.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / (r.height * 0.8)));
        el.style.transform = "scaleX(" + p.toFixed(3) + ")";
      });
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(cuadro); } }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    cuadro();
  }

  /* ---------- Botones magnéticos ---------- */
  function magnetico() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.addEventListener("pointermove", function (e) {
      var b = e.target.closest && e.target.closest(".magnetic");
      if (!b) return;
      var r = b.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      b.style.transform = "translate3d(" + (dx * 10).toFixed(1) + "px," + (dy * 8).toFixed(1) + "px,0)";
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      var b = e.target.closest && e.target.closest(".magnetic");
      if (b && !b.contains(e.relatedTarget)) b.style.transform = "";
    });
  }

  /* ---------- Brillo que sigue al mouse ---------- */
  function brillo() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.querySelectorAll("[data-glow]").forEach(function (zona) {
      var luz = zona.querySelector(".glow");
      if (!luz) return;
      var x = 0, y = 0, tx = 0, ty = 0, corriendo = false;
      function paso() {
        x += (tx - x) * 0.12; y += (ty - y) * 0.12;
        luz.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
        if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) requestAnimationFrame(paso); else corriendo = false;
      }
      zona.addEventListener("pointermove", function (e) {
        var r = zona.getBoundingClientRect();
        tx = e.clientX - r.left; ty = e.clientY - r.top;
        zona.classList.add("is-glowing");
        if (!corriendo) { corriendo = true; requestAnimationFrame(paso); }
      }, { passive: true });
      zona.addEventListener("pointerleave", function () { zona.classList.remove("is-glowing"); });
    });
  }
})();
