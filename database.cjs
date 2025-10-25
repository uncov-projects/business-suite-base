const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { v4: uuidv4 } = require("uuid");

const logPath = path.join(app.getPath('userData'), 'startup.log');

// 📌 Export a factory function accepting dbPath, returns an object of DB operation functions
module.exports = function (dbPath) {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      const msg = `Failed to open database: ${err}\n`;
      console.error(msg);
      fs.appendFileSync(logPath, msg);
    } else {
      const msg = `Database opened at: ${dbPath}\n`;
      console.log(msg);
      fs.appendFileSync(logPath, msg);
    }
  });

  db.serialize(() => {
    // Create "users" table if not exists
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_uuid TEXT NOT NULL,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdTS DATETIME NOT NULL
      )
    `);

    // Create "sales" table if not exists
    db.run(`
      CREATE TABLE IF NOT EXISTS sales (
        sales_id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_uuid TEXT NOT NULL,
        unique_number TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_address TEXT,
        subtotal REAL DEFAULT 0.0,
        gst REAL DEFAULT 0.0,
        gst_number TEXT,
        discount REAL DEFAULT 0.0,
        total REAL NOT NULL,
        amount_paid REAL DEFAULT 0.0,
        balance REAL DEFAULT 0.0,
        status VARCHAR(10) NOT NULL,
        issueDate DATE NOT NULL,
        dueDate DATE NOT NULL,
        paymentMethod VARCHAR(10) NOT NULL,
        type VARCHAR(10) NOT NULL,
        customer_id INTEGER SECONDARY KEY,
        notes_added TEXT DEFAULT '[]',
        createdTS DATETIME NOT NULL,
        updatedTS DATETIME
      )
    `);

    // Create "customer" table if not exist
    db.run(`
      CREATE TABLE IF NOT EXISTS customer (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        phone VARCHAR(20),
        address VARCHAR(255),
        joinDate DATE,
        customerType VARCHAR(50),
        email VARCHAR(100),
        createdTS DATETIME NOT NULL,
        updatedTS DATETIME
      )
    `);

    // Create "inventory" table if not exist
    db.run(`
      CREATE TABLE IF NOT EXISTS inventory (
        item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_code TEXT NOT NULL UNIQUE,
        item_name TEXT NOT NULL,
        category VARCHAR(20) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        quantity REAL NOT NULL,
        reorder_level REAL NOT NULL,
        in_stock VARCHAR(50) NOT NULL,
        cost REAL NOT NULL,
        order_status TEXT NOT NULL,
        createdTS DATETIME NOT NULL,
        updatedTS DATETIME
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS invoice (
        invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_uuid TEXT NOT NULL,
        invoice_number VARCHAR(20) NOT NULL,
        customer_name TEXT NOT NULL,
        customer_address TEXT,
        subtotal REAL DEFAULT 0.0,
        gst REAL DEFAULT 0.0,
        gst_number TEXT,
        discount REAL DEFAULT 0.0,
        total REAL NOT NULL,
        amount_paid REAL DEFAULT 0.0,
        balance REAL DEFAULT 0.0,
        status VARCHAR(10) NOT NULL,
        issueDate DATE NOT NULL,
        dueDate DATE NOT NULL,
        paymentMethod VARCHAR(10) NOT NULL,
        customer_id INTEGER SECONDARY KEY,
        notes_added TEXT DEFAULT '[]',
        createdTS DATETIME NOT NULL,
        updatedTS DATETIME
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS memo (
        memo_id INTEGER PRIMARY KEY AUTOINCREMENT,
        memo_uuid TEXT NOT NULL,
        memo_number VARCHAR(20) NOT NULL,
        customer_name TEXT NOT NULL,
        customer_address TEXT,
        subtotal REAL DEFAULT 0.0,
        gst REAL DEFAULT 0.0,
        discount REAL DEFAULT 0.0,
        total REAL NOT NULL,
        amount_paid REAL DEFAULT 0.0,
        balance REAL DEFAULT 0.0,
        status VARCHAR(10) NOT NULL,
        issueDate DATE NOT NULL,
        dueDate DATE NOT NULL,
        paymentMethod VARCHAR(10) NOT NULL,
        customer_id INTEGER SECONDARY KEY,
        notes_added TEXT DEFAULT '[]',
        createdTS DATETIME NOT NULL,
        updatedTS DATETIME
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS sold_items (
        sold_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sold_item_uuid TEXT NOT NULL,
        unique_number TEXT NOT NULL,
        unique_uuid TEXT NOT NULL,
        description TEXT NOT NULL,
        unit TEXT NOT NULL,
        quantity REAL NOT NULL,
        cost REAL NOT NULL,
        amount REAL NOT NULL,
        item_id INTEGER SECONDARY KEY,
        is_processed BOOLEAN DEFAULT 0,
        createdTS DATETIME NOT NULL
      )`
    );

    db.run(`
      CREATE TABLE IF NOT EXISTS category (
        category_id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_name TEXT NOT NULL,
        createdTS DATETIME NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS units (
        unit_id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_name TEXT NOT NULL,
        createdTS DATETIME NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        notes_id INTEGER PRIMARY KEY AUTOINCREMENT,
        notes_uuid TEXT NOT NULL,
        notes_title TEXT NOT NULL,
        notes_flag INTEGER NOT NULL,
        notes_content TEXT,
        notes_operation TEXT,
        notes_value INTEGER,
        createdTS DATETIME NOT NULL,
        updateTS DATETIME
      )
    `);
  });

  // Register user method
  function registerUser(newUser) {
    return new Promise((resolve, reject) => {
      const { user_uuid, username, email, password } = newUser
      const stmt = db.prepare("INSERT INTO users (user_uuid, username, email, password, createdTS) VALUES (?, ?, ?, ?, datetime())");
      stmt.run(user_uuid, username, email, password, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...newUser });
      });
      stmt.finalize();
    });
  }

  function loginUser(email, password) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE email = ? AND password = ?",
        [email, password],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  // GetAll users method
  function getAllUsers() {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM users", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  //Add sale record
  function addSale(sale) {
    return new Promise((resolve, reject) => {
      const {
        unique_uuid, unique_number, customer_name, customer_address,
        subtotal, gst, discount, total, amount_paid, balance,
        status, issueDate, dueDate, paymentMethod, type,
        customer_id, notes_added, gst_number
      } = sale;

      const stmt = db.prepare(`
      INSERT INTO sales (
        unique_uuid, unique_number, customer_name, customer_address,
        subtotal, gst, discount, total, amount_paid, balance,
        status, issueDate, dueDate, paymentMethod, type,
        customer_id, notes_added, gst_number, createdTS
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime()
      )
    `);

      stmt.run(
        unique_uuid, unique_number, customer_name, customer_address,
        subtotal, gst, discount, total, amount_paid, balance,
        status, issueDate, dueDate, paymentMethod, type,
        customer_id, notes_added, gst_number,
        function (err) {
          if (err) {
            console.error("Error inserting memo:", err); // log the error
            reject(err);
          }
          else resolve({ id: this.lastID, ...sale });
        }
      );
      stmt.finalize();
    });
  }

  // Fetch all sales
  function getAllSales() {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM sales", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  //Add customer record
  function addCustomer(customer) {
    return new Promise((resolve, reject) => {
      const { customer_id, customer_name, phone, address, joinDate, customerType, email } = customer;
      const stmt = db.prepare(`
      INSERT INTO customer (customer_id, customer_name, phone, address, joinDate, customerType, email, createdTS)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime())
    `);
      stmt.run(customer_id, customer_name, phone, address, joinDate, customerType, email, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...customer });
      });
      stmt.finalize();
    });
  }

  // Fetch all Customers
  function getAllCustomers() {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM customer", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }


  //Add customer record
  function addInventory(inventory) {
    return new Promise((resolve, reject) => {
      const { item_code, item_name, category, unit, quantity, reorder_level, in_stock, cost, order_status } = inventory;
      const stmt = db.prepare(`
      INSERT INTO inventory (item_code, item_name, category, unit, quantity, reorder_level, in_stock, cost, order_status, createdTS)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime())
    `);
      stmt.run(item_code, item_name, category, unit, quantity, reorder_level, in_stock, cost, order_status, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...inventory });
      });
      stmt.finalize();
    });
  }

  function getAllInventory() {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM inventory", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  function searchCustomers(searchTerm) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM customer WHERE customer_name LIKE ?`,
        [`${searchTerm}%`],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  function addInvoice(invoiceData) {
    return new Promise((resolve, reject) => {
      const {
        invoice_uuid, invoice_number, customer_name, customer_address,
        subtotal, gst, discount, total, amount_paid, balance,
        status, issueDate, dueDate, paymentMethod, customer_id, notes_added, gst_number
      } = invoiceData;

      const stmt = db.prepare(`
      INSERT INTO invoice (
        invoice_uuid, invoice_number, customer_name, customer_address,
        subtotal, gst, discount, total, amount_paid, balance,
        status, issueDate, dueDate, paymentMethod, customer_id, notes_added,
        gst_number, createdTS
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime()
      )
    `);

      stmt.run(
        invoice_uuid, invoice_number, customer_name, customer_address,
        subtotal, gst, discount, total, amount_paid, balance,
        status, issueDate, dueDate, paymentMethod, customer_id, notes_added,
        gst_number,
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...invoiceData });
        }
      );
      stmt.finalize();
    });
  }

  function getAllInvoices() {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM invoice", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  function addMemo(memoData) {
    return new Promise((resolve, reject) => {
      const { memo_uuid, memo_number, customer_name, customer_address, subtotal, gst, discount, total, amount_paid, balance, status, issueDate, dueDate, paymentMethod, customer_id, notes_added } = memoData;
      const stmt = db.prepare(`
      INSERT INTO memo (memo_uuid, memo_number, customer_name, customer_address, subtotal, gst, discount, total, amount_paid, balance, status, issueDate, dueDate, paymentMethod, customer_id, notes_added, createdTS)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime())
    `);
      stmt.run(memo_uuid, memo_number, customer_name, customer_address, subtotal, gst, discount, total, amount_paid, balance, status, issueDate, dueDate, paymentMethod, customer_id, notes_added, function (err) {
        if (err) {
          console.error("Error inserting memo:", err); // log the error
          reject(err);
        }
        else resolve({ id: this.lastID, ...memoData });
      });
      stmt.finalize();
    });
  }

  function getAllMemos() {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM memo", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  function getLatestInvoiceNumber() {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT invoice_number FROM invoice ORDER BY invoice_id DESC LIMIT 1`,
        (err, row) => {
          if (err) return reject(err);
          let nextNumber = "INV0001";
          if (row && row.invoice_number) {
            const currentNum = parseInt(row.invoice_number.replace("INV", ""), 10);
            const newNum = currentNum + 1;
            nextNumber = `INV${newNum.toString().padStart(4, "0")}`;
          }
          resolve(nextNumber);
        }
      );
    });
  }

  function getLatestMemoNumber() {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT memo_number FROM memo ORDER BY memo_id DESC LIMIT 1`,
        (err, row) => {
          if (err) return reject(err);
          let nextNumber = "MMO0001";
          if (row && row.memo_number) {
            const currentNum = parseInt(row.memo_number.replace("MMO", ""), 10);
            const newNum = currentNum + 1;
            nextNumber = `MMO${newNum.toString().padStart(4, "0")}`;
          }
          resolve(nextNumber);
        }
      );
    });
  }

  function getLatestItemNumber() {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT item_code FROM inventory ORDER BY item_id DESC LIMIT 1`,
        (err, row) => {
          if (err) return reject(err);
          let nextNumber = "#UIN0001";
          if (row && row.item_code) {
            const currentNum = parseInt(row.item_code.replace("#UIN", ""), 10);
            const newNum = currentNum + 1;
            nextNumber = `#UIN${newNum.toString().padStart(4, "0")}`;
          }
          resolve(nextNumber);
        }
      );
    });
  }

  function getLatestSaleNumber() {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT unique_number FROM sales WHERE type = 'Sale' ORDER BY sales_id DESC LIMIT 1`,
        (err, row) => {
          if (err) return reject(err);
          let nextNumber = "SAL0001";
          if (row && row.unique_number) {
            const currentNum = parseInt(row.unique_number.replace("SAL", ""), 10);
            const newNum = currentNum + 1;
            nextNumber = `SAL${newNum.toString().padStart(4, "0")}`;
          }
          resolve(nextNumber);
        }
      );
    });
  }

  function addSoldItem(item) {
    return new Promise((resolve, reject) => {
      const { sold_item_uuid, unique_number, unique_uuid, description, unit, quantity, cost, amount, item_id } = item;
      const stmt = db.prepare(`
      INSERT INTO sold_items (sold_item_uuid, unique_number, unique_uuid, description, unit, quantity, cost, amount, item_id, createdTS)
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime())
    `);
      stmt.run(sold_item_uuid, unique_number, unique_uuid, description, unit, quantity, cost, amount, item_id, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...item });
      });
      stmt.finalize();
    });
  }


  function searchInventory(searchTerm) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM inventory WHERE item_name LIKE ?`,
        [`%${searchTerm}%`],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  function getStockOverviewCounts() {
    return new Promise((resolve, reject) => {
      const query = `
      SELECT
        SUM(CASE WHEN in_stock = 'in stock' THEN 1 ELSE 0 END) AS inStock,
        SUM(CASE WHEN in_stock = 'low on stock' THEN 1 ELSE 0 END) AS lowStock,
        SUM(CASE WHEN in_stock = 'out of stock' THEN 1 ELSE 0 END) AS outOfStock
      FROM inventory;
    `;

      db.get(query, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }



  function updateInventoryAfterSales() {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const updateInventorySQL = `
        UPDATE inventory
        SET 
          quantity = quantity - (
            SELECT COALESCE(SUM(quantity), 0)
            FROM sold_items
            WHERE sold_items.item_id = inventory.item_id AND is_processed = 0
          ),
          in_stock = CASE 
            WHEN (
              quantity - (
                SELECT COALESCE(SUM(quantity), 0)
                FROM sold_items
                WHERE sold_items.item_id = inventory.item_id AND is_processed = 0
              )
            ) <= 0 THEN 'out of stock'
            WHEN (
              quantity - (
                SELECT COALESCE(SUM(quantity), 0)
                FROM sold_items
                WHERE sold_items.item_id = inventory.item_id AND is_processed = 0
              )
            ) <= reorder_level THEN 'low on stock'
            ELSE 'in stock'
          END,
          updatedTS = CURRENT_TIMESTAMP
        WHERE EXISTS (
          SELECT 1
          FROM sold_items
          WHERE sold_items.item_id = inventory.item_id
            AND is_processed = 0
        );
      `;

        const markSoldItemsProcessedSQL = `
        UPDATE sold_items
        SET is_processed = 1
        WHERE is_processed = 0;
      `;

        // Run the first query
        db.run(updateInventorySQL, function (err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }

          // Run the second query
          db.run(markSoldItemsProcessedSQL, function (err2) {
            if (err2) {
              db.run('ROLLBACK');
              return reject(err2);
            }

            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                return reject(commitErr);
              }
              resolve({ changes: this.changes });
            });
          });
        });
      });
    });
  }


  let isUpdatingOverdues = false;

  function updateAllOverdues() {
    return new Promise((resolve, reject) => {
      if (isUpdatingOverdues) {
        return resolve("Skipped: Update already in progress");
      }

      isUpdatingOverdues = true;

      db.run("BEGIN TRANSACTION", (beginErr) => {
        if (beginErr) {
          isUpdatingOverdues = false;
          return reject(`Error starting transaction: ${beginErr.message}`);
        }

        const tables = ['sales', 'invoice', 'memo'];
        let completed = 0;
        let hasError = false;

        tables.forEach(table => {
          const query = `
          UPDATE ${table}
          SET status = 'Overdue', updatedTS = datetime()
          WHERE status = 'Unpaid'
          AND (
            substr(dueDate, 7, 4) || '-' || substr(dueDate, 4, 2) || '-' || substr(dueDate, 1, 2)
          ) < date('now', '+5 hours', '30 minutes')
        `;

          db.run(query, (err) => {
            if (hasError) return;

            if (err) {
              hasError = true;
              db.run("ROLLBACK", () => {
                isUpdatingOverdues = false;
                reject(`Error updating ${table}: ${err.message}`);
              });
              return;
            }

            completed += 1;

            if (completed === tables.length) {
              db.run("COMMIT", (commitErr) => {
                isUpdatingOverdues = false;
                if (commitErr) {
                  return reject(`Error committing transaction: ${commitErr.message}`);
                }
                resolve("Overdue statuses updated successfully.");
              });
            }
          });
        });
      });
    });
  }

  function updateInventoryOrderStatusAuto() {
    return new Promise((resolve, reject) => {
      const query = `
      UPDATE inventory
      SET 
        in_stock = CASE
          WHEN quantity = 0 THEN 'out of stock'
          WHEN quantity <= reorder_level THEN 'low on stock'
          ELSE 'in stock'
        END,
        order_status = CASE
          WHEN (
            (quantity = 0 OR quantity <= reorder_level)
            AND order_status = 'Not required'
          ) THEN 'Not ordered'
          ELSE order_status
        END;`
        ;

      db.get(query, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  function getAllDebtors() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT 
    c.customer_id,
    c.customer_name,
    c.phone,
    c.address,
    COUNT(s.sales_id) AS unpaid_bills,
    SUM(s.total) AS total_amount,
    SUM(s.amount_paid) AS total_paid,
    SUM(s.balance) AS total_balance,
    GROUP_CONCAT(s.unique_number, ', ') AS bill_numbers,
    GROUP_CONCAT(s.issueDate, ', ') AS issue_dates,
    GROUP_CONCAT(s.dueDate, ', ') AS due_dates
FROM 
    sales s
JOIN 
    customer c ON s.customer_id = c.customer_id
WHERE 
    s.balance > 0
GROUP BY 
    c.customer_id
ORDER BY 
    total_balance DESC;`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }


  function getOpenSalesByCustomer(customerId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
    sales_id,
    unique_number,
    issueDate,
    dueDate,
    total,
    amount_paid,
    balance
FROM 
    sales
WHERE 
    customer_id = ? AND balance > 0
ORDER BY 
    issueDate ASC;`,
        [customerId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  function fetchMemoData(memoNumber) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM memo WHERE memo_number = ?`,
        [memoNumber],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  function fetchMemoItems(memoNumber) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM sold_items WHERE unique_number = ?`,
        [memoNumber],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  function updateInventoryItem(updatedData) {
    return new Promise((resolve, reject) => {
      const {
        item_code,
        category,
        unit,
        cost,
        quantity,
        reorder_level,
        order_status,
      } = updatedData;

      db.run(
        `UPDATE inventory
       SET
         category = ?,
         unit = ?,
         cost = ?,
         quantity = ?,
         reorder_level = ?,

         in_stock = CASE
           WHEN ? = 0 THEN 'out of stock'
           WHEN ? < ? THEN 'low on stock'
           ELSE 'in stock'
         END,

         order_status = CASE
            WHEN (? = 0) AND ? != 'Ordered' THEN 'Not ordered'
            WHEN (? < ?) AND ? != 'Ordered' THEN 'Not ordered'
            WHEN (? > ?) AND ? != 'Ordered' THEN 'Not required'
            ELSE ?
          END,

         updatedTS = CURRENT_TIMESTAMP

       WHERE item_code = ?`,
        [
          category,
          unit,
          cost,
          quantity,
          reorder_level,

          // for CASE in_stock
          quantity, quantity, reorder_level,

          // for CASE order_status
          quantity, order_status,     // (? = 0) AND ? != 'Ordered'
          quantity, reorder_level, order_status, // (? < ?) AND ? != 'Ordered'
          quantity, reorder_level, order_status, // (? > ?) AND ? != 'Ordered'
          order_status,

          item_code,
        ],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  function updateInvoiceAndSales(updatedInvoice) {
    return new Promise((resolve, reject) => {
      const { amount_paid, balance, dueDate, status, invoice_number } = updatedInvoice;
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.run(
          `UPDATE sales SET amount_paid = ?, balance = ?, dueDate = ?, status = ? WHERE unique_number = ?`,
          [amount_paid, balance, dueDate, status, invoice_number],
          function (err) {
            if (err) {
              db.run("ROLLBACK");
              return reject(err);
            }

            db.run(
              `UPDATE invoice SET amount_paid = ?, balance = ?, dueDate = ?, status = ? WHERE invoice_number = ?`,
              [amount_paid, balance, dueDate, status, invoice_number],
              function (err2) {
                if (err2) {
                  db.run("ROLLBACK");
                  return reject(err2);
                }

                db.run("COMMIT", (commitErr) => {
                  if (commitErr) {
                    return reject(commitErr);
                  }
                  resolve({ success: true });
                });
              }
            );
          }
        );
      });
    });
  }

  function updateMemoAndSales(updatedInvoice) {
    return new Promise((resolve, reject) => {
      const { amount_paid, balance, dueDate, status, unique_number } = updatedInvoice;

      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.run(
          `UPDATE sales SET amount_paid = ?, balance = ?, dueDate = ?, status = ? WHERE unique_number = ?`,
          [amount_paid, balance, dueDate, status, unique_number],
          function (err) {
            if (err) {
              db.run("ROLLBACK");
              return reject(err);
            }

            db.run(
              `UPDATE memo SET amount_paid = ?, balance = ?, dueDate = ?, status = ? WHERE memo_number = ?`,
              [amount_paid, balance, dueDate, status, unique_number],
              function (err2) {
                if (err2) {
                  db.run("ROLLBACK");
                  return reject(err2);
                }

                db.run("COMMIT", (commitErr) => {
                  if (commitErr) {
                    return reject(commitErr);
                  }
                  resolve({ success: true });
                });
              }
            );
          }
        );
      });
    });
  }

  function getAllCategories() {
    return new Promise((resolve, reject) => {
      db.all("SELECT category_name FROM category", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  function getAllUnits() {
    return new Promise((resolve, reject) => {
      db.all("SELECT unit_name FROM units", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  function deleteInventory(item_code) {
    return new Promise((resolve, reject) => {
      db.all(
        `DELETE FROM inventory WHERE item_code = ?`,
        [item_code],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  function upsertInventoryItem(item) {
    return new Promise((resolve, reject) => {
      const query = `
      INSERT INTO inventory (
        item_code, item_name, unit, cost, quantity, reorder_level, category, in_stock, order_status, createdTS, updatedTS
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'in stock', 'Not required', ?, ?)
      ON CONFLICT(item_code)
      DO UPDATE SET
        item_name=excluded.item_name,
        unit=excluded.unit,
        cost=excluded.cost,
        quantity=excluded.quantity,
        reorder_level=excluded.reorder_level,
        category=excluded.category,
        updatedTS=excluded.updatedTS;
    `;

      const params = [
        item.item_code,
        item.item_name,
        item.unit,
        item.cost,
        item.stock,
        item.reorder_level,
        item.category,
        new Date().toISOString(),
        new Date().toISOString(),
      ];

      db.run(query, params, function (err) {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  function fetchInvoiceData(invoiceNumber) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM invoice WHERE invoice_number = ?`,
        [invoiceNumber],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  function fetchInvoiceItems(invoiceNumber) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM sold_items WHERE unique_number = ?`,
        [invoiceNumber],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  function addCategory(name) {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO category (category_name, createdTS) VALUES (?, datetime('now'))",
        [name],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  function addUnit(name) {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO units (unit_name, createdTS) VALUES (?, datetime('now'))",
        [name],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }


  function deleteCategories(names) {
    return new Promise((resolve, reject) => {
      const placeholders = names.map(() => "?").join(", ");
      db.run(
        `DELETE FROM category WHERE category_name IN (${placeholders})`,
        names,
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  function deleteUnits(names) {
    return new Promise((resolve, reject) => {
      const placeholders = names.map(() => "?").join(", ");
      db.run(
        `DELETE FROM units WHERE unit_name IN (${placeholders})`,
        names,
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  function closeDatabase() {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  function getSalesMetrics() {
    return new Promise((resolve, reject) => {
      const query = `SELECT 
                    SUM(CASE WHEN date(substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) = date('now', 'localtime') THEN total ELSE 0 END) AS todayTotal,

                    SUM(CASE WHEN date(substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) = date('now', '-1 day', 'localtime') THEN total ELSE 0 END) AS yesterdayTotal,

                    SUM(CASE WHEN strftime('%W', substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) = strftime('%W', 'now', 'localtime')
                          AND strftime('%Y', substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) = strftime('%Y', 'now', 'localtime') THEN total ELSE 0 END) AS weekTotal,

                    SUM(CASE WHEN strftime('%W', substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) = strftime('%W', 'now', '-7 day', 'localtime')
                          AND strftime('%Y', substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) = strftime('%Y', 'now', 'localtime') THEN total ELSE 0 END) AS lastWeekTotal,

                    SUM(CASE WHEN strftime('%m', substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) = strftime('%m', 'now', 'localtime')
                          AND strftime('%Y', substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) = strftime('%Y', 'now', 'localtime') THEN total ELSE 0 END) AS monthTotal,

                    SUM(CASE WHEN strftime('%m', substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) = strftime('%m', 'now', '-1 month', 'localtime')
                          AND strftime('%Y', substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) = strftime('%Y', 'now', 'localtime') THEN total ELSE 0 END) AS lastMonthTotal,

                    SUM(CASE WHEN ((cast(strftime('%m', substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) as integer) - 1) / 3 + 1)
                              = ((cast(strftime('%m', 'now', 'localtime') as integer) - 1) / 3 + 1)
                          AND strftime('%Y', substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) = strftime('%Y', 'now', 'localtime')
                        THEN total ELSE 0 END) AS quarterTotal,

                    SUM(CASE WHEN ((cast(strftime('%m', substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) as integer) - 1) / 3 + 1)
                              = ((cast(strftime('%m', 'now', '-3 months', 'localtime') as integer) - 1) / 3 + 1)
                          AND strftime('%Y', substr(issueDate, 7, 4) || '-' || printf('%02d', substr(issueDate, 4, 2)) || '-' || printf('%02d', substr(issueDate, 1, 2))) = strftime('%Y', 'now', 'localtime')
                        THEN total ELSE 0 END) AS lastQuarterTotal

                  FROM sales`;

      db.get(query, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  function getOutstandingMetrics() {
    return new Promise((resolve, reject) => {
      const query = `
      SELECT
        SUM(CASE WHEN status = 'Paid' THEN total ELSE 0 END) AS paid,
        SUM(CASE WHEN status = 'Unpaid' THEN total ELSE 0 END) AS unpaid,
        SUM(CASE WHEN status = 'Overdue' THEN total ELSE 0 END) AS overdue
      FROM sales
    `;

      db.get(query, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  function getFastestMovingItems() {
    return new Promise((resolve, reject) => {
      const query = `
      SELECT 
        description,
        SUM(quantity) AS totalSold 
      FROM sold_items 
      GROUP BY description 
      ORDER BY totalSold DESC 
      LIMIT 5
    `;

      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  function getStockReorderDashboardData() {
    return new Promise((resolve, reject) => {
      const reorderQuery = `
      SELECT 
      item_name, 
      quantity, 
      CASE
        WHEN quantity = 0 THEN 'Out of Stock'
        WHEN quantity <= reorder_level THEN 'Low Stock'
        ELSE 'In Stock'
      END AS status
    FROM inventory
    WHERE quantity <= reorder_level
    ORDER BY quantity ASC
    LIMIT 8
    `;

      const donutQuery = `
      SELECT 
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) AS outOfStock,
        SUM(CASE WHEN quantity <= reorder_level AND quantity > 0 THEN 1 ELSE 0 END) AS lowStock,
        SUM(CASE WHEN quantity > reorder_level THEN 1 ELSE 0 END) AS inStock
      FROM inventory
    `;

      db.all(reorderQuery, (err, reorderRows) => {
        if (err) return reject(err);

        db.get(donutQuery, (err2, donutRow) => {
          if (err2) return reject(err2);

          const donutData = [
            { name: "In Stock", value: donutRow.inStock },
            { name: "Low Stock", value: donutRow.lowStock },
            { name: "Out of Stock", value: donutRow.outOfStock },
          ];

          resolve({
            stockData: reorderRows,
            donutData,
          });
        });
      });
    });
  }

  function getRecentTransactions() {
    return new Promise((resolve, reject) => {
      const query = `
      SELECT 
        unique_number, 
        customer_name, 
        total, 
        amount_paid, 
        balance, 
        status, 
        issueDate 
      FROM sales 
      WHERE type != 'Sale'
      ORDER BY createdTS DESC 
      LIMIT 6
    `;

      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  function getMostFrequentBuyers() {
    return new Promise((resolve, reject) => {
      const query = `
      SELECT customer_name, COUNT(*) AS purchase_count
      FROM sales
      GROUP BY customer_name
      ORDER BY purchase_count DESC
      LIMIT 8
    `;
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  function getAllNotes() {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM notes", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  function cleanCustomerTable() {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM customer", function (err) {
        if (err) reject(err);
        else resolve({ success: true, message: "Customer table cleaned." });
      });
    });
  }

  function cleanInventoryTable() {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM inventory", function (err) {
        if (err) reject(err);
        else resolve({ success: true, message: "Customer table cleaned." });
      });
    });
  }

  function cleanMemoData() {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run("DELETE FROM sales WHERE type = 'Memo'");
        db.run("DELETE FROM memo");
        db.run("DELETE FROM sold_items WHERE unique_number LIKE 'MMO%'", function (err) {
          if (err) {
            db.run("ROLLBACK");
            reject(err);
          } else {
            db.run("COMMIT");
            resolve({ success: true, message: "Memo and related sales cleaned." });
          }
        });
      });
    });
  }

  function cleanSaleData() {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run("DELETE FROM sales WHERE type in ('Sale', 'Invoice')");
        db.run("DELETE FROM invoice");
        db.run("DELETE FROM sold_items WHERE unique_number LIKE 'INV%'", function (err) {
          if (err) {
            db.run("ROLLBACK");
            reject(err);
          } else {
            db.run("COMMIT");
            resolve({ success: true, message: "Sales cleaned." });
          }
        });
      });
    });
  }

  function getInvoiceMemoTrends() {
    return new Promise((resolve, reject) => {
      const baseDate = `DATE(substr(issueDate, 7, 4) || '-' || 
                           printf('%02d', substr(issueDate, 4, 2)) || '-' || 
                           printf('%02d', substr(issueDate, 1, 2)))`;

      const queries = {
        today: `SELECT type, SUM(total) as total
              FROM sales
              WHERE ${baseDate} = DATE('now','localtime')
              GROUP BY type;`,

        week: `SELECT strftime('%w', parsedDate) AS weekday, type, SUM(total) as total
             FROM (SELECT type, total, ${baseDate} AS parsedDate FROM sales)
             WHERE strftime('%W', parsedDate) = strftime('%W','now','localtime')
               AND strftime('%Y', parsedDate) = strftime('%Y','now','localtime')
             GROUP BY weekday, type
             ORDER BY weekday;`,

        month: `SELECT strftime('%d', parsedDate) AS day, type, SUM(total) as total
              FROM (SELECT type, total, ${baseDate} AS parsedDate FROM sales)
              WHERE strftime('%m', parsedDate) = strftime('%m','now','localtime')
                AND strftime('%Y', parsedDate) = strftime('%Y','now','localtime')
              GROUP BY day, type
              ORDER BY day;`
      };

      const runQuery = (sql) => new Promise((res, rej) => {
        db.all(sql, [], (err, rows) => {
          if (err) rej(err);
          else res(rows);
        });
      });

      Promise.all([
        runQuery(queries.today),
        runQuery(queries.week),
        runQuery(queries.month)
      ])
        .then(([todayRows, weekRows, monthRows]) => {
          // Today
          const todayData = [{
            label: "Invoices",
            invoices: todayRows.find(r => r.type === "Invoice")?.total || 0,
            memos: todayRows.find(r => r.type === "Memo")?.total || 0
          }];

          // Week
          const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const weekMap = {};
          weekRows.forEach(r => {
            const day = weekdays[parseInt(r.weekday)];
            if (!weekMap[day]) weekMap[day] = { label: day, invoices: 0, memos: 0 };
            if (r.type === "Invoice") weekMap[day].invoices = r.total;
            if (r.type === "Memo") weekMap[day].memos = r.total;
          });
          const weekData = Object.values(weekMap);

          // Month
          const monthMap = {};
          monthRows.forEach(r => {
            const day = parseInt(r.day).toString();
            if (!monthMap[day]) monthMap[day] = { label: day, invoices: 0, memos: 0 };
            if (r.type === "Invoice") monthMap[day].invoices = r.total;
            if (r.type === "Memo") monthMap[day].memos = r.total;
          });
          const monthData = Object.values(monthMap);

          resolve({ today: todayData, week: weekData, month: monthData });
        })
        .catch(reject);
    });
  }

  function getOverdueCustomers() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT customer_name, SUM(balance) AS balance_due
       FROM sales
       WHERE status = 'Overdue'
       GROUP BY customer_name
       HAVING balance_due > 0
       ORDER BY balance_due DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  function addNote(note) {
    return new Promise((resolve, reject) => {
      const {
        title,
        content,
        flag = 0,
        operation = null,
        value = null
      } = note;

      const notes_uuid = uuidv4();

      const stmt = db.prepare(`
      INSERT INTO notes 
      (notes_uuid, notes_title, notes_flag, notes_content, notes_operation, notes_value, createdTS)
      VALUES (?, ?, ?, ?, ?, ?, datetime())
    `);

      stmt.run(
        notes_uuid,
        title,
        flag,
        content,
        operation,  // prefix stored here
        value,
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              notes_id: this.lastID,
              notes_uuid,
              title,
              flag,
              content,
              operation,
              value,
            });
          }
        }
      );

      stmt.finalize();
    });
  }

  function updateNote(notes_id, note) {
    return new Promise((resolve, reject) => {
      const {
        title,
        content,
        flag = 0,
        operation = null,
        value = null,
      } = note;

      const stmt = db.prepare(`
      UPDATE notes
      SET notes_title = ?,
          notes_flag = ?,
          notes_content = ?,
          notes_operation = ?,
          notes_value = ?,
          updateTS = datetime()
      WHERE notes_id = ?
    `);

      stmt.run(
        title,
        flag,
        content,
        operation,
        value,
        notes_id,
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );

      stmt.finalize();
    });
  }

  function deleteNote(notes_id) {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`DELETE FROM notes WHERE notes_id = ?`);

      stmt.run(notes_id, function (err) {
        if (err) reject(err);
        else resolve({ deletedId: notes_id, changes: this.changes });
      });

      stmt.finalize();
    });
  }

  function getNotesByIds(noteIdsString) {
    return new Promise((resolve, reject) => {
      try {
        // Convert "[6, 7]" → [6, 7]
        const noteIds = JSON.parse(noteIdsString);

        if (!Array.isArray(noteIds) || noteIds.length === 0) {
          return resolve([]);
        }

        const placeholders = noteIds.map(() => "?").join(", ");

        const sql = `SELECT * FROM notes WHERE notes_id IN (${placeholders})`;

        db.all(sql, noteIds, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } catch (e) {
        reject(e);
      }
    });
  }


  // 📌 Return all DB functions inside an object
  return {
    registerUser,
    loginUser,
    getAllUsers,
    addSale,
    getAllSales,
    addCustomer,
    getAllCustomers,
    addInventory,
    getAllInventory,
    searchCustomers,
    addInvoice,
    getAllInvoices,
    addMemo,
    getAllMemos,
    getLatestInvoiceNumber,
    getLatestMemoNumber,
    getLatestItemNumber,
    getLatestSaleNumber,
    addSoldItem,
    searchInventory,
    updateInventoryAfterSales,
    getStockOverviewCounts,
    updateAllOverdues,
    updateInventoryOrderStatusAuto,
    getAllDebtors,
    getOpenSalesByCustomer,
    fetchMemoData,
    fetchMemoItems,
    updateInventoryItem,
    updateInvoiceAndSales,
    updateMemoAndSales,
    getAllCategories,
    getAllUnits,
    upsertInventoryItem,
    fetchInvoiceData,
    fetchInvoiceItems,
    addCategory,
    addUnit,
    deleteCategories,
    deleteUnits,
    deleteInventory,
    closeDatabase,
    getSalesMetrics,
    getOutstandingMetrics,
    getFastestMovingItems,
    getStockReorderDashboardData,
    getRecentTransactions,
    getMostFrequentBuyers,
    getAllNotes,
    cleanCustomerTable,
    cleanInventoryTable,
    cleanMemoData,
    cleanSaleData,
    getInvoiceMemoTrends,
    getOverdueCustomers,
    addNote,
    updateNote,
    deleteNote,
    getNotesByIds
  };
};