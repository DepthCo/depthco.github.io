/*
 * DepthCo — sistema de movimiento común a todas las páginas (sin librerías).
 * Se carga en <head>: marca el documento antes de que se pinte, así nada parpadea.
 *
 * Qué hace:
 *  - Scroll arriba al entrar a cada página.
 *  - Entradas al scrollear: .reveal (bloques) y .head (encabezados: primero pasa la línea, después baja el texto).
 *  - [data-count]: contadores animados.
 *  - [data-nav]: el menú se oculta al bajar, aparece al subir y marca su borde al salir del hero.
 *  - [data-page-progress]: línea que se completa a medida que se lee la página.
 *
 * Todo anima solo opacity/transform (lo mueve la GPU), siempre de arriba hacia abajo. El contenido está
 * visible en reposo: las animaciones arrancan cuando un bloque entra en pantalla. Respeta prefers-reduced-motion.
 */
(function () {
  var html = document.documentElement;
  html.classList.add("js");

  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducido) html.classList.add("motion");

  // Empezar siempre arriba (no heredar el scroll de la página anterior)
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  function arriba() { if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }
  window.addEventListener("pageshow", arriba);

  document.addEventListener("DOMContentLoaded", function () {
    arriba();
    contadores();
    nav();
    if (reducido) return;
    entradas();
    progreso();
  });

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
        el.style.setProperty("--retraso", Math.min(tanda++, 4) * 90 + "ms");
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -6% 0px" });

    function observar(raiz) {
      (raiz || document).querySelectorAll(".reveal, .head").forEach(function (el) {
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
    document.addEventListener("depthco:contenido", function (e) { observar(e.target); });
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
        if (en.isIntersecting) { io.unobserve(en.target); setTimeout(function () { correr(en.target); }, 200); }
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

  /* ---------- Progreso de lectura ---------- */
  function progreso() {
    var barra = document.querySelector("[data-page-progress]");
    if (!barra) return;
    var pendiente = false;
    function cuadro() {
      pendiente = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      barra.style.transform = "scaleX(" + p.toFixed(4) + ")";
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(cuadro); } }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    cuadro();
  }
})();
