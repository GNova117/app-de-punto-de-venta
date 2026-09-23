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

## Cómo usar

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar en modo desarrollo:
   ```bash
   npm run dev
   ```
3. Compilar para producción (genera la carpeta `dist/` lista para publicar en cualquier
   hosting estático, o para instalarse como PWA):
   ```bash
   npm run build
   npm run preview
   ```

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
