# Glam Carpe · Punto de Venta

Aplicación web de punto de venta (POS) de **Glam Carpe**: ropa, cosméticos, gorras y
accesorios. Funciona en el navegador y guarda todos los datos localmente
(IndexedDB), por lo que no requiere servidor ni conexión a internet una vez cargada.

## Funcionalidades

- **Entradas y salidas de producto**: registra reabastecimientos, mermas o ajustes de
  inventario, con historial completo de movimientos.
- **Stock disponible**: cada producto muestra su cantidad actual y se actualiza
  automáticamente con cada venta o movimiento.
- **Corte del día**: resumen de ventas del día separado por efectivo y transferencia,
  con opción de imprimir.
- **Historial de ventas**: consulta las ventas de hoy o de cualquier fecha anterior, con
  el detalle de artículos de cada ticket.
- **Alta de productos con código de barras**: escanea con la cámara del dispositivo o con
  un lector de código de barras USB/Bluetooth (funciona como teclado), y agrega una foto
  del producto.
- **Categorías de productos**: clasifica cada producto al darlo de alta. Incluye de
  ejemplo las categorías **Ropa**, **Cosméticos**, **Gorras**, **Accesorios** y
  **Calzado**. Puedes crear una categoría nueva desde el mismo formulario del producto
  ("+ Nueva categoría") o administrarlas en su propia sección.
- **Respaldo de datos**: descarga un archivo con todos tus productos, ventas y
  movimientos, y restáuralo en el mismo u otro dispositivo. La app te avisa cuando hay
  ventas sin respaldar.
- **Acceso de administrador**: productos, categorías, entradas/salidas y respaldo están
  protegidos con contraseña. La caja (vender, historial y corte) se usa sin contraseña.

## Administración y caja

El menú tiene dos zonas:

| Zona | Secciones | ¿Pide contraseña? |
|---|---|---|
| **Caja** | Vender, Historial de ventas, Corte del día | No |
| **🔒 Administración** | Productos, Categorías, Entradas/Salidas, Respaldo, Contraseña | Sí |

- La primera vez que alguien entra a **Administración** la app pide **crear** la
  contraseña (mínimo 4 caracteres, puede ser un PIN). Hazlo tú antes de dar la app a quien
  atienda la caja.
- La sesión de administración se cierra con **🔒 Cerrar sesión**, al recargar la app, o
  sola tras **10 minutos sin usarla**.
- Puedes cambiarla en **Administración → Contraseña**.
- **Importante:** la contraseña evita que el personal entre a dar de alta productos o
  mover inventario, pero no es seguridad bancaria: alguien con conocimientos técnicos y
  acceso al dispositivo podría saltársela, porque todo se guarda en el propio navegador.
- **Si olvidas la contraseña:** descarga un respaldo desde **Corte del día**, borra los
  datos de este sitio en la configuración del navegador, entra a Administración, crea una
  contraseña nueva y restaura el respaldo en **Administración → Respaldo**.

## Respaldo de tus datos (importante)

Los datos viven solo en el navegador del dispositivo donde usas la app. Si el dispositivo
se descompone, se pierde o se borran los datos del navegador, **la información se pierde**
a menos que tengas un respaldo.

- Usa el botón **Descargar respaldo** en **Corte del día** al cerrar caja (o en el aviso
  amarillo, o en **Administración → Respaldo**). Se descarga un archivo
  `respaldo-punto-de-venta-AAAA-MM-DD-HHMM.json`.
- Guárdalo **fuera del dispositivo**: súbelo a Google Drive, mándatelo por correo o por
  WhatsApp.
- Para recuperar tus datos (o pasarlos a otro dispositivo): **Administración → Respaldo →
  Restaurar respaldo**, elige el archivo y confirma. Esto reemplaza los datos actuales de ese
  dispositivo por los del respaldo.

## Instalación

Hay dos formas de instalarla, según para qué la quieras.

### Opción A: publicarla para usarla todos los días en el negocio (recomendada)

Es una app 100% estática (no necesita base de datos ni backend), así que puedes
publicarla gratis en un servicio como [Vercel](https://vercel.com) o
[Netlify](https://netlify.com):

1. Entra a vercel.com o netlify.com y crea una cuenta gratuita (puedes usar tu cuenta
   de GitHub para entrar en un clic).
2. Elige **"Import Project" / "Add new site" → "Import from GitHub"** y selecciona este
   repositorio (`app-de-punto-de-venta`).
3. Framework: detectan Vite automáticamente. Si te lo pide, confirma:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Dale a **Deploy**. En un par de minutos te dan un enlace (por ejemplo
   `https://tu-tienda.vercel.app`).
5. Abre ese enlace desde la computadora, tablet o celular que usarás en la caja, con
   Chrome o Edge. En la barra de direcciones (o en el menú ⋮) verás la opción
   **"Instalar aplicación"** / **"Agregar a pantalla de inicio"**. Al instalarla queda
   con su propio ícono, se abre en su propia ventana (sin barra del navegador) y
   sigue funcionando aunque no haya internet, porque los datos se guardan en el
   dispositivo.

Cada vez que subas cambios a la rama principal del repositorio, Vercel/Netlify
actualizan el sitio publicado automáticamente.

### Opción B: correrla en tu computadora para probarla o modificarla

Requiere tener [Node.js](https://nodejs.org) instalado (versión 18 o superior).

1. Descarga el proyecto (clona el repositorio) y entra a la carpeta.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar en modo desarrollo (abre automáticamente en tu navegador):
   ```bash
   npm run dev
   ```
4. Para generar la versión final y probarla como quedaría publicada:
   ```bash
   npm run build
   npm run preview
   ```
   Con `npm run preview` corriendo, abre la URL que te muestra en Chrome/Edge y ahí
   también aparece la opción de **"Instalar aplicación"**.

## Flujo recomendado

1. Entra a **Administración** y crea la contraseña.
2. En **Administración → Categorías** confirma o ajusta las categorías (Ropa, Cosméticos,
   Gorras, etc.).
3. En **Administración → Productos** da de alta cada artículo: escanea su código de
   barras, tómale una foto, asígnale categoría (o crea una con "+ Nueva categoría"),
   precio y stock inicial.
4. Cierra la sesión de administración. En la caja usa **Vender** para cobrar: escanea el
   código de barras de cada producto (o selecciónalo de la lista), elige el método de
   pago (efectivo, transferencia o mixto) y confirma la venta.
5. Usa **Administración → Entradas/Salidas** cuando llegue mercancía nueva o cuando haya
   que dar de baja producto dañado o extraviado.
6. Consulta **Historial de ventas** y **Corte del día** para revisar y cerrar la caja.

## Notas técnicas

- React + TypeScript + Vite + Tailwind CSS.
- Persistencia local con [Dexie](https://dexie.org/) (IndexedDB); los datos viven en el
  navegador del dispositivo donde se usa. Si cambias de equipo o navegador, la
  información no se transfiere automáticamente.
- Escaneo de código de barras con la cámara vía `html5-qrcode`; los lectores físicos de
  código de barras funcionan de forma nativa porque se comportan como un teclado.
- Instalable como PWA (`vite-plugin-pwa`): una vez publicada, el navegador ofrece
  "Instalar aplicación" y queda disponible sin conexión gracias al service worker.
- Marca: el logo está en `src/assets/logo-glam-carpe.png` y los íconos de la app en
  `public/` (`pwa-*.png`, `favicon.png`). La paleta (azul `brand`, `cream`, `blush`,
  `sand`) se define en `src/index.css` dentro de `@theme`.
