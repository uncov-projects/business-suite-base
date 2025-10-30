// electron.cjs

const { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut } = require('electron');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const XLSX = require("xlsx");
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const os = require('os');
const { spawn } = require('child_process');


const logPath = path.join(app.getPath('userData'), 'startup.log');
fs.writeFileSync(logPath, 'App started\n');

process.on('uncaughtException', (err) => {
  fs.appendFileSync(logPath, `Uncaught Exception: ${err}\n`);
});

// 📌 Import the database factory function (not instance yet)
const databaseFactory = require('./database.cjs');

const license = require("./license.cjs");
const licensePreloadPath = path.join(app.getAppPath(), "preload-license.cjs");
const licenseHtmlPath = path.join(app.getAppPath(), "public", "license.html");

console.log("License Preload Path:", licensePreloadPath);
console.log("License HTML Path:", licenseHtmlPath);

ipcMain.on("submit-license", (event, inputKey) => {
  console.log("License submitted:", inputKey);
  const result = license.checkAndSaveLicense(inputKey);
  console.log("License check result:", result);

  if (result) {
    licenseWindow.close(); // opens the main app window
  } else {
    event.sender.send("license-invalid");
  }
});

let licenseWindow;
async function showLicenseWindow() {
  return new Promise((resolve) => {
    licenseWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      resizable: false,
      frame: true,
      webPreferences: {
        preload: licensePreloadPath,
        contextIsolation: true,
      },
    });

    licenseWindow.loadFile(licenseHtmlPath);
    licenseWindow.setMenuBarVisibility(false);

    licenseWindow.on("closed", () => {
      resolve(false);
    });
  });
}


let databaseInstance;

let win;

function createWindow() {
  fs.appendFileSync(logPath, 'createWindow() called.\n');

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreenable: true,
    maximizable: true,
    minimizable: true,
    frame: true,
    icon: path.join(__dirname, 'build', 'uNCov.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: true
    }
  });

  if (process.env.NODE_ENV === 'development') {
    fs.appendFileSync(logPath, 'Loading dev server...\n');
    win.loadURL('http://localhost:5173/').then(() => {
      fs.appendFileSync(logPath, 'Dev server loaded successfully.\n');
    }).catch(err => {
      fs.appendFileSync(logPath, `Error loading dev server: ${err}\n`);
    });
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    fs.appendFileSync(logPath, `Loading production index: ${indexPath}\n`);
    win.loadFile(indexPath).then(() => {
      fs.appendFileSync(logPath, 'Production index.html loaded successfully.\n');
    }).catch(err => {
      fs.appendFileSync(logPath, `Error loading index.html: ${err}\n`);
    });
    // win.webContents.openDevTools();
  }

  // Focus handling on load complete
  win.webContents.on('did-finish-load', () => {
    fs.appendFileSync(logPath, 'did-finish-load fired. Focusing window.\n');
    win.focus();
    win.webContents.focus();
  });

  win.on('enter-full-screen', () => {
    console.log('Entered fullscreen');
  });

  win.on('leave-full-screen', () => {
    console.log('Exited fullscreen');
  });

  win.on('close', () => {
    console.log('Window close requested.');
  });

  win.on('closed', () => {
    win = null;
  });
}


app.whenReady().then(async () => {
  const userDataPath = app.getPath('userData');
  const isPackaged = app.isPackaged;
  const basePath = isPackaged ? path.join(process.resourcesPath, 'app.asar.unpacked') : __dirname;
  const defaultDbPath = path.join(basePath, 'users.db');
  const dbPath = path.join(userDataPath, 'users.db');

  fs.appendFileSync(logPath, `Default DB Path: ${defaultDbPath}\n`);
  fs.appendFileSync(logPath, `UserData DB Path: ${dbPath}\n`);

  if (!fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(defaultDbPath, dbPath);
      fs.appendFileSync(logPath, `Copied DB to: ${dbPath}\n`);
    } catch (err) {
      fs.appendFileSync(logPath, `Error copying DB: ${err}\n`);
    }
  } else {
    fs.appendFileSync(logPath, 'Database already exists, no copy needed.\n');
  }

  try {
    databaseInstance = databaseFactory(dbPath);
    fs.appendFileSync(logPath, 'Database instance created successfully.\n');
  } catch (err) {
    fs.appendFileSync(logPath, `Error initializing database instance: ${err}\n`);
  }

  fs.appendFileSync(logPath, 'App whenReady fired\n');

  if (!license.verifyStoredLicense()) {
    const isValid = await showLicenseWindow();
    if (!isValid) return app.quit();
  }

  try {
    createWindow();
    fs.appendFileSync(logPath, 'Main window created.\n');
  } catch (err) {
    fs.appendFileSync(logPath, `Error creating window: ${err}\n`);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      const win = BrowserWindow.getAllWindows()[0];
      if (win) {
        win.show();
        win.focus();
      }
    }
  });

  globalShortcut.register('Escape', () => {
    if (win && win.isFullScreen()) {
      win.setFullScreen(false);
    }
  });


  ipcMain.handle("backup-database", async () => {
    const logPath = path.join(app.getPath('userData'), 'startup.log');
    fs.appendFileSync(logPath, 'Backup operation started.\n');

    const { filePath } = await dialog.showSaveDialog({
      title: "Select Backup Destination",
      defaultPath: `backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: "SQLite Database", extensions: ["db"] }],
    });

    if (!filePath) {
      fs.appendFileSync(logPath, 'Backup cancelled by user.\n');
      return { success: false };
    }

    await databaseInstance.closeDatabase();
    fs.appendFileSync(logPath, 'Database connection closed before backup.\n');

    const sourcePath = path.join(userDataPath, "users.db");
    fs.copyFileSync(sourcePath, filePath);
    fs.appendFileSync(logPath, `Database backed up to ${filePath}\n`);

    databaseInstance = databaseFactory(sourcePath);
    fs.appendFileSync(logPath, 'Database connection reopened after backup.\n');

    return { success: true, backupPath: filePath };
  });


  ipcMain.handle("restore-database", async () => {
    const logPath = path.join(app.getPath("userData"), "startup.log");
    fs.appendFileSync(logPath, "Restore operation started.\n");

    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Select Backup File to Restore",
      filters: [{ name: "SQLite Database", extensions: ["db"] }],
      properties: ["openFile"],
    });

    if (canceled || filePaths.length === 0) {
      fs.appendFileSync(logPath, "Restore cancelled by user.\n");
      return { success: false };
    }

    const backupFilePath = filePaths[0];
    const destPath = path.join(userDataPath, "users.db");

    const { response } = await dialog.showMessageBox({
      type: "warning",
      buttons: ["Cancel", "Restore"],
      defaultId: 1,
      cancelId: 0,
      title: "Confirm Restore",
      message: "This will overwrite your existing database. Are you sure you want to continue?",
    });

    if (response !== 1) {
      fs.appendFileSync(logPath, "Restore cancelled at confirmation dialog.\n");
      return { success: false };
    }

    try {
      await databaseInstance.closeDatabase();
      fs.appendFileSync(logPath, "Database connection closed before restore.\n");

      fs.copyFileSync(backupFilePath, destPath);
      fs.appendFileSync(logPath, `Database restored from ${backupFilePath}\n`);

      // Reopen restored DB directly using raw sqlite3 for migration
      const rawDb = new sqlite3.Database(destPath);

      const dbAll = promisify(rawDb.all).bind(rawDb);
      const dbRun = promisify(rawDb.run).bind(rawDb);

      const inventoryCols = await dbAll(`PRAGMA table_info(inventory);`);
      const inventoryHasHsn = inventoryCols.some(col => col.name === "hsn_code");
      if (!inventoryHasHsn) {
        await dbRun(`ALTER TABLE inventory ADD COLUMN hsn_code TEXT DEFAULT 'NA';`);
        fs.appendFileSync(logPath, "Added hsn_code column to inventory table.\n");
      }

      const sold_itemsCols = await dbAll(`PRAGMA table_info(sold_items);`);
      const sold_itemsHasHsn = sold_itemsCols.some(col => col.name === "hsn_code");
      if (!sold_itemsHasHsn) {
        await dbRun(`ALTER TABLE sold_items ADD COLUMN hsn_code TEXT DEFAULT 'NA';`);
        fs.appendFileSync(logPath, "Added hsn_code column to sold_items table.\n");
      }

      // Close raw DB
      rawDb.close();

      // Now rebind the full app instance
      databaseInstance = databaseFactory(destPath);
      fs.appendFileSync(logPath, "Database connection reopened after restore.\n");

      return { success: true, restoredFrom: backupFilePath };
    } catch (err) {
      fs.appendFileSync(logPath, `Restore failed: ${err.message}\n`);
      return { success: false, error: err.message };
    }
  });
});



// IPC handlers

// To handle Registration
ipcMain.handle('register-user', (event, newUser) => {
  return databaseInstance.registerUser(newUser);
});

// To handle Login
ipcMain.handle('login-user', (event, { email, password }) => {
  return databaseInstance.loginUser(email, password);
});

// To handle Sale: Add
ipcMain.handle('add-sale', (event, sale) => {
  return databaseInstance.addSale(sale);
});

// To handle Sale: Fetch All
ipcMain.handle('get-all-sales', () => {
  return databaseInstance.getAllSales();
});

// To handle Customer: Add
ipcMain.handle('add-customer', (event, customer) => {
  return databaseInstance.addCustomer(customer);
});

// To handle Customer: Fetch All
ipcMain.handle('get-all-customers', () => {
  return databaseInstance.getAllCustomers();
});

// To handle Customer: Add
ipcMain.handle('add-inventory', (event, inventory) => {
  return databaseInstance.addInventory(inventory);
});

// To handle Customer: Fetch All
ipcMain.handle('get-all-inventory', () => {
  return databaseInstance.getAllInventory();
});

ipcMain.handle('search-customers', (event, searchTerm) => {
  return databaseInstance.searchCustomers(searchTerm);
});

ipcMain.handle('add-invoice', (event, invoiceData) => {
  return databaseInstance.addInvoice(invoiceData);
});

ipcMain.handle('get-all-invoices', () => {
  return databaseInstance.getAllInvoices();
});

ipcMain.handle('add-memo', (event, memoData) => {
  return databaseInstance.addMemo(memoData);
});

ipcMain.handle('get-all-memos', () => {
  return databaseInstance.getAllMemos();
});

ipcMain.handle("get-latest-invoice-number", async () => {
  return await databaseInstance.getLatestInvoiceNumber();
});

ipcMain.handle("get-latest-memo-number", async () => {
  return await databaseInstance.getLatestMemoNumber();
});

ipcMain.handle("get-latest-item-number", async () => {
  return await databaseInstance.getLatestItemNumber();
});

ipcMain.handle("get-latest-sale-number", async () => {
  return await databaseInstance.getLatestSaleNumber();
});

ipcMain.handle('add-sold-item', async (event, item) => {
  return await databaseInstance.addSoldItem(item);
});

ipcMain.handle('search-inventory', (event, searchTerm) => {
  return databaseInstance.searchInventory(searchTerm);
});

ipcMain.handle("update-inventory-after-sale", async () => {
  return await databaseInstance.updateInventoryAfterSales();
});

ipcMain.handle("get-stock-overview-counts", () => {
  return databaseInstance.getStockOverviewCounts();
});

ipcMain.handle("update-all-overdues", () => {
  return databaseInstance.updateAllOverdues();
});

ipcMain.handle('prompt-export-format', async () => {
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Export to Excel', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
    title: 'Export Format',
    message: 'Export the data in Excel Format',
  });

  return response === 0 ? 'excel' : null;
});


ipcMain.handle('export-sales-excel', async (event, salesData) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save Sales Report as Excel',
    defaultPath: path.join(__dirname, 'sales-report.xlsx'),
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
  });

  if (canceled) return { canceled: true };

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    const titleFont = { name: 'Arial', size: 20, bold: true };
    const subtitleFont = { name: 'Arial', size: 18, bold: true };
    const labelFont = { name: 'Arial', size: 11, bold: true };

    const columnCount = 9; // Match data columns

    // --- Title Row ---
    worksheet.mergeCells(`A1:I1`);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Rambharose Iron Stores';
    titleCell.font = titleFont;
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // --- Subtitle Row ---
    worksheet.mergeCells(`A2:I2`);
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = 'Sales Summary Report';
    subtitleCell.font = subtitleFont;
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // --- Generated On Row ---
    worksheet.mergeCells(`A3:B3`);
    const generatedOnLabel = worksheet.getCell('A3');
    generatedOnLabel.value = 'Generated On:';
    generatedOnLabel.font = labelFont;

    const generatedOnValue = worksheet.getCell('C3');
    generatedOnValue.value = new Date().toLocaleString();

    worksheet.addRow([]); // Empty row (Row 4)

    // --- Table Header ---
    const header = [
      'Unique ID',
      'Customer Name',
      'Total',
      'Amount Paid',
      'Balance',
      'Status',
      'Issue Date',
      'Due Date',
      'Type',
    ];
    const headerRow = worksheet.addRow(header);

    // Style the header
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' },
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // --- Data Rows ---
    salesData.forEach(sale => {
      worksheet.addRow([
        sale.unique_number,
        sale.customer_name,
        sale.total,
        sale.amount_paid,
        sale.balance,
        sale.status,
        sale.issueDate,
        sale.dueDate,
        sale.type,
      ]);
    });

    // --- Add Totals Row ---
    const totalSum = salesData.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const paidSum = salesData.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);
    const balanceSum = salesData.reduce((sum, s) => sum + Number(s.balance || 0), 0);

    const totalRow = worksheet.addRow([
      'Total', '', totalSum, paidSum, balanceSum, '', '', '', ''
    ]);

    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
      if ([3, 4, 5].includes(colNumber)) {
        cell.alignment = { horizontal: 'right' };
      }
    });

    // --- Auto column width ---
    worksheet.columns.forEach(col => {
      let max = 0;
      col.eachCell({ includeEmpty: true }, c => {
        const v = c.value ? c.value.toString().length : 10;
        max = Math.max(max, v);
      });
      col.width = max + 2;
    });

    await workbook.xlsx.writeFile(filePath);
    return { success: true, filePath };

  } catch (err) {
    console.error('Excel Export Error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('export-invoices-excel', async (event, invoicesData) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save Invoices Report as Excel',
    defaultPath: path.join(__dirname, 'invoice-report.xlsx'),
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
  });

  if (canceled) return { canceled: true };

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice Report');

    const titleFont = { name: 'Arial', size: 20, bold: true };
    const subtitleFont = { name: 'Arial', size: 18, bold: true };
    const labelFont = { name: 'Arial', size: 11, bold: true };

    const columnCount = 8; // Match data columns

    // --- Title Row ---
    worksheet.mergeCells(`A1:H1`);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Rambharose Iron Stores';
    titleCell.font = titleFont;
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // --- Subtitle Row ---
    worksheet.mergeCells(`A2:H2`);
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = 'Invoices Summary Report';
    subtitleCell.font = subtitleFont;
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // --- Generated On Row ---
    worksheet.mergeCells(`A3:B3`);
    const generatedOnLabel = worksheet.getCell('A3');
    generatedOnLabel.value = 'Generated On:';
    generatedOnLabel.font = labelFont;

    const generatedOnValue = worksheet.getCell('C3');
    generatedOnValue.value = new Date().toLocaleString();

    worksheet.addRow([]); // Empty row (Row 4)

    // --- Table Header ---
    const header = [
      'Unique ID',
      'Customer Name',
      'Total',
      'Amount Paid',
      'Balance',
      'Status',
      'Issue Date',
      'Due Date',
    ];
    const headerRow = worksheet.addRow(header);

    // Style the header
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' },
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // --- Data Rows ---
    invoicesData.forEach(invoice => {
      worksheet.addRow([
        invoice.invoice_number,
        invoice.customer_name,
        invoice.total,
        invoice.amount_paid,
        invoice.balance,
        invoice.status,
        invoice.issueDate,
        invoice.dueDate
      ]);
    });

    // --- Add Totals Row ---
    const totalSum = invoicesData.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const paidSum = invoicesData.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);
    const balanceSum = invoicesData.reduce((sum, s) => sum + Number(s.balance || 0), 0);

    const totalRow = worksheet.addRow([
      'Total', '', totalSum, paidSum, balanceSum, '', '', ''
    ]);

    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
      if ([3, 4, 5].includes(colNumber)) {
        cell.alignment = { horizontal: 'right' };
      }
    });

    // --- Auto column width ---
    worksheet.columns.forEach(col => {
      let max = 0;
      col.eachCell({ includeEmpty: true }, c => {
        const v = c.value ? c.value.toString().length : 10;
        max = Math.max(max, v);
      });
      col.width = max + 2;
    });

    await workbook.xlsx.writeFile(filePath);
    return { success: true, filePath };

  } catch (err) {
    console.error('Excel Export Error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('update-order-status-auto', () => {
  return databaseInstance.updateInventoryOrderStatusAuto();
});

ipcMain.handle('get-all-debtors', () => {
  return databaseInstance.getAllDebtors();
});

ipcMain.handle('get-open-sales-customer', (event, customerId) => {
  return databaseInstance.getOpenSalesByCustomer(customerId);
});

ipcMain.handle('fetch-memo-data', (event, memoNumber) => {
  return databaseInstance.fetchMemoData(memoNumber);
});

ipcMain.handle('fetch-memo-items', (event, memoNumber) => {
  return databaseInstance.fetchMemoItems(memoNumber);
});

ipcMain.handle('update-inventory-item', (event, updatedData) => {
  return databaseInstance.updateInventoryItem(updatedData);
});


ipcMain.handle('export-inventory-excel', async (event, inventoryData) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save Inventory as Excel',
    defaultPath: path.join(__dirname, 'Inventory Details.xlsx'),
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
  });

  if (canceled) return { canceled: true };

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory Details');

    const titleFont = { name: 'Arial', size: 20, bold: true };
    const subtitleFont = { name: 'Arial', size: 18, bold: true };
    const labelFont = { name: 'Arial', size: 11, bold: true };

    const columnCount = 7; // Match data columns

    // --- Title Row ---
    worksheet.mergeCells(`A1:G1`);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Rambharose Iron Stores';
    titleCell.font = titleFont;
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // --- Subtitle Row ---
    worksheet.mergeCells(`A2:G2`);
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = 'Inventory Details';
    subtitleCell.font = subtitleFont;
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // --- Generated On Row ---
    worksheet.mergeCells(`A3:B3`);
    const generatedOnLabel = worksheet.getCell('A3');
    generatedOnLabel.value = 'Generated On:';
    generatedOnLabel.font = labelFont;

    const generatedOnValue = worksheet.getCell('C3');
    generatedOnValue.value = new Date().toLocaleString();

    worksheet.addRow([]); // Empty row (Row 4)

    // --- Table Header ---
    const header = [
      'Item Code',
      'Item Name',
      'Unit',
      'Cost Price',
      'Stock',
      'Reorder Level',
      'Category',
    ];
    const headerRow = worksheet.addRow(header);

    // Style the header
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' },
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // --- Data Rows ---
    inventoryData.forEach(item => {
      worksheet.addRow([
        item.item_code,
        item.item_name,
        item.unit,
        (item.cost.toFixed(2)),
        (item.quantity.toFixed(2)),
        (item.reorder_level.toFixed(2)),
        item.category,
      ]);
    });

    // --- Auto column width ---
    worksheet.columns.forEach(col => {
      let max = 0;
      col.eachCell({ includeEmpty: true }, c => {
        const v = c.value ? c.value.toString().length : 10;
        max = Math.max(max, v);
      });
      col.width = max + 2;
    });

    await workbook.xlsx.writeFile(filePath);
    return { success: true, filePath };

  } catch (err) {
    console.error('Excel Export Error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('update-invoice', (event, updatedInvoice) => {
  return databaseInstance.updateInvoiceAndSales(updatedInvoice);
});

ipcMain.handle('update-memo', (event, updatedInvoice) => {
  return databaseInstance.updateMemoAndSales(updatedInvoice);
});

ipcMain.handle('get-categories', async () => {
  return await databaseInstance.getAllCategories();
});

ipcMain.handle("get-units", async () => {
  return await databaseInstance.getAllUnits();
});


ipcMain.handle("open-file-dialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Import inventory from Excel IPC
ipcMain.handle("import-inventory-file", async (event, filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  range.s.r = 4;
  sheet["!ref"] = XLSX.utils.encode_range(range);

  const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  for (const item of data) {
    const itemCode = (item["Item Code"] || "").trim();
    if (itemCode) {
      const mappedItem = {
        item_code: itemCode,
        item_name: (item["Item Name"] || "").trim(),
        unit: (item["Unit"] || "").trim(),
        cost: parseFloat(item["Cost Price"]) || 0,
        stock: parseFloat(item["Stock"]) || 0,
        reorder_level: parseFloat(item["Reorder Level"]) || 0,
        category: (item["Category"] || "").trim()
      };

      console.log("Importing item:", mappedItem);
      await databaseInstance.upsertInventoryItem(mappedItem);
    } else {
      console.log("Skipped row with empty Item Code:", item);
    }
  }

  return true;
});

ipcMain.handle('fetch-invoice-data', (event, invoiceNumber) => {
  return databaseInstance.fetchInvoiceData(invoiceNumber);
});

ipcMain.handle('fetch-invoice-items', (event, invoiceNumber) => {
  return databaseInstance.fetchInvoiceItems(invoiceNumber);
});


ipcMain.handle("add-category", async (event, name) => {
  return await databaseInstance.addCategory(name);
});

ipcMain.handle("add-unit", async (event, name) => {
  return await databaseInstance.addUnit(name);
});

ipcMain.handle("delete-categories", async (event, names) => {
  return await databaseInstance.deleteCategories(names);
});

ipcMain.handle("delete-units", async (event, names) => {
  return await databaseInstance.deleteUnits(names);
});

ipcMain.handle("delete-inventory-item", async (event, code) => {
  return await databaseInstance.deleteInventory(code);
});

ipcMain.on('focus-window', () => {
  if (win) {
    fs.appendFileSync(logPath, 'Focus-window IPC received.\n');
    win.focus();
    win.webContents.focus();
  }
});

ipcMain.handle("show-native-message-box", async (event, options) => {
  const win = BrowserWindow.getFocusedWindow();

  const result = await dialog.showMessageBox(win, {
    type: options.type || "info",
    title: options.title || "Notification",
    message: options.message || "",
    buttons: options.buttons || ["OK"],
    defaultId: 0,
    cancelId: options.cancelId !== undefined ? options.cancelId : -1,
    noLink: true,
  });

  // Safely focus window if available
  if (win) {
    win.focus();
  }

  return result;
});

ipcMain.handle("get-sales-metrics", async () => {
  try {
    const metrics = await databaseInstance.getSalesMetrics();
    return metrics;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("get-outstanding-metrics", async () => {
  try {
    const result = await databaseInstance.getOutstandingMetrics();
    return result;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("get-fastest-moving-items", async () => {
  try {
    const result = await databaseInstance.getFastestMovingItems();
    return result;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("get-stock-reorder-dashboard-data", async () => {
  try {
    const result = await databaseInstance.getStockReorderDashboardData();
    return result;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.on('print-memo', (event, memo_number) => {
  const printWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true
    }
  });

  // ✅ use backticks for template string
  printWindow.loadURL(`http://localhost:5173/invoice/print-memo/memo/${memo_number}`);

  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.openDevTools();
    printWindow.webContents.print({
      silent: false, // false while developing
      printBackground: true,
      pageSize: { width: 105000, height: 148000 }, // A6 in microns
      margins: { marginType: 'none' }
    }, (success, errorType) => {
      if (!success) console.error(errorType);
      printWindow.close();
    });
  });
});


ipcMain.handle("get-recent-transactions", async () => {
  try {
    const result = await databaseInstance.getRecentTransactions();
    return result;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("get-most-frequent-buyers", async () => {
  try {
    const result = await databaseInstance.getMostFrequentBuyers();
    return result;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('get-all-notes', () => {
  return databaseInstance.getAllNotes();
});

ipcMain.handle("clean-customer-table", async () => {
  const logPath = path.join(app.getPath("userData"), "startup.log");
  const log = msg => fs.appendFileSync(logPath, msg + "\n");

  log("Clean customer operation started.");

  const focusedWindow = BrowserWindow.getFocusedWindow();

  const { response } = await dialog.showMessageBox(focusedWindow, {
    type: "warning",
    buttons: ["Cancel", "Delete All"],
    defaultId: 1,
    cancelId: 0,
    title: "Confirm Deletion",
    message: "This will delete all customer records. Are you sure you want to proceed?",
  });

  if (response !== 1) {
    log("Clean customer cancelled by user.");
    return { success: false, message: "Operation cancelled by user." };
  }

  try {
    const result = await databaseInstance.cleanCustomerTable();
    log("Customer table cleaned successfully.");
    return { success: true, message: "Customer table cleaned." };
  } catch (err) {
    log(`Customer table clean failed: ${err.message}`);
    return { success: false, message: err.message };
  }
});

ipcMain.handle("clean-inventory-table", async () => {
  const logPath = path.join(app.getPath("userData"), "startup.log");
  const log = msg => fs.appendFileSync(logPath, msg + "\n");

  log("Clean inventory operation started.");

  const focusedWindow = BrowserWindow.getFocusedWindow();

  const { response } = await dialog.showMessageBox(focusedWindow, {
    type: "warning",
    buttons: ["Cancel", "Delete All"],
    defaultId: 1,
    cancelId: 0,
    title: "Confirm Deletion",
    message: "This will delete all inventory records. Are you sure you want to proceed?",
  });

  if (response !== 1) {
    log("Clean inventory cancelled by user.");
    return { success: false, message: "Operation cancelled by user." };
  }

  try {
    const result = await databaseInstance.cleanInventoryTable();
    log("Inventory table cleaned successfully.");
    return { success: true, message: "Inventory table cleaned." };
  } catch (err) {
    log(`Inventory table clean failed: ${err.message}`);
    return { success: false, message: err.message };
  }
});

ipcMain.handle("clean-memo-data", async () => {
  const logPath = path.join(app.getPath("userData"), "startup.log");
  const log = msg => fs.appendFileSync(logPath, msg + "\n");

  log("Clean memo operation started.");

  const focusedWindow = BrowserWindow.getFocusedWindow();

  const { response } = await dialog.showMessageBox(focusedWindow, {
    type: "warning",
    buttons: ["Cancel", "Delete All"],
    defaultId: 1,
    cancelId: 0,
    title: "Confirm Deletion",
    message: "This will delete all Memo records. Are you sure you want to proceed?",
  });

  if (response !== 1) {
    log("Clean memo cancelled by user.");
    return { success: false, message: "Operation cancelled by user." };
  }

  try {
    const result = await databaseInstance.cleanMemoData();
    log("Memo data cleaned successfully.");
    return { success: true, message: "Memo data cleaned." };
  } catch (err) {
    log(`Memo data clean failed: ${err.message}`);
    return { success: false, message: err.message };
  }
});

ipcMain.handle("clean-sale-data", async () => {
  const logPath = path.join(app.getPath("userData"), "startup.log");
  const log = msg => fs.appendFileSync(logPath, msg + "\n");

  log("Clean sale operation started.");

  const focusedWindow = BrowserWindow.getFocusedWindow();

  const { response } = await dialog.showMessageBox(focusedWindow, {
    type: "warning",
    buttons: ["Cancel", "Delete All"],
    defaultId: 1,
    cancelId: 0,
    title: "Confirm Deletion",
    message: "This will delete all Sale records. Are you sure you want to proceed?",
  });

  if (response !== 1) {
    log("Clean sale cancelled by user.");
    return { success: false, message: "Operation cancelled by user." };
  }

  try {
    const result = await databaseInstance.cleanSaleData();
    log("Sale data cleaned successfully.");
    return { success: true, message: "Sale data cleaned." };
  } catch (err) {
    log(`Sale data clean failed: ${err.message}`);
    return { success: false, message: err.message };
  }
});


function logToFile(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`, 'utf8');
}


ipcMain.handle('print-memo', async (event, htmlContent, fileName = 'memo') => {
  logToFile('--- Print Memo Request Started ---');

  try {
    if (process.platform !== 'win32') {
      logToFile('Error: Print helper only supported on Windows.');
      throw new Error('Print helper only supported on Windows.');
    }

    if (typeof htmlContent !== 'string' || htmlContent.length === 0) {
      logToFile('Error: Invalid HTML content for printing.');
      throw new Error('Invalid HTML content for printing.');
    }

    const safeName = (fileName || 'memo').replace(/[^a-z0-9_\-\.]/gi, '_');
    const tmpDir = os.tmpdir();
    const tmpPath = path.join(tmpDir, `${safeName}.html`);
    fs.writeFileSync(tmpPath, htmlContent, 'utf8');
    logToFile(`Temp HTML file created: ${tmpPath}`);

    const exePath = app.isPackaged
      ? path.join(process.resourcesPath, 'print-helper', 'PrintHelper.exe')
      : path.join(__dirname, 'print-helper', 'PrintHelper.exe');

    logToFile(`Resolved exe path: ${exePath}`);

    if (!fs.existsSync(exePath)) {
      logToFile(`Error: Print helper not found at ${exePath}`);
      try { fs.unlinkSync(tmpPath); } catch (e) { }
      throw new Error(`Print helper not found: ${exePath}`);
    }

    return new Promise((resolve, reject) => {
      logToFile('Spawning PrintHelper.exe...');

      // ✅ Changed: removed `windowsHide: true` so the print dialog is not hidden
      const child = spawn(exePath, [tmpPath], { windowsHide: false, detached: true });

      // ✅ New: unref so Electron process doesn't wait for child process to end
      child.unref();

      child.stdout.on('data', (data) => {
        logToFile(`PrintHelper STDOUT: ${data}`);
      });

      child.stderr.on('data', (data) => {
        logToFile(`PrintHelper STDERR: ${data}`);
      });

      child.on('error', (err) => {
        logToFile(`Error spawning PrintHelper: ${err.message}`);
        try { fs.unlinkSync(tmpPath); } catch (e) { }
        reject(err);
      });

      child.on('close', (code) => {
        logToFile(`PrintHelper exited with code ${code}`);

        // ✅ Changed: Delay deletion to ensure print process finishes using the file
        setTimeout(() => {
          try { fs.unlinkSync(tmpPath); } catch (e) { }
        }, 2000);

        if (code === 0) {
          logToFile('Print Memo completed successfully.');
          resolve({ success: true, code });
        } else {
          logToFile('Print Memo failed.');
          reject(new Error(`Print helper exited with code ${code}`));
        }
      });
    });
  } catch (err) {
    logToFile(`Exception: ${err.message}`);
    throw err;
  }
});

ipcMain.handle("get-invoice-memo-trends", async () => {
  try {
    const result = await databaseInstance.getInvoiceMemoTrends();
    return result;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("get-overdue-customers", async () => {
  try {
    const result = await databaseInstance.getOverdueCustomers();
    return result;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("add-note", (event, note) => {
  return databaseInstance.addNote(note);
});

ipcMain.handle("update-note", (event, { id, note }) => {
  return databaseInstance.updateNote(id, note);
});

ipcMain.handle("delete-note", (event, notes_id) => {
  return databaseInstance.deleteNote(notes_id);
});

ipcMain.handle('get-notes-by-ids', (event, noteIdsString) => {
  return databaseInstance.getNotesByIds(noteIdsString);
});

app.on('window-all-closed', () => {
  console.log('All windows closed.');

  // Remove all IPC listeners
  ipcMain.removeAllListeners();
  console.log('All IPC listeners removed.');

  if (databaseInstance && databaseInstance.db) {
    databaseInstance.db.close((err) => {
      if (err) {
        console.error('Error closing DB:', err);
      } else {
        console.log('Database connection closed.');
      }

      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  } else {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});
