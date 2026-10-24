# DepthCo — Web + Cotizador

## Qué es DepthCo
Servicio de impresión 3D en San Isidro, Buenos Aires, Argentina.
- Instagram: @depthco.3d
- WhatsApp: +54 11-6119-1201 (link: https://wa.me/541161191201)
- Mail: depthcodesign@gmail.com
- También vendemos en Mercado Libre.
- No poner nombres personales en la web: la marca es DepthCo.

## Objetivo de la web
1. Conseguir clientes B2B: empresas de repuestos, talleres, industrias.
   Mensaje central: "Tu pieza discontinuada o rota, fabricada en días."
2. Cotizador INSTANTÁNEO: con una foto (relevamiento) o con el archivo, el cliente ve un precio al momento.
   Diferencial clave frente a la competencia (casi todos ponen "precio a convenir"
   o responden en ~24 h hábiles). Destacarlo en el hero.
3. Cerrar por WhatsApp con mensaje prearmado que empiece con "pedido:".

## Público
- Principal: empresas de repuestos y mantenimiento (B2B), Zona Norte GBA.
- Secundario: particulares que necesitan una pieza puntual.
- Tono: profesional, directo, técnico pero entendible. Español rioplatense (vos).

## Estética — rebranding DepthCo (misma línea que el Instagram nuevo)
Concepto: "CAPA POR CAPA". Referencia: Dirk vander Kooij (piezas impresas con la línea de capa visible y orgullosa, material honesto, cálido e industrial a la vez).

Paleta "Óxido — marrón industrial" (definir como variables CSS en :root; ajustar hex al tono exacto del IG si Nacho lo pasa):
```css
--hueso:   #EDE6DA;  /* fondo principal, claro y cálido */
--acero:   #8A8F94;  /* textos secundarios, bordes, líneas finas */
--oxido:   #A4522F;  /* acento: botones, precios, links, CTA de WhatsApp */
--nogal:   #5B3A29;  /* marrón profundo: títulos, bloques destacados, footer */
--grafito: #2B2A28;  /* texto principal y secciones oscuras */
```
- Marrón (nogal/óxido) es el color protagonista de la marca. Usar hueso como fondo general y alternar secciones en nogal o grafito para dar ritmo.
- Motivo gráfico "capa por capa": líneas horizontales finas y paralelas (como capas de impresión) en separadores, fondos sutiles y en el hover de tarjetas. Animación de entrada de secciones que "se construyen" de abajo hacia arriba, en capas (sutil, rápida, respetar prefers-reduced-motion).
- Logo: "Co anidado" (símbolo C con la o adentro + "Depth"), en color de la paleta, nunca en blanco y negro. Archivo en /img/logo.svg (o .png). Si todavía no está, dejar un placeholder de texto "DepthCo" en nogal y un TODO.
- Tipografía: sans geométrica para títulos (ej. Space Grotesk o Archivo desde Google Fonts) + sans neutra para texto (ej. Inter). Números de precio grandes, en óxido.
- Minimalista, industrial, cálido. Nada que parezca juguete o gimmick. Sin emojis. Fotos reales de piezas sobre fondo neutro.

## Stack técnico
- HTML + CSS + JS vanilla. Sin frameworks ni build step.
- Hosting: GitHub Pages (branch main, raíz del repo).
- three.js desde CDN para visor 3D y parseo de STL/3MF.
- Todo el cálculo corre en el navegador (no hay backend).
- Mobile first. Tiene que andar bien en celular.
- TODAS las constantes de precios en `config.js` (un solo lugar para editar).

## Equipamiento (sección "Capacidad")
- Elegoo Centauri Carbon 2 con CANVAS: CoreXY cerrada, boquilla endurecida 350 °C, cama 110 °C, 4 colores. → todos los materiales, técnicos y multicolor
- Es la única impresora de DepthCo: no mencionar otras máquinas ni resina.
- Volumen máximo de impresión: 256 × 256 × 256 mm (CC2)
  - Si la pieza excede ese volumen en cualquier eje (probando las 3 orientaciones), mostrar:
    "Tu pieza supera 256 mm: la imprimimos en partes. Escribinos para cotizarla." y ocultar el precio.

## Materiales (precios de referencia oct-2026, ARS por kg, mercado argentino)
| id | Material | Grupo | Densidad (g/cm³) | Costo kg (ARS) | Velocidad (g/h) | Uso típico |
|---|---|---|---|---|---|---|
| pla    | PLA       | Estándar | 1.24 | 25000 | 25 | piezas generales, prototipos |
| petg   | PETG      | Estándar | 1.27 | 25000 | 20 | piezas mecánicas, resistencia a impacto |
| abs    | ABS       | Estándar | 1.04 | 25000 | 20 | temperatura, carcasas, piezas de motor |
| asa    | ASA       | Estándar | 1.07 | 30000 | 20 | exterior, resistencia UV |
| tpu    | TPU 95A   | Estándar | 1.21 | 30000 | 8  | flexibles: juntas, topes, fundas |
| placf  | PLA-CF    | Técnico  | 1.30 | 42000 | 20 | piezas rígidas con acabado técnico mate |
| petgcf | PETG-CF   | Técnico  | 1.29 | 35000 | 18 | engranajes, soportes estructurales |
| pa6    | Nylon PA6 | Técnico  | 1.14 | 50000 | 15 | engranajes, bujes, desgaste |
| pacf   | PA-CF     | Técnico  | 1.20 | 95000 | 15 | máxima rigidez y resistencia térmica |

- Velocidad (g/h) = estimación inicial para la CC2 con perfil estándar. Se calibra comparando contra el slicer (ver "Calibración").
- Mostrar los materiales agrupados (Estándar / Técnicos) con una línea de "cuándo conviene".

## Fórmula de precio (config.js)
```js
VALOR_HORA        = 1500   // ARS por hora de máquina (CC2, gama media-pro)
RECARGO_TECNICO   = 0.25   // +25% sobre la hora para materiales del grupo Técnico
CARGO_PREPARACION = 2500   // ARS fijo por trabajo (no por unidad): revisión de archivo, slicing, setup, retiro de soportes
MERMA             = 1.10   // +10% material por purgas, soportes y fallas
PRECIO_MINIMO     = 5000   // ARS por pedido
RECARGO_URGENTE   = 0.30   // +30% si el cliente marca "Urgente (menos de 48 h)"
FACTOR_RELLENO    = { 15: 0.40, 20: 0.45, 40: 0.60, 100: 1.00 } // fracción del volumen sólido, aprox
DESCUENTO_CANTIDAD = [ {desde: 5, desc: 0.05}, {desde: 10, desc: 0.10}, {desde: 50, desc: 0.15} ]
CANTIDAD_CONSULTAR = 100   // desde 100 unidades: "Escribinos para precio por volumen"
```
Cálculo por unidad:
- volumen_cm3 = volumen de la malla
- gramos = volumen_cm3 × densidad × FACTOR_RELLENO[relleno]
- horas = gramos / velocidad
- material = gramos × MERMA × costo_kg / 1000
- hora = VALOR_HORA × (1 + RECARGO_TECNICO si es técnico)
- unitario = material + horas × hora

Total:
- subtotal = unitario × cantidad × (1 − descuento por cantidad) + CARGO_PREPARACION
- si urgente: subtotal × (1 + RECARGO_URGENTE)
- total = max(subtotal, PRECIO_MINIMO), redondeado a la centena
- Mostrar: total, precio por unidad, gramos y horas estimadas.
- Mostrar siempre: "Precio estimado. Confirmamos el valor final al revisar el archivo."

Chequeo contra el mercado (referencias de talleres argentinos 2026), la fórmula debe dar aprox:
- Engranaje PETG 18 g → ~$4.300 (mercado $3.500–5.500)
- Pieza PLA 80 g → ~$9.500 (mercado $7.000–20.000)
- Maceta PETG 120 g → ~$14.800 (mercado $14.000–22.000)
- Pieza PLA 300 g → ~$28.800 (mercado $25.000–60.000)
Posicionamiento: rango medio del mercado. Competitivo para B2B sin regalar el trabajo.

## Repuestos a medida (el cliente NO tiene archivo) — SERVICIO PRINCIPAL
Es el servicio central para B2B. El cliente trae o manda la pieza rota/discontinuada (o foto + medidas),
DepthCo la mide, la modela en CAD (Fusion 360), imprime una prueba de encaje y entrega.
En el mercado casi nadie publica precios ("precio a convenir"): mostrar precios "desde" es diferencial.

Precio = DISEÑO (se cobra una sola vez) + IMPRESIÓN (fórmula de arriba, por unidad)

```js
VALOR_HORA_DISENO = 10000  // ARS por hora de modelado CAD (precio de lanzamiento)
NIVELES_DISENO = {
  simple:   { desde: 15000, horas: "1–2 h", ejemplos: "bujes, separadores, tapas, perillas, clips, soportes planos" },
  media:    { desde: 35000, horas: "3–4 h", ejemplos: "engranajes, piezas con encastres o roscas, carcasas chicas", incluye: "1 prueba de encaje" },
  compleja: { desde: 60000, horas: "6+ h",  ejemplos: "curvas orgánicas, ensambles de varias piezas, ingeniería inversa fina", nota: "presupuesto cerrado tras ver la pieza" }
}
DISENO_BONIFICADO_DESDE = 10 // si piden 10+ unidades de la misma pieza, el diseño simple va bonificado (gratis)
PRUEBA_ENCAJE_EXTRA = 0.5  // cada prueba adicional: 50% del costo de impresión de esa pieza
ARCHIVO_STEP_CLIENTE = 0.5 // si el cliente quiere quedarse con el archivo CAD: +50% del diseño
```
Reglas comerciales (mostrarlas en la web):
- El diseño se paga una sola vez. El archivo queda guardado en DepthCo: la próxima unidad o reposición solo paga impresión. (Fideliza al cliente B2B.)
- Plazo: simple 3–5 días hábiles, media 5–7, compleja a convenir. (Competencia online: 7–10 días hábiles.)
- La muestra se recibe en San Isidro o por envío/moto a cargo del cliente.
- Si el repuesto original fallaba, se ofrece versión mejorada (material técnico, refuerzos). Mencionarlo como valor agregado.
- Anclaje de valor en el copy: "Un repuesto discontinuado no vale lo que pesa: vale la máquina que vuelve a funcionar."

En la web — RELEVAMIENTO DESDE FOTO O PIEZA (es como llegan hoy la mayoría de los clientes):
- El cotizador tiene DOS pestañas, con esta en PRIMER lugar y abierta por defecto:
  1. "Tengo una foto o la pieza" → relevamiento + diseño + impresión
  2. "Tengo el archivo (STL/3MF)" → cálculo automático
- El hero y la sección "Cómo trabajamos" tienen que dejar claro que NO hace falta archivo:
  "¿No tenés el archivo? No importa. Mandanos una foto y nosotros relevamos la pieza."
- Pestaña "Tengo una foto o la pieza":
  a) Paso 1 — ¿Qué tenés? (selector): "Solo fotos" / "Tengo la pieza (rota o entera)" / "Tengo un plano o croquis".
  b) Paso 2 — Nivel de la pieza (tarjetas con ejemplos + ilustración simple con el motivo de capas): Simple / Media / Compleja. Opción "No sé" → se cotiza como media y se aclara "lo confirmamos al ver las fotos".
  c) Paso 3 — Material (o "Recomendame vos"), cantidad, urgencia.
  d) Resultado: UN SOLO precio total "Desde $X" = diseño del nivel + estimación de impresión con 50 g por unidad (aclarar que es estimado). Desglose chico debajo. Si cantidad >= DISENO_BONIFICADO_DESDE y nivel simple: "Diseño bonificado".
  e) Guía "Cómo sacar las fotos para relevar tu pieza" (checklist visual, 4 ítems):
     - Foto de frente, de costado y de arriba.
     - Una regla, calibre o moneda al lado para tener escala.
     - La medida más importante anotada (diámetro de un eje, distancia entre agujeros, etc.).
     - Una foto de dónde va montada la pieza (ayuda a entender cómo trabaja).
     Si tiene la pieza: "Traela a San Isidro o mandala por envío/moto. Te la devolvemos con el repuesto."
  f) Botón WhatsApp con mensaje:
     "pedido: relevamiento | tengo: <fotos/pieza/plano> | nivel: <x> | material: <m> | cantidad: <n> | urgente: <sí/no> | precio desde: $<X>. Te mando las fotos."
     Debajo: "Las fotos las mandás por WhatsApp después de tocar el botón."
- Sección "Cómo trabajamos" (proceso de relevamiento, 4 pasos con el motivo capa por capa):
  1. Mandás fotos o la pieza → 2. Relevamos y modelamos (te confirmamos precio y plazo) → 3. Prueba de encaje → 4. Repuesto final. El archivo queda guardado para la próxima.

## Calibración
Agregar al README una tabla para registrar piezas reales (gramos y horas del slicer vs. estimación del cotizador). Con 5 piezas por material, ajustar `velocidad` en config.js.

## Mensaje de WhatsApp
```
pedido:
Pieza: <nombre archivo>
Material: <material> | Color: <color> | Relleno: <%>
Cantidad: <n> | Urgente: <sí/no>
Medidas: <x × y × z mm>
Precio estimado: $<total> ($<unitario> c/u)
```

## Estructura de la página
1. Hero: "Tu repuesto discontinuado, fabricado en días. Solo necesitamos una foto." + "Precio al instante" + botones "Cotizá con una foto" (principal) y "Tengo el archivo" (secundario)
2. Servicios: REPUESTOS A MEDIDA / RELEVAMIENTO (primero y destacado, con los 3 niveles y precios "desde"), prototipos, series cortas, multicolor
3. Cómo trabajamos (relevamiento en 4 pasos)
4. Cotizador (sección central, 2 pestañas)
5. Materiales (cuándo usar cada uno)
6. Trabajos realizados (galería tipo "original vs. repuesto", fotos en /img)
7. Preguntas frecuentes: ¿necesito el archivo? (no), ¿qué fotos mando?, ¿hacen series?, ¿qué pasa si no encaja? (prueba de encaje incluida en media), ¿me quedo con el archivo?, envíos
8. Contacto + Instagram + botón flotante de WhatsApp en óxido

## Reglas para Claude
- Commits chicos y descriptivos.
- No agregar dependencias fuera de CDNs.
- Constantes de precios solo en `config.js`.
- Antes de terminar, verificar que la página abre sin errores en consola y que los 4 casos del "Chequeo contra el mercado" dan los valores esperados.
