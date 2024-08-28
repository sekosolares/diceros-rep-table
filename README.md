# Diceros - Report Table Lib
Esta librería ligera se encarga del manejo de la impresión de folios por hoja en un reporte.
La idea detrás, es tomar una tabla HTML, y manipularla antes de imprimirla, de modo que podamos mostrar el folio en cada hoja.

## Como instalar
La libraría se puede instalar de 2 formas:
- Por medio de un CDN (en este caso, jsdelivr).
- Descargando el código en el servidor e incluyendolo en el archivo HTML que lo requiera.

### Con CDN:
Debemos incluir el siguiente elemento en el `<head>` del archivo HTML:
```html
<script src="https://cdn.jsdelivr.net/gh/sekosolares/diceros-rep-table@latest/index.min.js"></script>
```
Esto utiliza internet para descargar el recurso en el y lo carga en el navegador, dentro del archivo HTML en el que esté incluido.

### Descargando el código:
Para descargar el código, basta con copiar y pegar el código de la librería (archivo `index.js` de este repositorio) en un archivo `.js` en blanco y guardarlo en el servidor (o bien `Ctrl+s` del )

## Cómo usarlo

1. Debemos empezar con una tabla correctamente estructurada con HTML semántico. Por ejemplo:

```html
<table>
  <thead>
    <tr>
      <th>Columna 1</th>
      <th>Columna 2</th>
      <th>Columna 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Cell 1</td>
      <td>Cell 2</td>
      <td>Cell 3</td>
    </tr>
    ...
  </tbody>
</table>
```
- A continuación, debemos agregar un `id` a la tabla para poder identificarla en la instancia. `<table id="root_table">`.

2. Ahora, podemos crear la instancia de la tabla HTML para que pueda agregar el folio correspondiente:

```js
const reportTable = new ReportTable({ tableId: 'root_table' });
```
- Esta es la forma más básica y sencilla de instanciar la tabla. Toma los valores por defecto de la clase las cuales se muestran [mas adelante](#propiedades-de-la-instancia).

3. Ahora, agregamos el evento de impresión a la ventana de la siguiente manera:

```js
  window.addEventListener('beforeprint', () => {
    reportTable.format();
  });
```
- Al usar la combinación de teclas `Ctrl+P`, el evento se va a disparar antes de la impresión.

4. Podemos especificar otra clase CSS para darle un estilo diferente al número de folio y manipular los márgenes de la tabla. Respetando determinada estructura al momento de declarar dicha clase. Por ejemplo:

```css
  .print-folio-table::before { /* Obligatorio (::before) */
    content: attr(data-folio); /* Obligatorio */
    position: relative; /* Obligatorio */
    top: 0;
    left: 0;
    font-size: 14px;
    padding: 8px;
    color: black;
    font-weight: bolder;
  }
  .print-folio-table { /* Obligatorio (para dar estilo a la tabla) */
    padding-top: 2.5cm;
    padding-left: 1.5cm;
    padding-right: 3cm;
    background-color: rgb(234, 211, 255);
    color: #333;
    font-family: Arial, Helvetica, sans-serif;
  }
```
- Quedando la instancia de la tabla de la siguiente manera para especificar la clase CSS de la tabla:

```js
const reportTable = new ReportTable({
  tableId: 'root_table',
  className: 'print-folio-table',
});
```

### Instanciando con todas las propiedades

Si queremos instanciar la tabla con todas las propiedades, podemos hacerlo de la siguiente manera:

```js
const reportTable = new ReportTable({
  tableId: 'reporte_tabla_id',
  paperSize: 'LEGAL',
  startingFolio: 201,
  orientation: 'LANDSCAPE',
  margin: 0.8,
  gapTolerance: 0.9,
  className: 'cute-table-for-printing',
});
```
## Metodos de la instancia

### `format(afterFormatCallback)`:
Formatea la tabla referenciada por `tableId` para mostrar correctamente el folio y la cantidad correcta de lineas por hoja. Luego, ejecuta `afterFormatCallback` si es proporcionado.

```js
reportTable.format(() => {
  console.log('Done!');
});
```
```js
reportTable.format();
```

### `print(afterPrintCallback)`:
Primero formatea y luego imprime la tabla instanciada. Muy util para usar en un botón de impresión en la UI. Si es proporcionado, `afterPrintCallback` se ejecuta despues de la impresión.

```js
reportTable.print(() => {
  console.log('Impresion completa!');
});
```
```js
reportTable.print();
```

### `getTableElement()`:
Retorna el elemento `table` de la instancia. Esto es útil para manipular el elemento `table` de la instancia; sin tener que hacer `document.getElementById(tableId)` o `document.querySelector(tableId)`.

```js
const tableElement = reportTable.getTableElement();
```

## Propiedades de la instancia


 Propiedad | Requerido   | Descripción | Valor por defecto | Posibles Valores
---        | ---         | ---         | ---               | ---
 `tableId` | `true`      | ID de la tabla | `N/A`
 `paperSize` | `false`     | Tamaño de la hoja | `LETTER`  | `LETTER`, `LEGAL`
 `startingFolio` | `false` | Folio inicial | `1` | `0 - ∞`
 `orientation` | `false` | Orientación en la que se va a imprimir la hoja | `PORTRAIT` | `PORTRAIT`, `LANDSCAPE`
 `margin` | `false` | Margen de la hoja en Centimetros. Se aplican arriba, izquierda y derecha | `1.5` | `0 - ∞`
 `gapTolerance` | `false` | Porcentaje (entre 0 y 1) de tolerancia de traslape entre hojas. (i.e. cuando salen las lineas finales de la hoja 1, en el inicio de la hoja 2) | `0.95` | `0.0 - 1.0`
 `className` | `false` | Clase CSS que se le agrega a la tabla | `report-table-instance-folio` | `N/A`