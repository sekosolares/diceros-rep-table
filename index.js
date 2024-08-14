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
  constructor({ tableId, paperSize = 'LETTER', startingFolio = 1, orientation = 'PORTRAIT', marginsInMm = 15 }) {
    console.log('ReportTable', tableId, paperSize, startingFolio, orientation, marginsInMm);
    this.paperSize = paperSize;
    this.pageWidth = Page.getPageWidth(paperSize);
    this.pageHeight = Page.getPageHeight(paperSize);
    this.startingFolio = startingFolio;
    this.currentFolio = startingFolio;
    this.tableId = tableId;
    this.table = document.getElementById(tableId);
    this.orientation = orientation;

    this.tableHeader = this.table.querySelectorAll('thead')[0];
    this.tableBody = this.table.querySelectorAll('tbody')[0];
    this.headerHeight = this.tableHeader.offsetHeight;
    this.bodyHeight = this.tableBody.offsetHeight;
    this.pagesToPrint = Math.ceil((this.bodyHeight + this.headerHeight) / this.pageHeight) + 1;
    this.pendingRows = [...this.tableBody.querySelectorAll('tr')];
    this.marginsInMm = marginsInMm;
    this.newTablesList = [];
  }

  getTableElement = () => this.table;

  hideTable = () => {
    this.table.style.display = 'none';
  }

  showTable = () => {
    this.table.style.display = 'table';
  }

  getInitialTableHeight = () => {
    const winDPI = Page.getScreenDPI();
    const marginsInPx = Page.mmToPx(this.marginsInMm, winDPI);
    return this.headerHeight + (marginsInPx * 2);
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

    let newTableHeight = this.getInitialTableHeight();

    for (let idx = 0; idx < this.pendingRows.length; idx++) {
      const row = this.pendingRows[idx];
      if (newTableHeight + row.offsetHeight <= this.pageHeight) {
        newTableBody.appendChild(row.cloneNode(true));
        newTableHeight += row.offsetHeight;
      } else {
        this.pendingRows = this.pendingRows.slice(idx);
        break;
      }
    }

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
    if (this.pagesToPrint === 1) {
      const container = this.getPageContainer();

      container.appendChild(this.table);
      document.body.appendChild(container);
      return;
    }

    for(let i = 0; i < this.pagesToPrint; i++) {
      this.addPageToDocument();
    }

    this.hideTable();
    window.addEventListener('afterprint', () => {
      this.showTable();
      this.newTablesList.forEach(table => {
        document.body.removeChild(table);
      });

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
    console.log(winDPI);
    return this._paperSizeDimensions[paperSize][`${winDPI}DPI`] ?? [404, 404];
  }

  static getPageWidth = (paperSize) => this.getPageSize(paperSize)[0];

  static getPageHeight = (paperSize) => this.getPageSize(paperSize)[1];
}
