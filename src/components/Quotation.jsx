import React, { useEffect, useState, useRef } from "react";
import styles from "../styles/Quotation.module.css";
import "react-datepicker/dist/react-datepicker.css";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import Pagination from "../recomponents/Pagination";
import {
  showConfirmDialog,
  showSuccessDialog,
  showWarningDialog,
  showErrorDialog,
} from "../utils/dialogUtils";

const { electron } = window;

const SYMBOLS = ["<", "<=", "=", ">=", ">"];

const Quatation= () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableData, setTableData] = useState([]);
  const [itemCode, setItemCode] = useState("");
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  const costInputRef = useRef(null);
  const stockInputRef = useRef(null);
  const reorderInputRef = useRef(null);

  const initialFormState = {
    item_code: "",
    item_name: "",
    category: "",
    unit: "",
    quantity: "",
    reorder_level: "",
    in_stock: "",
    cost: "",
    order_status: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isEditMode, setIsEditMode] = useState(false);

  const [filters, setFilters] = useState({
    cost: null,
    status: null,
    orderStatus: null,
    stock: null,
    reorder: null,
  });

  const handleFilterButtonClick = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value, // toggle selection
    }));
  };

  const filteredItems = tableData.filter((item) => {
    const matchesSearchTerm = [
      item.item_code,
      item.item_name,
      item.category,
    ].some((field) => field.toLowerCase().startsWith(searchTerm.toLowerCase()));

    const matchesOrderStatus =
      !filters.orderStatus ||
      item.order_status.toLowerCase() === filters.orderStatus.toLowerCase();

    const matchStatus =
      !filters.status ||
      item.in_stock.toLowerCase() === filters.status.toLowerCase();
    // COST filter logic
    let matchesCost = true;
    if (
      filters.costSymbol &&
      filters.costValue !== null &&
      filters.costValue !== ""
    ) {
      const costValueNum = parseFloat(filters.costValue);
      if (!isNaN(costValueNum)) {
        switch (filters.costSymbol) {
          case "<":
            matchesCost = item.cost < costValueNum;
            break;
          case "<=":
            matchesCost = item.cost <= costValueNum;
            break;
          case "=":
            matchesCost = item.cost === costValueNum;
            break;
          case ">=":
            matchesCost = item.cost >= costValueNum;
            break;
          case ">":
            matchesCost = item.cost > costValueNum;
            break;
          default:
            matchesCost = true;
        }
      }
    }
    // STOCK filter logic
    let matchesStock = true;
    if (
      filters.stockSymbol &&
      filters.stockValue !== null &&
      filters.stockValue !== ""
    ) {
      const stockValueNum = parseFloat(filters.stockValue);
      if (!isNaN(stockValueNum)) {
        switch (filters.stockSymbol) {
          case "<":
            matchesStock = item.quantity < stockValueNum;
            break;
          case "<=":
            matchesStock = item.quantity <= stockValueNum;
            break;
          case "=":
            matchesStock = item.quantity === stockValueNum;
            break;
          case ">=":
            matchesStock = item.quantity >= stockValueNum;
            break;
          case ">":
            matchesStock = item.quantity > stockValueNum;
            break;
          default:
            matchesStock = true;
        }
      }
    }

    // REORDER filter logic
    let matchesReorder = true;
    if (
      filters.reorderSymbol &&
      filters.reorderValue !== null &&
      filters.reorderValue !== ""
    ) {
      const reorderValueNum = parseFloat(filters.reorderValue);
      if (!isNaN(reorderValueNum)) {
        switch (filters.reorderSymbol) {
          case "<":
            matchesReorder = item.reorder_level < reorderValueNum;
            break;
          case "<=":
            matchesReorder = item.reorder_level <= reorderValueNum;
            break;
          case "=":
            matchesReorder = item.reorder_level === reorderValueNum;
            break;
          case ">=":
            matchesReorder = item.reorder_level >= reorderValueNum;
            break;
          case ">":
            matchesReorder = item.reorder_level > reorderValueNum;
            break;
          default:
            matchesReorder = true;
        }
      }
    }

    return (
      matchesSearchTerm &&
      matchesOrderStatus &&
      matchStatus &&
      matchesCost &&
      matchesStock &&
      matchesReorder
    );
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeNestedFilter, setActiveNestedFilter] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  useEffect(() => {
    if (activeNestedFilter === "cost") {
      costInputRef.current?.focus();
    } else if (activeNestedFilter === "stock") {
      stockInputRef.current?.focus();
    } else if (activeNestedFilter === "reorder") {
      reorderInputRef.current?.focus();
    }
  }, [activeNestedFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    const quantity = parseFloat(
      name === "quantity" ? value : formData.quantity
    );
    const reorderLevel = parseFloat(
      name === "reorder_level" ? value : formData.reorder_level
    );

    let inStockStatus = formData.in_stock; // default to existing

    if (!isNaN(quantity) && !isNaN(reorderLevel)) {
      if (quantity === 0) {
        inStockStatus = "out of stock";
      } else if (quantity <= reorderLevel) {
        inStockStatus = "low on stock";
      } else {
        inStockStatus = "in stock";
      }
    }

    setFormData({
      ...updatedFormData,
      in_stock: inStockStatus,
    });
  };

  const fetchInventory = async () => {
    await electron.updateInventoryOrderStatusAuto();
    const inventory = await electron.getAllInventory();
    setTableData(inventory); // <-- update UI table data
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchInventory();
      await fetchCategories();
      await fetchUnits();
      await resetForm();
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (showModal) {
      const inputs = document.querySelectorAll(".modal input, .modal select");
      const nextFocusable = Array.from(inputs).find(
        (el) => !el.disabled && el.offsetParent !== null
      );
      if (nextFocusable) nextFocusable.focus();
    }
  }, [showModal]);

  const fetchCategories = async () => {
    try {
      const data = await electron.getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const data = await window.electron.getAllUnits();
      setUnits(data);
    } catch (err) {
      console.error("Failed to fetch units:", err);
    }
  };

  const generateNextItemNumber = (latest) => {
    if (!latest) return "#UIN0001";
    const num = parseInt(latest.replace("#UIN", ""), 10);
    return `#UIN${String(num).padStart(4, "0")}`;
  };

  const resetForm = async () => {
    const latest = await window.electron.getLatestItemNumber();
    const nextNumber = generateNextItemNumber(latest);
    setItemCode(nextNumber);
    setFormData({
      item_code: nextNumber,
      item_name: "",
      category: "",
      unit: "",
      quantity: "",
      reorder_level: "",
      in_stock: "",
      cost: "",
      order_status: "not-required",
    });
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();

    try {
      if (isEditMode) {
        // Update existing inventory item
        await window.electron.updateInventoryItem(formData);
      } else {
        // Add new inventory item
        await window.electron.addInventory(formData);
      }

      fetchInventory(); // Refresh inventory table
      window.dispatchEvent(new Event("inventoryUpdated"));
      await resetForm();
      setShowModal(false);
      window.electron?.focusWindow();
    } catch (err) {
      console.error("Inventory operation failed:", err);
      // You can optionally show a toast or error message here
    }
  };

  const toggleDropdown = () => setFilterDropdownOpen((prev) => !prev);
  const toggleNested = (key) =>
    setActiveNestedFilter((prev) => (prev === key ? null : key));

  const handleEdit = (row) => {
    setFormData({ ...row });
    setIsEditMode(true);
    setShowModal(true);
    window.electron?.focusWindow();
  };

  const handleDelete = async (item_code) => {
    const confirmed = await showConfirmDialog({
      title: "Save Sales",
      message: "Do you want to continue and save quotation?",
    });
    if (confirmed) {
      await electron.deleteInventory(item_code); // Implement this in your backend
      fetchInventory(); // Refresh UI
      window.dispatchEvent(new Event("inventoryUpdated"));
    } else {
      await showErrorDialog({
        title: "Save Failed",
        message: "Failure contact vendor for support.",
      });
    }
  };

  const handleExportPrompt = async () => {
    const result = await window.electron.promptExportFormat();

    if (result === "excel") {
      const exportResult = await window.electron.exportInventoryExcel(
        tableData
      );
      if (exportResult?.success) {
        await showSuccessDialog({
          title: "Export Complete",
          message: `Inventory exported to ${exportResult.filePath}`,
        });
      } else if (exportResult?.canceled) {
        await showWarningDialog({
          title: "Export Cancelled",
          message: "Export Inventory canceled by user.",
        });
      } else {
        await showErrorDialog({
          title: "Export Failed",
          message: "Failure connect vendor for support.",
        });
      }
    }
  };

  const handleImport = async () => {
    const filePath = await window.electron.ipcRenderer.invoke(
      "open-file-dialog"
    );
    if (filePath) {
      try {
        await window.electron.ipcRenderer.invoke(
          "import-inventory-file",
          filePath
        );
        await showSuccessDialog({
          title: "Import Completed",
          message: "Import by Excel file completed.",
        });
        fetchInventory();
        window.dispatchEvent(new Event("inventoryUpdated"));
      } catch (err) {
        await showErrorDialog({
          title: "Import Failed",
          message:
            "Failuer contact vendor for support. (please have the file used for import)",
        });
      }
    }
  };

  return (
    <div className={styles.inventoryContainer}>
      <div className={styles.topActions}>
        <h2 className="sales-heading">Quotation</h2>
        <div className={styles.actionButtons}>
          
          
          <button
            className="Inventory-btn createBtn"
            onClick={() => {
              setShowModal(true), window.electron?.focusWindow();
            }}
          >
            + Add Quotation
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className={styles.filtersWrapper}>
        <div className={styles.filtersContainer}>
          <div className={styles.searchIcon}>
            <input
              type="text"
              placeholder="Search"
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="bx bx-search icon"></i>
          </div>
        </div>
        <div className={styles.filterIcons} style={{ position: "relative" }}>
          <button className={styles.iconBtn} onClick={toggleDropdown}>
            <i className="bx bx-filter"></i>
            <span>More Filters</span>
            <i
              className={`bx ${
                filterDropdownOpen ? "bx-chevron-up" : "bx-chevron-down"
              }`}
            ></i>
          </button>

          {filterDropdownOpen && (
            <div className={styles.filterDropdown}>
              {[
                { key: "cost", label: "Cost" },
                { key: "status", label: "Status" },
                { key: "orderStatus", label: "Order Status" },
                { key: "stock", label: "Stock" },
                { key: "reorder", label: "Reorder" },
              ].map(({ key, label }) => (
                <div key={key} className={styles.filterCategory}>
                  <button
                    onClick={() => toggleNested(key)}
                    className={styles.filterCategoryBtn}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{label}</span>

                    {/* Show Clear Filter Icon if any relevant filter is active */}
                    {key === "cost" &&
                      (filters.costSymbol || filters.costValue) && (
                        <i
                          className="bx bx-x"
                          title="Clear Cost Filter"
                          style={{
                            color: "red",
                            cursor: "pointer",
                            fontSize: "24px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters((prev) => ({
                              ...prev,
                              costSymbol: null,
                              costValue: null,
                            }));
                          }}
                        />
                      )}

                    {key === "status" && filters.status && (
                      <i
                        className="bx bx-x"
                        title="Clear Status Filter"
                        style={{
                          color: "red",
                          cursor: "pointer",
                          fontSize: "24px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters((prev) => ({ ...prev, status: null }));
                        }}
                      />
                    )}

                    {key === "orderStatus" && filters.orderStatus && (
                      <i
                        className="bx bx-x"
                        title="Clear Order Status Filter"
                        style={{
                          color: "red",
                          cursor: "pointer",
                          fontSize: "24px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters((prev) => ({
                            ...prev,
                            orderStatus: null,
                          }));
                        }}
                      />
                    )}

                    {key === "stock" &&
                      (filters.stockSymbol || filters.stockValue) && (
                        <i
                          className="bx bx-x"
                          title="Clear Stock Filter"
                          style={{
                            color: "red",
                            cursor: "pointer",
                            fontSize: "24px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters((prev) => ({
                              ...prev,
                              stockSymbol: null,
                              stockValue: null,
                            }));
                          }}
                        />
                      )}

                    {key === "reorder" &&
                      (filters.reorderSymbol || filters.reorderValue) && (
                        <i
                          className="bx bx-x"
                          title="Clear Reorder Filter"
                          style={{
                            color: "red",
                            cursor: "pointer",
                            fontSize: "24px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters((prev) => ({
                              ...prev,
                              reorderSymbol: null,
                              reorderValue: null,
                            }));
                          }}
                        />
                      )}

                    {/* Arrow for open/close */}
                    <i
                      className={`bx ${
                        activeNestedFilter === key
                          ? "bx-chevron-up"
                          : "bx-chevron-down"
                      }`}
                      style={{ marginLeft: "auto" }}
                    />
                  </button>

                  {activeNestedFilter === key && (
                    <div className={styles.nestedFilterContent}>
                      {key === "cost" && (
                        <>
                          <div className={styles.nestedRowGrid}>
                            <select
                              className={styles.selectInput}
                              value={filters.costSymbol || "<"}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  costSymbol: e.target.value,
                                }))
                              }
                            >
                              {SYMBOLS.map((sym) => (
                                <option key={sym} value={sym}>
                                  {sym}
                                </option>
                              ))}
                            </select>

                            <input
                              ref={costInputRef}
                              type="number"
                              className={styles.numberInput}
                              placeholder="Value"
                              value={filters.costValue || ""}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  costValue: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </>
                      )}
                      {key === "orderStatus" && (
                        <div className={styles.orderStatusFilterGroup}>
                          {["Not ordered", "Ordered", "Not required"].map(
                            (orderOpt) => {
                              const keyClass = orderOpt
                                .toLowerCase()
                                .replace(/\s+/g, "");
                              const isActive = filters.orderStatus === orderOpt;

                              return (
                                <span
                                  key={orderOpt}
                                  className={`${styles["order-status"]} ${
                                    styles[keyClass]
                                  } ${
                                    isActive ? styles["activeStatusFilter"] : ""
                                  }`}
                                  style={{ cursor: "pointer" }}
                                  onClick={() =>
                                    handleFilterButtonClick(
                                      "orderStatus",
                                      orderOpt
                                    )
                                  }
                                >
                                  {orderOpt}
                                </span>
                              );
                            }
                          )}
                        </div>
                      )}

                      {key === "status" && (
                        <div className={styles.statusFilterGroup}>
                          {["In stock", "Out of stock", "Low on stock"].map(
                            (statusOpt) => {
                              const keyClass = statusOpt
                                .toLowerCase()
                                .replace(/\s+/g, "");
                              const isActive = filters.status === statusOpt;

                              return (
                                <span
                                  key={statusOpt}
                                  className={`${styles["status-label"]} ${
                                    styles[keyClass]
                                  } ${
                                    isActive ? styles["activeStatusFilter"] : ""
                                  }`}
                                  style={{ cursor: "pointer" }}
                                  onClick={() =>
                                    handleFilterButtonClick("status", statusOpt)
                                  }
                                >
                                  {statusOpt}
                                </span>
                              );
                            }
                          )}
                        </div>
                      )}
                      {key === "stock" && (
                        <>
                          <div className={styles.nestedRowGrid}>
                            <select
                              className={styles.selectInput}
                              value={filters.stockSymbol || "<"}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  stockSymbol: e.target.value,
                                }))
                              }
                            >
                              {SYMBOLS.map((sym) => (
                                <option key={sym} value={sym}>
                                  {sym}
                                </option>
                              ))}
                            </select>

                            <input
                              ref={stockInputRef}
                              type="number"
                              className={styles.numberInput}
                              placeholder="Value"
                              value={filters.stockValue || ""}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  stockValue: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </>
                      )}
                      {key === "reorder" && (
                        <>
                          <div className={styles.nestedRowGrid}>
                            <select
                              className={styles.selectInput}
                              value={filters.reorderSymbol || "<"}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  reorderSymbol: e.target.value,
                                }))
                              }
                            >
                              {SYMBOLS.map((sym) => (
                                <option key={sym} value={sym}>
                                  {sym}
                                </option>
                              ))}
                            </select>

                            <input
                              ref={reorderInputRef}
                              type="number"
                              className={styles.numberInput}
                              placeholder="Value"
                              value={filters.reorderValue || ""}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  reorderValue: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <table className={styles.quotationTable}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Item</th>
            <th>Unit</th>
            <th>Cost</th>
            <th>Stock</th>
            <th>Re-Order</th>
            <th>Category</th>
            <th>Status</th>
            <th>Order Status</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="9" className={styles.noDataRow}>
                No Items to Show
              </td>
            </tr>
          ) : (
            currentItems.map((row, idx) => (
              <tr key={idx}>
                <td>{row.item_code}</td>
                <td>{row.item_name}</td>
                <td>{row.unit}</td>
                <td>₹ {row.cost.toFixed(2)}</td>
                <td>{row.quantity.toFixed(2)}</td>
                <td>{row.reorder_level.toFixed(2)}</td>
                <td>{row.category}</td>
                <td>
                  <span
                    className={`${styles["status-label"]} ${
                      styles[row.in_stock.toLowerCase().replace(/\s+/g, "")]
                    }`}
                  >
                    {row.in_stock.charAt(0).toUpperCase() +
                      row.in_stock.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className={styles.typecellwithactions}>
                  <span
                    className={`${styles["order-status"]} ${
                      styles["action-icons"]
                    } ${
                      styles[row.order_status.toLowerCase().replace(/\s+/g, "")]
                    }`}
                  >
                    {row.order_status.charAt(0).toUpperCase() +
                      row.order_status.slice(1).toLowerCase()}
                  </span>

                  <div className={styles.iconGroup}>
                    <button
                      className={`${styles.tableIconBtn} ${styles.editIcon}`}
                      title="Edit"
                      onClick={() => handleEdit(row)}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className={`${styles.tableIconBtn} ${styles.deleteIcon}`}
                      title="Delete"
                      onClick={() => handleDelete(row.item_code)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Code */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Inventory</h3>
            <form onSubmit={handleAddInventory}>
              {isEditMode ? (
                <div className="readonlyfield">
                  <label>Item Code:</label>
                  <div>{formData.item_code}</div>
                </div>
              ) : (
                <input
                  type="text"
                  name="item_code"
                  value={formData.item_code}
                  onChange={handleChange}
                  placeholder="Item Code"
                  disabled
                />
              )}
              {isEditMode ? (
                <div className={styles.readonlyfield}>
                  <label>Item Name:</label>
                  <div>{formData.item_name}</div>
                </div>
              ) : (
                <input
                  type="text"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleChange}
                  placeholder="Item Name"
                  required
                />
              )}
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Category</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat.category_name}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
              >
                <option value="">Unit</option>
                {units.map((unit, index) => (
                  <option key={index} value={unit.unit_name}>
                    {unit.unit_name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="cost"
                placeholder="Cost"
                value={formData.cost}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="reorder_level"
                placeholder="Re-Order Level"
                value={formData.reorder_level}
                onChange={handleChange}
                required
              />
              <select
                name="order_status"
                value={formData.order_status}
                onChange={handleChange}
                required
              >
                <option value="">Order Status</option>
                <option value="Ordered">Ordered</option>
                <option value="Not ordered">Not Ordered</option>
                <option value="Not required">Not required</option>
              </select>
              <div className="modal-buttons">
                <button type="submit">
                  {isEditMode ? "Update Inventory" : "Add Inventory"}
                </button>
                <button
                  type="button"
                  className="inventory-btn"
                  onClick={async () => {
                    await resetForm();
                    setShowModal(false);
                    setIsEditMode(false);
                    window.electron?.focusWindow();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quatation;
