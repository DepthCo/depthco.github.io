/*
 * DepthCo — catálogo de productos (llaveros y lámparas).
 * Todos los productos, precios y opciones del catálogo se editan SOLO acá.
 * IMPORTANTE: los precios y modelos cargados son DE EJEMPLO. Reemplazalos por los reales.
 * Valores en pesos argentinos (ARS).
 */
var DEPTHCO_CATALOGO = {
  // Colores de filamento que se ofrecen en el catálogo (los mismos de la paleta de la marca)
  COLORES: [
    { id: "nogal",   nombre: "Nogal",   hex: "#5B3A29" },
    { id: "oxido",   nombre: "Óxido",   hex: "#A4522F" },
    { id: "hueso",   nombre: "Hueso",   hex: "#EDE6DA" },
    { id: "grafito", nombre: "Grafito", hex: "#2B2A28" },
    { id: "acero",   nombre: "Acero",   hex: "#8A8F94" }
  ],

  LLAVEROS: {
    LARGO_MAX_TEXTO: 12,
    TEXTO_EJEMPLO: "SOFÍA",
    FORMAS: [
      { id: "etiqueta", nombre: "Etiqueta" },
      { id: "redondo",  nombre: "Redondo" },
      { id: "placa",    nombre: "Placa" }
    ],
    // Precio por unidad según cantidad (el tramo más alto que alcance)
    PRECIOS: [
      { desde: 1,   unitario: 4500 },
      { desde: 10,  unitario: 3800 },
      { desde: 50,  unitario: 3000 },
      { desde: 100, unitario: 2500 }
    ],
    // Llavero con logo: el diseño del logo se cobra aparte, una sola vez (como en repuestos)
    DISENO_LOGO: 15000,
    CANTIDAD_CONSULTAR: 300, // desde acá: "Escribinos para precio por volumen"
    PLAZO: "3 a 5 días hábiles",
    // Fotos reales de llaveros hechos (se muestran arriba si hay al menos una). Ej: { src: "img/productos/llavero-1.jpg", alt: "Llavero con nombre en nogal y hueso" }
    FOTOS: [],
    USOS: [
      { titulo: "Eventos", texto: "Cumpleaños, casamientos, egresos y bautismos. Un llavero con el nombre de cada invitado." },
      { titulo: "Empresas y marcas", texto: "Merchandising con tu logo para clientes, equipos y ferias. Desde 10 unidades." },
      { titulo: "Comercios", texto: "Inmobiliarias, concesionarias y talleres: el llavero que se va con cada entrega de llaves." },
      { titulo: "Regalo", texto: "Una unidad con el nombre, la inicial o la fecha que quieras." }
    ]
  },

  LAMPARAS: {
    INCLUYE: "Portalámpara, cable con interruptor y lámpara LED de luz cálida.",
    PLAZO: "5 a 7 días hábiles",
    MODELOS: [
      {
        id: "capa", nombre: "Capa", tipo: "De mesa",
        descripcion: "Un cilindro de ondas suaves que deja ver cada capa de impresión. La luz atraviesa el material y marca la textura.",
        medidas: "Ø 16 × 24 cm", precio: 48000, color: "hueso",
        foto: "", // ej. "img/productos/lampara-capa.jpg" (foto real; sin foto la tarjeta se muestra solo con texto)
        mercadoLibre: "" // link a la publicación, si existe
      },
      {
        id: "duna", nombre: "Duna", tipo: "De mesa",
        descripcion: "Base ancha que se cierra hacia arriba, como un médano. Luz baja y envolvente para la mesa de luz.",
        medidas: "Ø 22 × 20 cm", precio: 52000, color: "oxido",
        foto: "", // ej. "img/productos/lampara-duna.jpg" (foto real; sin foto la tarjeta se muestra solo con texto)
        mercadoLibre: "" // link a la publicación, si existe
      },
      {
        id: "faro", nombre: "Faro", tipo: "De pie de mesa",
        descripcion: "Un volumen redondeado sobre una base angosta. Ilumina hacia los costados con una luz pareja.",
        medidas: "Ø 20 × 25 cm", precio: 58000, color: "nogal",
        foto: "", // ej. "img/productos/lampara-faro.jpg" (foto real; sin foto la tarjeta se muestra solo con texto)
        mercadoLibre: "" // link a la publicación, si existe
      },
      {
        id: "campana", nombre: "Campana", tipo: "Colgante",
        descripcion: "Pantalla colgante que se abre hacia abajo. Pensada para la mesa del comedor o la barra de la cocina.",
        medidas: "Ø 25 × 18 cm", precio: 65000, color: "grafito",
        foto: "", // ej. "img/productos/lampara-campana.jpg" (foto real; sin foto la tarjeta se muestra solo con texto)
        mercadoLibre: "" // link a la publicación, si existe
      }
    ]
  }
};

if (typeof module !== "undefined") module.exports = DEPTHCO_CATALOGO;
