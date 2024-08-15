class ReportTable {
  /**
   * Constructs a new instance of the ReportTable class.
   *
   * @param {string} tableId - The ID of the table element.
   * @param {string} paperSize - The size of the paper in uppercase. ['LETTER', 'LEGAL'] - 'LETTER' by default
   * @param {number} [startingFolio=1] - The starting folio number. 1 by default
   * @param {string} [orientation='PORTRAIT'] - The orientation of the report. ['PORTRAIT', 'LANDSCAPE'] - 'PORTRAIT' by default
   * @return {ReportTable} A new instance of the ReportTable class.
   */
  constructor({ tableId, paperSize = 'LETTER', startingFolio = 1, orientation = 'PORTRAIT', margin = 1.5 }) {
    this.paperSize = paperSize;
    this.startingFolio = startingFolio;
    this.currentFolio = startingFolio;
    this.tableId = tableId;
    this.table = document.getElementById(tableId);
    this.orientation = orientation;

    if (orientation === 'LANDSCAPE') {
      this.pageWidth = Page.getPageHeight(paperSize);
      this.pageHeight = Page.getPageWidth(paperSize);
    } else {
      this.pageWidth = Page.getPageWidth(paperSize);
      this.pageHeight = Page.getPageHeight(paperSize);
    }

    this.margin = margin * 10; // convert cm to mm
    this.table.style.width = `${this.pageWidth - (this.getMarginInPx() * 2)}px`;
    this.tableHeader = this.table.querySelectorAll('thead')[0];
    this.tableBody = this.table.querySelectorAll('tbody')[0];
    this.headerHeight = this.tableHeader.offsetHeight;
    this.bodyHeight = this.tableBody.offsetHeight;
    this.pendingRows = [...this.tableBody.querySelectorAll('tr')];
    this.newTablesList = [];
    console.log('ReportTable:', {tableId, paperSize, startingFolio, orientation, margin, marginInPx: this.getMarginInPx(), tableHeight: this.table.offsetHeight});
    this.table.style.width = '';
  }

  getTableElement = () => this.table;

  hideTable = () => {
    this.table.style.display = 'none';
  }

  showTable = () => {
    this.table.style.display = '';
  }

  getMarginInPx = () => {
    const winDPI = Page.getScreenDPI();
    return Math.ceil(Page.mmToPx(this.margin, winDPI));
  }

  getInitialTableHeight = () => {
    const marginInPx = this.getMarginInPx();
    return Math.ceil(this.headerHeight + (marginInPx * 2));
  }

  getPageContainer = () => {
    const container = document.createElement('div');
    container.classList.add('print-folio');
    container.id = `page_${this.currentFolio}`;
    container.setAttribute('data-folio', this.currentFolio);
    container.style.height = `${this.pageHeight}px`;
    container.style.width = `${this.pageWidth}px`;

    return container;
  }

  generateTable = () => {
    const newTable = document.createElement('table');
    const newTableBody = document.createElement('tbody');

    newTable.classList = [...this.table.classList];
    newTable.appendChild(this.tableHeader.cloneNode(true));

    let newTableBodyHeight = this.getInitialTableHeight();
    const maxTableBody = Math.ceil(this.pageHeight - newTableBodyHeight + (this.pendingRows?.reduce((acc, row) => acc + row.offsetHeight, 0) / this.pendingRows.length));

    let row = this.pendingRows.shift();
    do {
      newTableBody.appendChild(row.cloneNode(true));
      newTableBodyHeight += row.offsetHeight;

      row = this.pendingRows.shift();
    } while (newTableBodyHeight + row.offsetHeight <= maxTableBody && this.pendingRows.length > 0);
    newTableBody.appendChild(row.cloneNode(true));

    newTable.appendChild(newTableBody);

    return newTable;
  }

  addPageToDocument = () => {
    const container = this.getPageContainer();
    const newTable = this.generateTable();
    container.appendChild(newTable);
    document.body.appendChild(container);
    this.newTablesList.push(container);
    this.currentFolio += 1;
  }

  format = (afterFormatCallback) => {

    while (this.pendingRows.length > 0) {
      this.addPageToDocument();
    }

    this.table.style.width = '';
    this.hideTable();
    window.addEventListener('afterprint', () => {
      this.showTable();
      this.newTablesList.forEach(table => {
        document.body.removeChild(table);
      });
      this.newTablesList = [];
      this.currentFolio = this.startingFolio;
      this.pendingRows = [...this.tableBody.querySelectorAll('tr')];

      if (afterFormatCallback) {
        afterFormatCallback();
      }
    });
  }

  printTable = (afterPrintCallback) => {
    this.format(afterPrintCallback);
    window.print();
  }
}



class Page {
  static _paperSizeDimensions = {
    LETTER: {
      '72DPI': [612, 791], // px
      '96DPI': [816, 1054], // px
      '120DPI': [1020, 1298], // px
      '150DPI': [1276, 1648], // px
      '200DPI': [1701, 2197], // px
      '300DPI': [2551, 3295], // px
    },
    LEGAL: {
      '72DPI': [612, 1009], // px
      '96DPI': [816, 1346], // px
      '120DPI': [1020, 1682], // px
      '150DPI': [1271, 2102], // px
      '300DPI': [2551, 4205], // px
    },
  };

  // 1dppx = 96dpi
  static getScreenDPI = () => {
    return window.devicePixelRatio * 96;
  }
  static pxToMm = (px, dpi) => px / (dpi / 25.4);

  static mmToPx = (mm, dpi) => mm * (dpi / 25.4);

  static getPageSize = (paperSize) => {
    const winDPI = this.getScreenDPI();
    return this._paperSizeDimensions[paperSize][`${winDPI}DPI`] ?? [404, 404];
  }

  static getPageWidth = (paperSize) => this.getPageSize(paperSize)[0];

  static getPageHeight = (paperSize) => this.getPageSize(paperSize)[1];
}
