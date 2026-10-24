/*
 * DepthCo — configuración del cotizador de repuestos.
 * Se edita desde admin.html (pestaña "Precios de repuestos") o a mano. Valores en pesos argentinos.
 * VALOR_HORA: $ por hora de máquina · RECARGO_TECNICO: recargo sobre la hora en materiales técnicos (0.25 = 25%)
 * CARGO_PREPARACION: $ fijo por trabajo · MERMA: 1.10 = +10% de material · PRECIO_MINIMO: $ por pedido
 * RECARGO_URGENTE: 0.30 = +30% · FACTOR_RELLENO: fracción de material según relleno
 * DESCUENTO_CANTIDAD: descuento desde X unidades · CANTIDAD_CONSULTAR: desde acá se pide consultar
 * MATERIALES: densidad (g/cm³), costoKg ($), velocidad (g/h, se calibra contra el slicer)
 * NIVELES_DISENO: precio "desde" del diseño por nivel · GRAMOS_RELEVAMIENTO: gramos por unidad sin archivo
 */
var DEPTHCO_CONFIG = {
  "WHATSAPP": "541161191201",
  "INSTAGRAM": "depthco.3d",
  "VOLUMEN_MAXIMO": [
    256,
    256,
    256
  ],
  "VALOR_HORA": 1500,
  "RECARGO_TECNICO": 0.25,
  "CARGO_PREPARACION": 2500,
  "MERMA": 1.1,
  "PRECIO_MINIMO": 5000,
  "RECARGO_URGENTE": 0.3,
  "FACTOR_RELLENO": {
    "15": 0.4,
    "20": 0.45,
    "40": 0.6,
    "100": 1
  },
  "RELLENO_POR_DEFECTO": 20,
  "DESCUENTO_CANTIDAD": [
    {
      "desde": 5,
      "desc": 0.05
    },
    {
      "desde": 10,
      "desc": 0.1
    },
    {
      "desde": 50,
      "desc": 0.15
    }
  ],
  "CANTIDAD_CONSULTAR": 100,
  "MATERIALES": [
    {
      "id": "pla",
      "nombre": "PLA",
      "grupo": "Estándar",
      "densidad": 1.24,
      "costoKg": 25000,
      "velocidad": 25,
      "uso": "Piezas generales y prototipos.",
      "cuando": "Conviene para prototipos, maquetas y piezas que no ven calor ni esfuerzo."
    },
    {
      "id": "petg",
      "nombre": "PETG",
      "grupo": "Estándar",
      "densidad": 1.27,
      "costoKg": 25000,
      "velocidad": 20,
      "uso": "Piezas mecánicas, resistencia a impacto.",
      "cuando": "La opción por defecto para repuestos: tenaz, no se quiebra y aguanta humedad."
    },
    {
      "id": "abs",
      "nombre": "ABS",
      "grupo": "Estándar",
      "densidad": 1.04,
      "costoKg": 25000,
      "velocidad": 20,
      "uso": "Temperatura, carcasas, piezas de motor.",
      "cuando": "Cuando la pieza trabaja con calor moderado, cerca de un motor o al sol."
    },
    {
      "id": "asa",
      "nombre": "ASA",
      "grupo": "Estándar",
      "densidad": 1.07,
      "costoKg": 30000,
      "velocidad": 20,
      "uso": "Exterior, resistencia UV.",
      "cuando": "Para piezas a la intemperie: no amarillea ni se vuelve frágil con el sol."
    },
    {
      "id": "tpu",
      "nombre": "TPU 95A",
      "grupo": "Estándar",
      "densidad": 1.21,
      "costoKg": 30000,
      "velocidad": 8,
      "uso": "Flexibles: juntas, topes, fundas.",
      "cuando": "Cuando la pieza tiene que doblarse, amortiguar o sellar."
    },
    {
      "id": "placf",
      "nombre": "PLA-CF",
      "grupo": "Técnico",
      "densidad": 1.3,
      "costoKg": 42000,
      "velocidad": 20,
      "uso": "Piezas rígidas con acabado técnico mate.",
      "cuando": "Soportes y gabinetes rígidos con terminación prolija, sin exigencia térmica."
    },
    {
      "id": "petgcf",
      "nombre": "PETG-CF",
      "grupo": "Técnico",
      "densidad": 1.29,
      "costoKg": 35000,
      "velocidad": 18,
      "uso": "Engranajes, soportes estructurales.",
      "cuando": "Piezas estructurales que necesitan más rigidez que el PETG común."
    },
    {
      "id": "pa6",
      "nombre": "Nylon PA6",
      "grupo": "Técnico",
      "densidad": 1.14,
      "costoKg": 50000,
      "velocidad": 15,
      "uso": "Engranajes, bujes, desgaste.",
      "cuando": "Piezas que rozan o giran: bajo coeficiente de fricción y gran resistencia al desgaste."
    },
    {
      "id": "pacf",
      "nombre": "PA-CF",
      "grupo": "Técnico",
      "densidad": 1.2,
      "costoKg": 95000,
      "velocidad": 15,
      "uso": "Máxima rigidez y resistencia térmica.",
      "cuando": "La pieza más exigida: rigidez y temperatura cercanas a una pieza de aluminio liviana."
    }
  ],
  "COLORES": [
    "Negro",
    "Blanco",
    "Gris",
    "Natural",
    "Rojo",
    "Azul",
    "A definir"
  ],
  "VALOR_HORA_DISENO": 10000,
  "NIVELES_DISENO": {
    "simple": {
      "nombre": "Simple",
      "desde": 15000,
      "horas": "1–2 h",
      "plazo": "3–5 días hábiles",
      "ejemplos": "bujes, separadores, tapas, perillas, clips, soportes planos"
    },
    "media": {
      "nombre": "Media",
      "desde": 35000,
      "horas": "3–4 h",
      "plazo": "5–7 días hábiles",
      "ejemplos": "engranajes, piezas con encastres o roscas, carcasas chicas",
      "incluye": "1 prueba de encaje"
    },
    "compleja": {
      "nombre": "Compleja",
      "desde": 60000,
      "horas": "6+ h",
      "plazo": "a convenir",
      "ejemplos": "curvas orgánicas, ensambles de varias piezas, ingeniería inversa fina",
      "nota": "presupuesto cerrado tras ver la pieza"
    }
  },
  "DISENO_BONIFICADO_DESDE": 10,
  "PRUEBA_ENCAJE_EXTRA": 0.5,
  "ARCHIVO_STEP_CLIENTE": 0.5,
  "GRAMOS_RELEVAMIENTO": 50,
  "MATERIAL_RECOMENDADO": "petg"
};

if (typeof module !== "undefined") module.exports = DEPTHCO_CONFIG;
