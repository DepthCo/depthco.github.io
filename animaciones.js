/*
 * DepthCo — comportamiento común a todas las páginas:
 * 1. Al entrar a una página, empieza desde arriba (no hereda el scroll de la página anterior).
 * 2. Entrada suave de los bloques con clase .build: el contenido siempre está visible;
 *    solo se anima un bloque que estaba fuera de pantalla al cargar, cuando entra en vista.
 */
(function () {
  document.documentElement.classList.add("js");

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  function arriba() {
    if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }
  arriba();
  window.addEventListener("pageshow", arriba);

  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducido || !("IntersectionObserver" in window)) return;

  var vistos = new WeakSet();
  var io = new IntersectionObserver(function (entries) {
    var tanda = 0;
    entries.forEach(function (en) {
      var el = en.target;
      if (!vistos.has(el)) {
        // Primera lectura: si ya está en pantalla al cargar, no se anima.
        vistos.add(el);
        if (en.isIntersecting) io.unobserve(el);
        return;
      }
      if (en.isIntersecting) {
        // Los bloques que entran juntos (ej. una fila de tarjetas) aparecen escalonados.
        el.style.setProperty("--retraso", Math.min(tanda++, 4) * 80 + "ms");
        el.classList.add("is-building");
        io.unobserve(el);
      }
    });
  }, { rootMargin: "0px 0px -4% 0px" });

  // Al terminar, se limpia el bloque: no queda ninguna capa extra ocupando memoria.
  document.addEventListener("animationend", function (e) {
    var el = e.target;
    if (e.animationName === "build-in" && el.classList.contains("is-building")) {
      el.classList.remove("is-building");
      el.classList.add("is-built");
      el.style.removeProperty("--retraso");
    }
  });

  function observar(raiz) {
    (raiz || document).querySelectorAll(".build:not(.is-building):not(.is-built)").forEach(function (el) { io.observe(el); });
  }
  observar();
  // Las páginas de catálogo agregan contenido después de leer los datos: avisan con este evento.
  document.addEventListener("depthco:contenido", function (e) { observar(e.target); });
})();
