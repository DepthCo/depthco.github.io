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
    if (!("IntersectionObserver" in window)) return;
    var vistos = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      var tanda = 0;
      entries.forEach(function (en) {
        var el = en.target;
        if (!vistos.has(el)) {
          // Primera lectura: lo que ya está en pantalla (o más arriba) al cargar queda quieto y visible.
          // Lo que está más abajo espera oculto en la posición de partida, así no se ve, desaparece y vuelve a aparecer.
          vistos.add(el);
          if (en.boundingClientRect.top < window.innerHeight) { io.unobserve(el); el.classList.add("is-built"); return; }
          el.classList.add("is-pending");
          if (!en.isIntersecting) return;
        }
        if (!en.isIntersecting) return;
        el.classList.remove("is-pending");
        if (!el.hasAttribute("data-split")) el.style.setProperty("--retraso", Math.min(tanda++, 4) * 90 + "ms");
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -6% 0px" });

    // Red de seguridad: si por algún motivo el observador no avisa (navegadores raros, vistas embebidas),
    // cada tanto se revisa lo pendiente y se muestra lo que ya pasó por la pantalla. Nunca queda una sección vacía.
    var revisando = null;
    function revisar() {
      revisando = null;
      document.querySelectorAll(".is-pending").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.remove("is-pending");
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    }
    window.addEventListener("scroll", function () { if (!revisando) revisando = setTimeout(revisar, 400); }, { passive: true });

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
  // Las medidas se leen solo al cargar y al cambiar el tamaño: en cada scroll solo se compara un número.
  function nav() {
    var barra = document.querySelector("[data-nav]");
    if (!barra) return;
    var hero = document.querySelector("[data-hero]");
    var ultimo = window.scrollY, pendiente = false, limite = 10, solido = null, oculto = false;
    function medir() { limite = hero ? hero.offsetHeight - barra.offsetHeight : 10; }
    function actualizar() {
      pendiente = false;
      var y = window.scrollY;
      if ((y > limite) !== solido) { solido = y > limite; barra.classList.toggle("is-solid", solido); }
      var ocultar = oculto;
      if (!reducido && !html.classList.contains("menu-open") && y > 320 && y > ultimo + 4) ocultar = true;
      if (y < ultimo - 4 || y < 320) ocultar = false;
      if (ocultar !== oculto) { oculto = ocultar; barra.classList.toggle("is-hidden", oculto); }
      ultimo = y;
    }
    window.addEventListener("scroll", function () { if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); } }, { passive: true });
    window.addEventListener("resize", function () { medir(); actualizar(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    medir();
    actualizar();
  }

  /* ---------- Scroll: parallax, párrafos que se encienden, barras de progreso ----------
     Solo se calcula lo que está en pantalla (lo avisa un IntersectionObserver). En cada cuadro primero se
     leen todas las medidas y después se escribe, así el navegador no recalcula el diseño a mitad de camino.
     Los párrafos se encienden por escalones: solo se tocan las palabras que cambian. */
  function scroll() {
    var items = [];
    document.querySelectorAll("[data-parallax]").forEach(function (el) {
      items.push({ el: el, tipo: "parallax", ref: el.parentElement, f: parseFloat(el.getAttribute("data-parallax")) || 0 });
    });
    document.querySelectorAll("[data-scrub]").forEach(function (el) {
      items.push({ el: el, tipo: "scrub", ref: el, ws: el.querySelectorAll(".sw"), n: -1 });
    });
    document.querySelectorAll("[data-progress]").forEach(function (el) {
      items.push({ el: el, tipo: "barra", ref: el.closest("section") || el.parentElement, v: -1 });
    });
    if (!items.length) return;

    var visibles = [];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var it = en.target._item;
        var i = visibles.indexOf(it);
        if (en.isIntersecting && i === -1) visibles.push(it);
        if (!en.isIntersecting && i !== -1) visibles.splice(i, 1);
      });
      pedir();
    }, { rootMargin: "200px 0px" });
    items.forEach(function (it) { it.ref._item = it; io.observe(it.ref); });

    var pendiente = false;
    function cuadro() {
      pendiente = false;
      var vh = window.innerHeight;
      // 1) Leer
      var rects = visibles.map(function (it) { return it.ref.getBoundingClientRect(); });
      // 2) Escribir
      visibles.forEach(function (it, k) {
        var r = rects[k];
        if (it.tipo === "parallax") {
          var centro = r.top + r.height / 2 - vh / 2;
          it.el.style.transform = "translate3d(0," + Math.round(centro * it.f / 100) + "px,0)";
        } else if (it.tipo === "scrub") {
          // 0 cuando el párrafo asoma abajo, 1 cuando su comienzo llega a un 60% de la pantalla
          var p = Math.min(1, Math.max(0, (vh * 0.95 - r.top) / (vh * 0.35)));
          var n = Math.round(p * it.ws.length * 2) / 2; // escalones de media palabra
          if (n === it.n) return;
          for (var i = 0; i < it.ws.length; i++) {
            var o = n >= i + 1 ? 1 : n > i ? 0.68 : 0.35;
            if (it.ws[i]._o !== o) { it.ws[i].style.opacity = o; it.ws[i]._o = o; }
          }
          it.n = n;
        } else {
          var v = Math.round(Math.min(1, Math.max(0, (vh * 0.75 - r.top) / (r.height * 0.8))) * 200) / 200;
          if (v !== it.v) { it.el.style.transform = "scaleX(" + v + ")"; it.v = v; }
        }
      });
    }
    function pedir() { if (!pendiente && visibles.length) { pendiente = true; requestAnimationFrame(cuadro); } }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
  }

  /* ---------- Botones magnéticos ---------- */
  function magnetico() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.addEventListener("pointermove", function (e) {
      var b = e.target.closest && e.target.closest(".magnetic");
      if (!b) return;
      // Se descuenta el desplazamiento ya aplicado: si no, el botón se persigue a sí mismo y tiembla
      var r = b.getBoundingClientRect();
      var cx = r.left + r.width / 2 - (b._mx || 0), cy = r.top + r.height / 2 - (b._my || 0);
      b._mx = Math.round((e.clientX - cx) / r.width * 10);
      b._my = Math.round((e.clientY - cy) / r.height * 8);
      b.style.transform = "translate3d(" + b._mx + "px," + b._my + "px,0)";
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      var b = e.target.closest && e.target.closest(".magnetic");
      if (b && !b.contains(e.relatedTarget)) { b.style.transform = ""; b._mx = b._my = 0; }
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
