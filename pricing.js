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
   * opts: { gramos, material, cantidad, urgente }
   */
  function cotizarImpresion(cfg, opts) {
    var cantidad = Math.max(1, Math.floor(opts.cantidad || 1));
    var u = unitario(cfg, opts.gramos, opts.material);
    var desc = descuentoPorCantidad(cfg, cantidad);
    var impresion = u.unitario * cantidad * (1 - desc);
    var subtotal = impresion + cfg.CARGO_PREPARACION;
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

  // Módulo DISEÑO: depende del nivel de la pieza. Se cobra una sola vez y aparte de la impresión.
  function cotizarDiseno(cfg, opts) {
    var nivelId = opts.nivel === "nose" ? "media" : opts.nivel;
    var nivel = cfg.NIVELES_DISENO[nivelId];
    if (!nivel) throw new Error("Nivel desconocido: " + opts.nivel);
    var cantidad = Math.max(1, Math.floor(opts.cantidad || 1));
    var bonificado = nivelId === "simple" && cantidad >= cfg.DISENO_BONIFICADO_DESDE;
    var base = bonificado ? 0 : nivel.desde;
    return {
      nivel: nivelId,
      bonificado: bonificado,
      base: base,
      total: redondearCentena(base * (opts.urgente ? 1 + cfg.RECARGO_URGENTE : 1))
    };
  }

  /*
   * Relevamiento desde foto o pieza: dos módulos independientes.
   *   diseno    = cotizarDiseno (nivel de la pieza)
   *   impresion = cotizarImpresion con GRAMOS_RELEVAMIENTO por unidad (solo material y máquina)
   * opts: { nivel: "simple"|"media"|"compleja"|"nose", material: id|"recomendame", cantidad, urgente }
   */
  function cotizarRelevamiento(cfg, opts) {
    var materialId = opts.material === "recomendame" ? cfg.MATERIAL_RECOMENDADO : opts.material;
    var diseno = cotizarDiseno(cfg, opts);
    var impresion = cotizarImpresion(cfg, {
      gramos: cfg.GRAMOS_RELEVAMIENTO,
      material: materialId,
      cantidad: opts.cantidad,
      urgente: opts.urgente
    });
    return {
      nivel: diseno.nivel,
      materialUsado: materialId,
      diseno: diseno,
      impresion: impresion,
      total: diseno.total + impresion.total
    };
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
    cotizarDiseno: cotizarDiseno,
    cotizarRelevamiento: cotizarRelevamiento,
    entraEnVolumen: entraEnVolumen,
    formatoPesos: formatoPesos
  };
})();

if (typeof module !== "undefined") module.exports = DepthCoPricing;
