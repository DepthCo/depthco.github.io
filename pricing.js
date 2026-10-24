/*
 * DepthCo — cálculo de precios. Funciones puras: no tocan el DOM.
 * Se usan desde la página y desde test/precios.test.js.
 */
var DepthCoPricing = (function () {
  function material(cfg, id) {
    var m = cfg.MATERIALES.find(function (x) { return x.id === id; });
    if (!m) throw new Error("Material desconocido: " + id);
    return m;
  }

  function descuentoPorCantidad(cfg, cantidad) {
    var desc = 0;
    cfg.DESCUENTO_CANTIDAD.forEach(function (t) { if (cantidad >= t.desde) desc = t.desc; });
    return desc;
  }

  function redondearCentena(x) {
    return Math.round(x / 100) * 100;
  }

  function gramosDesdeVolumen(cfg, volumenCm3, materialId, relleno) {
    var factor = cfg.FACTOR_RELLENO[relleno];
    if (factor === undefined) throw new Error("Relleno no soportado: " + relleno);
    return volumenCm3 * material(cfg, materialId).densidad * factor;
  }

  // Costo de imprimir UNA unidad de `gramos` en el material dado.
  function unitario(cfg, gramos, materialId) {
    var m = material(cfg, materialId);
    var horas = gramos / m.velocidad;
    var costoMaterial = gramos * cfg.MERMA * m.costoKg / 1000;
    var hora = cfg.VALOR_HORA * (1 + (m.grupo === "Técnico" ? cfg.RECARGO_TECNICO : 0));
    return { gramos: gramos, horas: horas, material: costoMaterial, maquina: horas * hora, unitario: costoMaterial + horas * hora };
  }

  /*
   * Precio de impresión de un pedido.
   * opts: { gramos, material, cantidad, urgente, extra }
   *   extra = monto fijo que se suma antes del recargo urgente y del mínimo (ej. diseño).
   */
  function cotizarImpresion(cfg, opts) {
    var cantidad = Math.max(1, Math.floor(opts.cantidad || 1));
    var u = unitario(cfg, opts.gramos, opts.material);
    var desc = descuentoPorCantidad(cfg, cantidad);
    var impresion = u.unitario * cantidad * (1 - desc);
    var subtotal = impresion + cfg.CARGO_PREPARACION + (opts.extra || 0);
    if (opts.urgente) subtotal *= 1 + cfg.RECARGO_URGENTE;
    var aplicaMinimo = subtotal < cfg.PRECIO_MINIMO;
    var total = redondearCentena(Math.max(subtotal, cfg.PRECIO_MINIMO));
    return {
      cantidad: cantidad,
      gramos: u.gramos,
      horas: u.horas,
      unitarioImpresion: u.unitario,
      descuento: desc,
      impresion: impresion,
      subtotal: subtotal,
      subtotalRedondeado: redondearCentena(subtotal),
      aplicaMinimo: aplicaMinimo,
      total: total,
      porUnidad: redondearCentena(total / cantidad),
      consultar: cantidad >= cfg.CANTIDAD_CONSULTAR
    };
  }

  // Cotización desde un archivo (volumen de la malla en cm³).
  function cotizarArchivo(cfg, opts) {
    var gramos = gramosDesdeVolumen(cfg, opts.volumenCm3, opts.material, opts.relleno);
    return cotizarImpresion(cfg, { gramos: gramos, material: opts.material, cantidad: opts.cantidad, urgente: opts.urgente });
  }

  // ¿Entra en el volumen de impresión? Prueba las orientaciones posibles de la caja.
  function entraEnVolumen(cfg, dims) {
    var v = cfg.VOLUMEN_MAXIMO;
    var perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    return perms.some(function (p) {
      return dims[p[0]] <= v[0] && dims[p[1]] <= v[1] && dims[p[2]] <= v[2];
    });
  }

  /*
   * Relevamiento desde foto o pieza: diseño del nivel + impresión estimada.
   * opts: { nivel: "simple"|"media"|"compleja"|"nose", material: id|"recomendame", cantidad, urgente }
   */
  function cotizarRelevamiento(cfg, opts) {
    var nivelId = opts.nivel === "nose" ? "media" : opts.nivel;
    var nivel = cfg.NIVELES_DISENO[nivelId];
    if (!nivel) throw new Error("Nivel desconocido: " + opts.nivel);
    var materialId = opts.material === "recomendame" ? cfg.MATERIAL_RECOMENDADO : opts.material;
    var cantidad = Math.max(1, Math.floor(opts.cantidad || 1));
    var bonificado = nivelId === "simple" && cantidad >= cfg.DISENO_BONIFICADO_DESDE;
    var diseno = bonificado ? 0 : nivel.desde;
    var r = cotizarImpresion(cfg, {
      gramos: cfg.GRAMOS_RELEVAMIENTO,
      material: materialId,
      cantidad: cantidad,
      urgente: opts.urgente,
      extra: diseno
    });
    var factorUrgente = opts.urgente ? 1 + cfg.RECARGO_URGENTE : 1;
    r.nivel = nivelId;
    r.materialUsado = materialId;
    r.diseno = diseno;
    r.disenoBonificado = bonificado;
    r.disenoConRecargo = redondearCentena(diseno * factorUrgente);
    r.impresionConRecargo = r.total - r.disenoConRecargo;
    return r;
  }

  function formatoPesos(n) {
    return "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  return {
    material: material,
    descuentoPorCantidad: descuentoPorCantidad,
    redondearCentena: redondearCentena,
    gramosDesdeVolumen: gramosDesdeVolumen,
    unitario: unitario,
    cotizarImpresion: cotizarImpresion,
    cotizarArchivo: cotizarArchivo,
    cotizarRelevamiento: cotizarRelevamiento,
    entraEnVolumen: entraEnVolumen,
    formatoPesos: formatoPesos
  };
})();

if (typeof module !== "undefined") module.exports = DepthCoPricing;
