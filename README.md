# DepthCo — Web + Cotizador

Web de DepthCo (impresión 3D y repuestos a medida, San Isidro) con cotizador instantáneo.
HTML + CSS + JS sin frameworks ni build step. Todo el cálculo corre en el navegador.

## Publicar con GitHub Pages

1. Subí este repo a GitHub (branch `main`).
2. En el repo: **Settings → Pages**.
3. En "Build and deployment", Source: **Deploy from a branch**. Branch: **main**, carpeta **/ (root)** → **Save**.
4. En 1–2 minutos la web queda en **https://depthcoestudio-lang.github.io/Depthco-Web/**
   (el panel: https://depthcoestudio-lang.github.io/Depthco-Web/admin.html).

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
| WhatsApp, Instagram | `WHATSAPP`, `INSTAGRAM` (el mail está en `index.html`, armado para que no lo lean los bots) |

Después de cambiar precios, corré el test (necesita Node):

```
node test/precios.test.js
```

## Panel para editar la web (admin.html)

Entrá a `https://depthcoestudio-lang.github.io/Depthco-Web/admin.html` (guardalo en favoritos; no aparece en el menú ni en buscadores).
Desde ahí agregás y editás, sin tocar código:

- **Llaveros:** precios por cantidad, diseño del logo, modelos del catálogo (con foto), colores, formas, fotos de trabajos.
- **Lámparas:** modelos con foto, precio (vacío = "Consultá el precio") y link de Mercado Libre; colores; qué incluye y plazo.
- **Precios de repuestos:** hora de máquina, preparación, mínimo, recargos, descuentos, diseño por nivel y materiales.

**Guardar cambios** publica directo en GitHub y la web se actualiza en 1–2 minutos. Las fotos se achican solas antes de subirse.

### Conectar el panel con GitHub (una vez por dispositivo)
1. GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate new token.
2. *Repository access*: **Only select repositories** → el repo de la web.
3. *Permissions → Contents*: **Read and write**. Generalo y copialo.
4. En el panel, pestaña **Conexión**: usuario, repo, rama (`main`) y el token → **Guardar y probar conexión**.

El token queda guardado solo en ese navegador. Si perdés el celular o la compu, borralo en GitHub (Settings → Fine-grained tokens).
Sin conexión, el panel deja descargar `catalogo.json` y `config.js` para subirlos a mano.

## Catálogo: llaveros y lámparas

Dos páginas aparte, con la misma paleta y otra estética: `llaveros.html` y `lamparas.html`.
Los datos están en `data/catalogo.json` (se edita desde el panel). Los modelos y precios que vienen cargados son de ejemplo.

- **Llaveros:** el cliente elige con nombre, con logo, del catálogo o "Tengo una idea". Solo el logo paga diseño (una vez);
  el resto paga el precio por cantidad. Colores: la lista del panel más "Otro" (lo escribe el cliente).
- **Lámparas:** sin precio cargado muestran "Consultá el precio" y el botón pide el precio por WhatsApp.
- La web no usa imágenes generadas: solo fotos reales. Sin foto, el producto se muestra con texto.

## Seguridad

La web no tiene servidor ni base de datos y **no guarda ninguna clave en el código**: no hay nada secreto que un bot pueda robar.
La única llave es el token de GitHub del panel, que queda solo en el navegador de tu dispositivo, nunca en el repositorio.

Protecciones incluidas:
- **Política de seguridad (CSP) en cada página:** el navegador solo ejecuta código de la propia web (y three.js desde jsDelivr en la portada).
  Si alguien lograra inyectar un script, se bloquea. En el panel solo se permite hablar con la API de GitHub.
- **Integridad de three.js:** cada archivo que viene del CDN tiene su huella; si alguien lo adultera allá, el navegador no lo ejecuta.
- **Mail protegido de bots:** se arma en el navegador, no aparece escrito en el HTML.
- **Datos del catálogo saneados:** textos escapados; solo se aceptan fotos propias (`img/…`) y links `https://`.
- **Panel:** no aparece en buscadores, no guarda si lo meten dentro de otra página y sin token no puede modificar nada.
- `node test/seguridad.test.js` verifica todo esto. Correlo junto con `node test/precios.test.js` después de cada cambio.

Lo que tenés que hacer vos en GitHub (una sola vez):
1. Activar la **verificación en dos pasos** en tu cuenta (Settings → Password and authentication).
2. Crear el token del panel con **lo mínimo**: solo este repositorio, solo *Contents: Read and write*, y con **vencimiento** (por ejemplo 90 días).
3. En el repo: Settings → Pages → tildar **Enforce HTTPS**.
4. Dejar activado *Secret scanning* y *Push protection* (Settings → Code security; vienen activados en repos públicos).
5. Si perdés el celular o la compu con el panel abierto, borrá el token en GitHub (Settings → Developer settings → Fine-grained tokens).

Lo que es público a propósito: el número de WhatsApp (es el canal de contacto) y los precios (se ven en la web).
El repositorio tiene que ser público para usar GitHub Pages gratis; no hay problema porque no contiene secretos.

## Diseño e impresión: dos módulos

El cotizador cobra el **diseño** (según el nivel de la pieza, una sola vez) y la **impresión** (solo material y
tiempo de máquina) por separado. Si el cliente trae su archivo, paga solo la impresión, aunque la pieza sea compleja.
El recargo urgente se aplica a cada módulo; el precio mínimo y el cargo de preparación, solo a la impresión.

## Logo y fotos

- **Logo (ya integrado):** `img/logo.svg` (fondo claro) e `img/logo-claro.svg` (fondo oscuro, footer).
  Símbolo "Co anidado" solo: `img/simbolo.svg` / `img/simbolo-claro.svg`. Favicon: `img/favicon.svg`.
  Avatar para Instagram: `img/marca/avatar-instagram.png` (1080 × 1080) y `.svg`.
  Si cambiás el logo, reemplazá esos archivos con el mismo nombre.
- **Fotos de piezas:** cuando se sume la sección de trabajos realizados (pendiente), van en `img/`.
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
| `config.js` | Precios y constantes del cotizador de repuestos (también editable desde el panel) |
| `data/catalogo.json` | Productos y precios del catálogo (llaveros y lámparas), editable desde el panel |
| `catalogo-datos.js` | Lee el catálogo para las páginas y el panel |
| `admin.html` / `.css` / `.js` | Panel para editar catálogo y precios |
| `llaveros.html` / `.css` / `.js` | Página de llaveros personalizados |
| `lamparas.html` / `.css` / `.js` | Página de lámparas |
| `pricing.js` | Fórmulas de precio (sin DOM, se usan también en el test) |
| `main.js` | Menú, animaciones, pestañas, contenido generado desde config |
| `cotizador-foto.js` | Pestaña "Tengo una foto o la pieza" |
| `cotizador-archivo.js` | Pestaña "Tengo el archivo": visor 3D (three.js por CDN), volumen STL/3MF |
| `test/precios.test.js` | Chequeo contra el mercado y del catálogo |
| `test/seguridad.test.js` | Chequeos de seguridad (CSP, integridad, secretos) |
| `motion.js` | Sistema de movimiento: entradas de arriba hacia abajo, contadores, línea de lectura, menú que se oculta, scroll arriba al cambiar de página |
| `CLAUDE.md` | Brief del proyecto para Claude |
