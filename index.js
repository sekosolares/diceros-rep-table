class ReportTable {
  defaultClassName = 'report-table-instance-folio';
  constructor({ tableId, paperSize = 'LETTER', startingFolio = 1, orientation = 'PORTRAIT', margin = 1.5, gapTolerance = 0.95, className = 'report-table-instance-folio' }) {
    const hasDefaultClassName = className === this.defaultClassName;
    this.paperSize = paperSize;
    this.startingFolio = startingFolio;
    this.currentFolio = startingFolio;
    this.tableId = tableId;
    this.table = document.getElementById(tableId);
    this.orientation = orientation;
    this.gapTolerance = 1 - gapTolerance;
    this.className = className;
    this.cssClassString = `
      .${this.defaultClassName}::before {
        content: attr(data-folio);
        position: relative;
        top: 0;
        left: 0;
        font-size: 14px;
        padding: 8px;
        color: black;
        font-weight: bolder;
      }
      .${this.defaultClassName} {
        padding-top: ${margin}cm;
        padding-left: ${margin}cm;
        padding-right: ${margin}cm;
      }`;

    if (hasDefaultClassName) {
      this.__addCssToHTMLDocument();
    }

    if (orientation === 'LANDSCAPE') {
      this.pageWidth = Page.getPageHeight(paperSize);
      this.pageHeight = Page.getPageWidth(paperSize);
    } else {
      this.pageWidth = Page.getPageWidth(paperSize);
      this.pageHeight = Page.getPageHeight(paperSize);
    }

    this.margin = hasDefaultClassName ? margin * 10 : 1; // convert cm to mm
    this.table.style.width = `${this.pageWidth - (this.__getMarginInPx() * 2)}px`;
    this.tableHeader = this.table.querySelectorAll('thead')[0];
    this.tableBody = this.table.querySelectorAll('tbody')[0];
    this.headerHeight = this.tableHeader.offsetHeight;
    this.bodyHeight = this.tableBody.offsetHeight;
    this.pendingRows = [...this.tableBody.querySelectorAll('tr')];
    this.newTablesList = [];
    console.log('ReportTable:', {tableId, paperSize, startingFolio, orientation, margin, marginInPx: this.__getMarginInPx(), tableHeight: this.table.offsetHeight, paramGapTolerance: gapTolerance, className});
    this.table.style.width = '';
  }

  __addCssToHTMLDocument = () => {
    const style = document.createElement('style');
    style.innerHTML = this.cssClassString;
    if (!document.head.innerHTML.includes(this.defaultClassName)) {
      document.head.appendChild(style);
    }
  }

  getTableElement = () => this.table;

  hideTable = () => {
    this.table.style.display = 'none';
  }

  showTable = () => {
    this.table.style.display = '';
  }

  __getMarginInPx = () => {
    const winDPI = Page.getScreenDPI();
    return Math.ceil(Page.mmToPx(this.margin, winDPI));
  }

  __getInitialTableHeight = () => {
    const marginInPx = this.__getMarginInPx();
    return Math.ceil(this.headerHeight + (marginInPx * 2));
  }

  __getPageContainer = () => {
    const container = document.createElement('div');
    container.classList.add(this.className);
    container.id = `page_${this.currentFolio}`;
    container.setAttribute('data-folio', this.currentFolio);
    container.style.height = `${this.pageHeight}px`;
    container.style.width = `${this.pageWidth}px`;

    return container;
  }

  __generateTable = () => {
    const newTable = document.createElement('table');
    const newTableBody = document.createElement('tbody');

    newTable.classList = [...this.table.classList];
    newTable.appendChild(this.tableHeader.cloneNode(true));

    let newTableBodyHeight = this.__getInitialTableHeight();
    const maxTableBody = Math.ceil(this.pageHeight - newTableBodyHeight + (this.pendingRows?.reduce((acc, row) => acc + row.offsetHeight, 0) / this.pendingRows.length));

    let row = this.pendingRows.length && this.pendingRows.shift();
    do {
      newTableBody.appendChild(row.cloneNode(true));
      newTableBodyHeight += row.offsetHeight;

      row = this.pendingRows.shift();
    } while (newTableBodyHeight + row?.offsetHeight < maxTableBody - (maxTableBody * this.gapTolerance) && this.pendingRows.length > 0);
    row && newTableBody.appendChild(row.cloneNode(true));

    newTable.appendChild(newTableBody);

    return newTable;
  }

  __addPageToDocument = () => {
    const container = this.__getPageContainer();
    const newTable = this.__generateTable();
    container.appendChild(newTable);
    document.body.appendChild(container);
    this.newTablesList.push(container);
    this.currentFolio += 1;
  }

  format = (afterFormatCallback) => {

    while (this.pendingRows.length > 0) {
      this.__addPageToDocument();
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