# DepthCo — Web + Cotizador

Web de DepthCo (impresión 3D y repuestos a medida, San Isidro) con cotizador instantáneo.
HTML + CSS + JS sin frameworks ni build step. Todo el cálculo corre en el navegador.

## Publicar con GitHub Pages

1. Subí este repo a GitHub (branch `main`).
2. En el repo: **Settings → Pages**.
3. En "Build and deployment", Source: **Deploy from a branch**. Branch: **main**, carpeta **/ (root)** → **Save**.
4. En 1–2 minutos la web queda en `https://<tu-usuario>.github.io/<nombre-del-repo>/`.
5. Opcional, para que la vista previa al compartir salga perfecta: en `index.html`, cambiá
   `content="img/og-image.png"` (en `og:image` y `twitter:image`) por la URL completa,
   por ejemplo `https://<tu-usuario>.github.io/<repo>/img/og-image.png`.

## Dónde cambiar precios

**Todo está en `config.js`** (es el único lugar donde se editan):

| Qué | Constante |
|---|---|
| Valor de la hora de máquina | `VALOR_HORA` |
| Recargo para materiales técnicos | `RECARGO_TECNICO` |
| Cargo fijo por trabajo | `CARGO_PREPARACION` |
| Merma de material | `MERMA` |
| Precio mínimo por pedido | `PRECIO_MINIMO` |
| Recargo urgente | `RECARGO_URGENTE` |
| Relleno → fracción de material | `FACTOR_RELLENO` |
| Descuentos por cantidad | `DESCUENTO_CANTIDAD` |
| Cantidad desde la que se pide consultar | `CANTIDAD_CONSULTAR` |
| Materiales: densidad, costo por kg, velocidad (g/h), textos | `MATERIALES` |
| Colores disponibles | `COLORES` |
| Diseño CAD: niveles y precios "desde" | `NIVELES_DISENO` |
| Unidades desde las que el diseño simple es gratis | `DISENO_BONIFICADO_DESDE` |
| Gramos que se asumen al cotizar sin archivo | `GRAMOS_RELEVAMIENTO` |
| Material de referencia para "Recomendame vos" | `MATERIAL_RECOMENDADO` |
| WhatsApp, Instagram, mail | `WHATSAPP`, `INSTAGRAM`, `EMAIL` |

Después de cambiar precios, corré el test (necesita Node):

```
node test/precios.test.js
```

## Logo y fotos

- **Logo:** guardalo como `img/logo.svg` (o `img/logo.png`). Después, en `index.html`, reemplazá
  `<span class="brand__text">Depth<span class="brand__co">Co</span></span>` dentro del header por
  `<img src="img/logo.svg" alt="DepthCo">` (está marcado con un `TODO`).
- **Fotos de trabajos (original vs. repuesto):** subilas a `img/` (por ejemplo
  `img/trabajo-1-original.jpg` e `img/trabajo-1-repuesto.jpg`). En la sección "Trabajos realizados" de
  `index.html`, reemplazá cada `<div class="work__ph">…</div>` por
  `<img src="img/trabajo-1-original.jpg" alt="Engranaje original roto">`. Lo ideal son fotos cuadradas,
  sobre fondo neutro, de menos de 300 KB cada una.
- **Imagen para compartir:** `img/og-image.png` (1200 × 630). Si querés, reemplazala por una con foto real.

## Calibración de la velocidad (g/h)

El cotizador estima los gramos y las horas a partir del volumen de la pieza. Para afinarlo, cargá piezas
reales en el slicer y anotá acá lo que da el slicer contra lo que estima el cotizador (mismo material y relleno).
Con 5 piezas por material, ajustá `velocidad` en `config.js`:

**velocidad nueva = suma de gramos del slicer ÷ suma de horas del slicer**

Si los gramos del cotizador se alejan mucho de los del slicer, ajustá `FACTOR_RELLENO`.

| Fecha | Pieza | Material | Relleno | Gramos slicer | Horas slicer | Gramos cotizador | Horas cotizador | Diferencia horas |
|---|---|---|---|---|---|---|---|---|
| | | PLA | 20% | | | | | |
| | | PLA | 20% | | | | | |
| | | PLA | 20% | | | | | |
| | | PLA | 20% | | | | | |
| | | PLA | 20% | | | | | |
| | | PETG | 20% | | | | | |
| | | PETG | 20% | | | | | |
| | | PETG | 20% | | | | | |
| | | PETG | 20% | | | | | |
| | | PETG | 20% | | | | | |

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | Página completa |
| `styles.css` | Estilos (paleta Óxido en `:root`) |
| `config.js` | Precios y constantes |
| `pricing.js` | Fórmulas de precio (sin DOM, se usan también en el test) |
| `main.js` | Menú, animaciones, pestañas, contenido generado desde config |
| `cotizador-foto.js` | Pestaña "Tengo una foto o la pieza" |
| `cotizador-archivo.js` | Pestaña "Tengo el archivo": visor 3D (three.js por CDN), volumen STL/3MF |
| `test/precios.test.js` | Chequeo contra el mercado |
| `CLAUDE.md` | Brief del proyecto para Claude |
