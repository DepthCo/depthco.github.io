/*
 * DepthCo — carga del catálogo (data/catalogo.json).
 * El archivo se edita desde admin.html o a mano. Las páginas lo leen al abrir.
 */
var DepthCoDatos = {
  RUTA: "data/catalogo.json",
  cargar: function () {
    return fetch(this.RUTA, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("No se pudo leer el catálogo (" + r.status + ")");
      return r.json();
    });
  },
  pesos: function (n) {
    return "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  },
  esc: function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  },
  // Precio por unidad de un llavero según los tramos de cantidad
  tramo: function (precios, cantidad) {
    var t = precios[0];
    precios.forEach(function (p) { if (cantidad >= p.desde) t = p; });
    return t;
  }
};

if (typeof module !== "undefined") module.exports = DepthCoDatos;
