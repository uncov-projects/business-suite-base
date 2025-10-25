const { contextBridge, ipcRenderer } = require('electron');

// Expose APIs securely
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, func),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  },

  focusWindow: () => ipcRenderer.send('focus-window'),
  printMemo: (htmlContent, filename) =>
    ipcRenderer.invoke('print-memo', htmlContent, filename),

  // User: Registration and Login
  registerUser: (user) => ipcRenderer.invoke('register-user', user),
  loginUser: (credentials) => ipcRenderer.invoke('login-user', credentials),

  // Sales: Add and Fetch All
  // Sales table
  addSale: (sale) => ipcRenderer.invoke('add-sale', sale),
  getAllSales: () => ipcRenderer.invoke('get-all-sales'),

  addCustomer: (customer) => ipcRenderer.invoke('add-customer', customer),
  getAllCustomers: () => ipcRenderer.invoke('get-all-customers'),

  addInventory: (inventory) => ipcRenderer.invoke('add-inventory', inventory),
  getAllInventory: () => ipcRenderer.invoke('get-all-inventory'),

  searchCustomers: (term) => ipcRenderer.invoke('search-customers', term),
  searchInventory: (term) => ipcRenderer.invoke('search-inventory', term),

  addInvoice: (invoiceData) => ipcRenderer.invoke('add-invoice', invoiceData),
  getAllInvoices: () => ipcRenderer.invoke('get-all-invoices'),

  addMemo: (memoData) => ipcRenderer.invoke('add-memo', memoData),
  getAllMemos: () => ipcRenderer.invoke('get-all-memos'),

  getLatestInvoiceNumber: () => ipcRenderer.invoke("get-latest-invoice-number"),
  getLatestMemoNumber: () => ipcRenderer.invoke("get-latest-memo-number"),
  getLatestSaleNumber: () => ipcRenderer.invoke("get-latest-sale-number"),
  getLatestItemNumber: () => ipcRenderer.invoke("get-latest-item-number"),

  addSoldItem: (item) => ipcRenderer.invoke('add-sold-item', item),

  updateInventoryAfterSales: () => ipcRenderer.invoke('update-inventory-after-sale'),
  getStockOverviewCounts: () => ipcRenderer.invoke("get-stock-overview-counts"),

  updateAllOverdues: () => ipcRenderer.invoke("update-all-overdues"),

  promptExportFormat: () => ipcRenderer.invoke('prompt-export-format'),
  exportSalesExcel: (data) => ipcRenderer.invoke('export-sales-excel', data),
  exportInventoryExcel: (data) => ipcRenderer.invoke('export-inventory-excel', data),
  exportInvoicesExcel: (data) => ipcRenderer.invoke('export-invoices-excel', data),

  updateInventoryOrderStatusAuto: () => ipcRenderer.invoke('update-order-status-auto'),
  getAllDebtors: () => ipcRenderer.invoke('get-all-debtors'),
  getOpenSalesByCustomer: (id) => ipcRenderer.invoke('get-open-sales-customer', id),

  fetchMemoData: (number) => ipcRenderer.invoke('fetch-memo-data', number),
  fetchMemoItems: (number) => ipcRenderer.invoke('fetch-memo-items', number),

  updateInventoryItem: (data) => ipcRenderer.invoke('update-inventory-item', data),
  updateInvoice: (updatedInvoice) => ipcRenderer.invoke('update-invoice', updatedInvoice),
  updateMemo: (updatedInvoice) => ipcRenderer.invoke('update-memo', updatedInvoice),

  getAllCategories: () => ipcRenderer.invoke("get-categories"),
  getAllUnits: () => ipcRenderer.invoke("get-units"),

  fetchInvoiceData: (number) => ipcRenderer.invoke('fetch-invoice-data', number),
  fetchInvoiceItems: (number) => ipcRenderer.invoke('fetch-invoice-items', number),

  addCategory: (name) => ipcRenderer.invoke("add-category", name),
  addUnit: (name) => ipcRenderer.invoke("add-unit", name),

  deleteCategories: (names) => ipcRenderer.invoke("delete-categories", names),
  deleteUnits: (names) => ipcRenderer.invoke("delete-units", names),

  deleteInventory: (code) => ipcRenderer.invoke("delete-inventory-item", code),

  backupDatabase: () => ipcRenderer.invoke("backup-database"),
  restoreDatabase: () => ipcRenderer.invoke("restore-database"),

  showNativeMessageBox: (options) =>
    ipcRenderer.invoke("show-native-message-box", options),

  getSalesMetrics: () => ipcRenderer.invoke("get-sales-metrics"),
  getOutstandingMetrics: () => ipcRenderer.invoke("get-outstanding-metrics"),
  getFastestMovingItems: () => ipcRenderer.invoke("get-fastest-moving-items"),
  getStockReorderDashboardData: () => ipcRenderer.invoke("get-stock-reorder-dashboard-data"),
  getRecentTransactions: () => ipcRenderer.invoke("get-recent-transactions"),
  getMostFrequentBuyers: () => ipcRenderer.invoke("get-most-frequent-buyers"),
  getInvoiceMemoTrends: () => ipcRenderer.invoke("get-invoice-memo-trends"),
  getOverdueCustomers: () => ipcRenderer.invoke("get-overdue-customers"),

  getAllNotes: () => ipcRenderer.invoke('get-all-notes'),
  addNote: (note) => ipcRenderer.invoke("add-note", note),
  updateNote: (id, note) => ipcRenderer.invoke("update-note", { id, note }),
  deleteNote: (id) => ipcRenderer.invoke("delete-note", id),
  getNotesByIds: (noteIdsString) => ipcRenderer.invoke('get-notes-by-ids', noteIdsString),

  cleanCustomerTable: () => ipcRenderer.invoke("clean-customer-table"),
  cleanInventoryTable: () => ipcRenderer.invoke("clean-inventory-table"),
  cleanMemoData: () => ipcRenderer.invoke("clean-memo-data"),
  cleanSaleData: () => ipcRenderer.invoke("clean-sale-data"),
});