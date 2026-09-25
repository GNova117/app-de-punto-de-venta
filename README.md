# Punto de Venta

Aplicación web de punto de venta (POS) para negocios pequeños: tienda de ropa, cosméticos,
gorras y accesorios. Funciona en el navegador y guarda todos los datos localmente
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
  **Calzado**, y puedes crear, editar o eliminar las que necesites.
- **Respaldo de datos**: descarga un archivo con todos tus productos, ventas y
  movimientos, y restáuralo en el mismo u otro dispositivo. La app te avisa cuando hay
  ventas sin respaldar.

## Respaldo de tus datos (importante)

Los datos viven solo en el navegador del dispositivo donde usas la app. Si el dispositivo
se descompone, se pierde o se borran los datos del navegador, **la información se pierde**
a menos que tengas un respaldo.

- Ve a **💾 Respaldo → Descargar respaldo** (o usa el botón en **Corte del día** al cerrar
  caja). Se descarga un archivo `respaldo-punto-de-venta-AAAA-MM-DD-HHMM.json`.
- Guárdalo **fuera del dispositivo**: súbelo a Google Drive, mándatelo por correo o por
  WhatsApp.
- Para recuperar tus datos (o pasarlos a otro dispositivo): **💾 Respaldo → Restaurar
  respaldo**, elige el archivo y confirma. Esto reemplaza los datos actuales de ese
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

1. Ve a **Categorías** y confirma o ajusta las categorías (Ropa, Cosméticos, Gorras, etc.).
2. Ve a **Productos** y da de alta cada artículo: escanea su código de barras, tómale
   una foto, asígnale categoría, precio y stock inicial.
3. Usa **Vender** para cobrar: escanea el código de barras de cada producto (o
   selecciónalo de la lista), elige el método de pago (efectivo, transferencia o
   mixto) y confirma la venta.
4. Usa **Entradas/Salidas** cuando llegue mercancía nueva o cuando haya que dar de baja
   producto dañado o extraviado.
5. Consulta **Historial de ventas** y **Corte del día** para revisar y cerrar la caja.

## Notas técnicas

- React + TypeScript + Vite + Tailwind CSS.
- Persistencia local con [Dexie](https://dexie.org/) (IndexedDB); los datos viven en el
  navegador del dispositivo donde se usa. Si cambias de equipo o navegador, la
  información no se transfiere automáticamente.
- Escaneo de código de barras con la cámara vía `html5-qrcode`; los lectores físicos de
  código de barras funcionan de forma nativa porque se comportan como un teclado.
- Instalable como PWA (`vite-plugin-pwa`): una vez publicada, el navegador ofrece
  "Instalar aplicación" y queda disponible sin conexión gracias al service worker.
