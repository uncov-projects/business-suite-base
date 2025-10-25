import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/Invoice.module.css";
import {
  FiFileText,
  FiEdit,
  FiFolderPlus,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse, isValid, isAfter, isBefore, isSameDay } from "date-fns";
import Pagination from "../recomponents/Pagination";
const SYMBOLS = ["<", "<=", "=", ">=", ">"];
import {
  showSuccessDialog,
  showWarningDialog,
  showErrorDialog,
} from "../utils/dialogUtils";

const Invoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceState = location.state || {};

  const [summaryCards, setSummaryCards] = useState([]);

  const [tableData, setTableData] = useState([]);
  const [startDate, setStartDate] = useState(invoiceState.startDate || null);
  const [endDate, setEndDate] = useState(invoiceState.endDate || null);
  const [searchTerm, setSearchTerm] = useState(invoiceState.searchTerm || "");

  const [filters, setFilters] = useState(
    invoiceState.filters || {
      amountSymbol: null,
      amountValue: null,
      paidSymbol: null,
      paidValue: null,
      balanceSymbol: null,
      balanceValue: null,
      dueSymbol: null,
      dueValue: null,
      status: null,
      method: null,
      issueDateStart: null,
      issueDateEnd: null,
      dueDateStart: null,
      dueDateEnd: null,
    }
  );

  const filteredItems = tableData.filter((item) => {
    const matchNumber = (field, symbol, value) => {
      if (!symbol || value === null || value === "") return true;
      const val = parseFloat(value);
      if (isNaN(val)) return true;
      switch (symbol) {
        case "<":
          return field < val;
        case "<=":
          return field <= val;
        case "=":
          return field === val;
        case ">=":
          return field >= val;
        case ">":
          return field > val;
        default:
          return true;
      }
    };

    const matchDateRange = (dateStr, start, end) => {
      const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
      if (!isValid(parsed)) return true;
      if (start && isBefore(parsed, start)) return false;
      if (end && isAfter(parsed, end)) return false;
      return true;
    };

    const matchesSearchTerm = [item.invoice_number, item.customer_name].some(
      (field) => field.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesAmount = matchNumber(
      item.total,
      filters.amountSymbol,
      filters.amountValue
    );
    const matchesPaid = matchNumber(
      item.amount_paid,
      filters.paidSymbol,
      filters.paidValue
    );
    const matchesBalance = matchNumber(
      item.balance,
      filters.balanceSymbol,
      filters.balanceValue
    );
    const matchesDue = matchNumber(
      item.due_days,
      filters.dueSymbol,
      filters.dueValue
    );

    const issueDate = parse(item.issueDate, "dd/MM/yyyy", new Date());
    const matchesStartDate =
      !startDate ||
      isAfter(issueDate, startDate) ||
      isSameDay(issueDate, startDate);
    const matchesEndDate =
      !endDate || isBefore(issueDate, endDate) || isSameDay(issueDate, endDate);

    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesPayment =
      !filters.method || item.paymentMethod === filters.method;

    return (
      matchesSearchTerm &&
      matchesAmount &&
      matchesPaid &&
      matchesBalance &&
      matchesDue &&
      matchesStartDate &&
      matchesEndDate &&
      matchesStatus &&
      matchesPayment
    );
  });

  const [currentPage, setCurrentPage] = useState(invoiceState.page || 1);
  const itemsPerPage = 8;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const fetchInvoices = async () => {
    try {
      await electron.updateAllOverdues();
      const invoices = await electron.getAllInvoices();
      setTableData(invoices); // <-- update UI table data

      const allCount = invoices.length;
      const allValue = invoices.reduce((sum, sale) => sum + sale.total, 0);

      const draftInvoice = invoices.filter((s) => s.status === "Unpaid");
      const draftCount = draftInvoice.length;
      const draftValue = draftInvoice.reduce(
        (sum, s) => sum + s.amount_paid,
        0
      );

      const balanceInvoice = invoices.filter((s) => s.status === "Unpaid");
      const balanceCount = balanceInvoice.length;
      const balanceValue = balanceInvoice.reduce(
        (sum, s) => sum + s.balance,
        0
      );

      const paidInvoice = invoices.filter((s) => s.status === "Paid");
      const paidCount = paidInvoice.length;
      const paidValue = paidInvoice.reduce((sum, s) => sum + s.total, 0);

      const overdueInvoice = invoices.filter((s) => s.status === "Overdue");
      const overdueCount = overdueInvoice.length;
      const overdueValue = overdueInvoice.reduce(
        (sum, s) => sum + (s.total - s.amount_paid),
        0
      );

      const updatedSummaryCards = [
        {
          label: "All Invoice",
          value: `₹${allValue.toFixed(2)}`,
          count: allCount,
          growth: "0.0%",
        },
        {
          label: "(₹) Paid",
          value: `₹${paidValue.toFixed(2)}`,
          count: paidCount,
          growth: "0.0%",
        },
        {
          label: "Partial Pay",
          value: `₹${draftValue.toFixed(2)}`,
          count: draftCount,
          growth: "0.0%",
        },
        {
          label: "(₹) Unpaid",
          value: `₹${balanceValue.toFixed(2)}`,
          count: balanceCount,
          growth: "0.0%",
        },
        {
          label: "(₹) Overdue",
          value: `₹${overdueValue.toFixed(2)}`,
          count: overdueCount,
          growth: "0.0%",
        },
      ];

      setSummaryCards(updatedSummaryCards);
    } catch (error) {
      console.error("Error updating overdues or fetching invoices:", error);
    }
  };

  useEffect(() => {
    const hasFilters =
      searchTerm !== "" ||
      startDate !== null ||
      endDate !== null ||
      Object.values(filters).some((v) => v !== null);

    if (hasFilters) {
      setCurrentPage(1);
    }
  }, [searchTerm, startDate, endDate, filters]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case "draft":
        return styles.draft;
      case "unpaid":
        return styles.unpaid;
      case "overdue":
        return styles.overdue;
      case "paid":
        return styles.paid;
      default:
        return "";
    }
  };

  const getIcon = (index) => {
    switch (index) {
      case 0:
        return <FiFileText />;
      case 1:
        return <FiEdit />;
      case 2:
        return <FiFolderPlus />;
      case 3:
        return <FiAlertTriangle />;
      case 4:
        return <FiCheckCircle />;
      default:
        return null;
    }
  };
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [additionalAmount, setAdditionalAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState(null);

  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setAdditionalAmount("");
    setNewDueDate(null);
    setShowModal(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedInvoice) return;

    const addedAmount = parseFloat(additionalAmount) || 0;
    const currentPaid = parseFloat(selectedInvoice.amount_paid) || 0;
    const currentBalance = parseFloat(selectedInvoice.balance) || 0;
    const updatedPaid = (currentPaid + addedAmount).toFixed(2);
    const updatedBalance = (currentBalance - addedAmount).toFixed(2);

    if (addedAmount > currentBalance) {
      await showWarningDialog({
        title: "Update Warning",
        message: `Can not add more than Balance.\n  Current Balance: ₹${currentBalance}`,
      });
      setAdditionalAmount("");
      return;
    }

    const currentDue = parse(selectedInvoice.dueDate, "dd/MM/yyyy", new Date());

    if (newDueDate && newDueDate <= currentDue) {
      await showWarningDialog({
        title: "Update Warning",
        message: "New due date must be later than the current due date.",
      });
      return;
    }

    const epsilon = 0.005; // 0.5 cents tolerance
    const isZero = Math.abs(updatedBalance) < epsilon;

    const newStatus = isZero
      ? "Paid"
      : updatedBalance > 0 && newDueDate > new Date()
      ? "Unpaid"
      : selectedInvoice.status;

    const updatedInvoice = {
      ...selectedInvoice,
      amount_paid: updatedPaid,
      balance: updatedBalance,
      status: newStatus,
      dueDate: newDueDate
        ? newDueDate.toLocaleDateString("en-GB") // Format as dd/MM/yyyy
        : selectedInvoice.dueDate,
    };
    try {
      const result = await window.electron.updateInvoice(updatedInvoice);

      if (result.success) {
        const updatedData = tableData.map((item) =>
          item.invoice_number === selectedInvoice.invoice_number
            ? updatedInvoice
            : item
        );

        setTableData(updatedData);
        setShowModal(false);
        setAdditionalAmount("");
        setNewDueDate(null);
        fetchInvoices();
      } else {
        await showErrorDialog({
          title: "Update Error",
          message: "Failed contact vendor for support.",
        });
      }
    } catch (error) {
      await showErrorDialog({
        title: "IPC Update Error",
        message: "Failed contact vendor for support",
      });
    }
  };

  const handleExportPrompt = async () => {
    const result = await window.electron.promptExportFormat();

    if (result === "excel") {
      const exportResult = await window.electron.exportInvoicesExcel(filteredItems);
      if (exportResult?.success) {
        await showSuccessDialog({
          title: "Export Complete",
          message: `Invoices exported to ${exportResult.filePath}`,
        });
      } else if (exportResult?.canceled) {
        await showWarningDialog({
          title: "Export Cancelled",
          message: "Export Inventory canceled by user.",
        });
      } else {
        await showErrorDialog({
          title: "Export Failed",
          message: "Failure contact vendor for support.",
        });
      }
    }
  };

  const toggleDropdown = () => setFilterDropdownOpen((prev) => !prev);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeNestedFilter, setActiveNestedFilter] = useState(null);
  const toggleNested = (key) =>
    setActiveNestedFilter((prev) => (prev === key ? null : key));

  const handleRowClick = (row) => {
    const prefix = "INV";
    navigate("/show-bill", {
      state: {
        billType: prefix,
        billNumber: `${row.invoice_number}`,
        fromPage: "invoice",
        pageState: {
          page: currentPage,
          filters,
          searchTerm,
          startDate,
          endDate,
        },
      },
    });
  };

  return (
    <div className={styles.inventoryContainer}>
      {/* Top Action Buttons */}
      <div className={styles.topActions}>
        <h2 className={styles.invoiceheading}>Invoice</h2>
        <div className={styles.actionButtons}>
          <button className={styles.exportBtn} onClick={handleExportPrompt}>
            Export
          </button>
          <Link to="/invoice/create-memo">
            <button className={styles.createBtn}>+ Add Memo</button>
          </Link>
          <Link to="/invoice/create-invoice">
            <button className={styles.createBtn}>+ Create Invoice</button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.cardsContainer}>
        {summaryCards.map((card, index) => (
          <div className={styles.card} key={index}>
            <div className={styles.cardTop}>
              <div className={styles.cardIcon}>{getIcon(index)}</div>
              <div className={styles.cardLabel}>
                {card.label} <span>({card.count})</span>
              </div>
            </div>
            <div className={styles.cardAmountTrend}>
              <span className={styles.cardAmount}>{card.value}</span>
              <span className={parseFloat(card.growth) >= 0 ? "green" : "red"}>
                {card.growth}
              </span>
            </div>
          </div>
        ))}
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
          <div className={styles.calendarIcon}>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              placeholderText="Start Date..."
              className={styles.dateFilter}
              popperPlacement="bottom-start"
              dateFormat="dd/MM/yyyy"
              maxDate={endDate}
            />
            <i className="bx bx-calendar icon" />
          </div>
          <div className={styles.calendarIcon}>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              placeholderText="End Date..."
              className={styles.dateFilter}
              popperPlacement="bottom-start"
              dateFormat="dd/MM/yyyy"
              minDate={startDate}
            />
            <i className="bx bx-calendar icon" />
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
                { key: "amount", label: "Total" },
                { key: "paid", label: "Amount Paid" },
                { key: "balance", label: "Balance" },
                { key: "status", label: "Status" },
                { key: "method", label: "Method" },
              ].map(({ key, label }) => (
                <div key={key} className={styles.filterCategory}>
                  <button
                    onClick={() => toggleNested(key)}
                    className={styles.filterCategoryBtn}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "6px",
                    }}
                  >
                    <span>{label}</span>

                    {/* CLEAR ICONS FOR FILTERS */}
                    {key === "amount" &&
                      (filters.amountSymbol || filters.amountValue) && (
                        <i
                          className="bx bx-x"
                          title="Clear Total Filter"
                          style={{
                            color: "red",
                            cursor: "pointer",
                            fontSize: "24px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters((prev) => ({
                              ...prev,
                              amountSymbol: null,
                              amountValue: null,
                            }));
                          }}
                        />
                      )}
                    {key === "paid" &&
                      (filters.paidSymbol || filters.paidValue) && (
                        <i
                          className="bx bx-x"
                          title="Clear Paid Filter"
                          style={{
                            color: "red",
                            cursor: "pointer",
                            fontSize: "24px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters((prev) => ({
                              ...prev,
                              paidSymbol: null,
                              paidValue: null,
                            }));
                          }}
                        />
                      )}
                    {key === "balance" &&
                      (filters.balanceSymbol || filters.balanceValue) && (
                        <i
                          className="bx bx-x"
                          title="Clear Balance Filter"
                          style={{
                            color: "red",
                            cursor: "pointer",
                            fontSize: "24px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters((prev) => ({
                              ...prev,
                              balanceSymbol: null,
                              balanceValue: null,
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
                    {key === "method" && filters.method && (
                      <i
                        className="bx bx-x"
                        title="Clear Method Filter"
                        style={{
                          color: "red",
                          cursor: "pointer",
                          fontSize: "24px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters((prev) => ({ ...prev, method: null }));
                        }}
                      />
                    )}

                    {/* Chevron icon */}
                    <i
                      className={`bx ${
                        activeNestedFilter === key
                          ? "bx-chevron-up"
                          : "bx-chevron-down"
                      }`}
                    ></i>
                  </button>

                  {activeNestedFilter === key && (
                    <div className={styles.nestedFilterContent}>
                      {["amount", "paid", "balance", "due"].includes(key) && (
                        <div className={styles.nestedRowGrid}>
                          <select
                            className={styles.selectInput}
                            value={filters[`${key}Symbol`] || "<"}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                [`${key}Symbol`]: e.target.value,
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
                            type="number"
                            className={styles.numberInput}
                            placeholder="Value"
                            value={filters[`${key}Value`] || ""}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                [`${key}Value`]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}

                      {key === "status" && (
                        <div className={styles.statusFilterGroup}>
                          {["Paid", "Unpaid", "Overdue"].map((statusOpt) => {
                            const statusClass = styles[statusOpt.toLowerCase()];
                            const isSelected = filters.status === statusOpt;

                            return (
                              <span
                                key={statusOpt}
                                className={`${styles.status} ${statusClass}`}
                                style={{
                                  cursor: "pointer",
                                  border: isSelected
                                    ? "2px solid #000"
                                    : "2px solid transparent",
                                  boxShadow: isSelected
                                    ? "0 0 4px rgba(0,0,0,0.3)"
                                    : "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                                onClick={() =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    status:
                                      prev.status === statusOpt
                                        ? null
                                        : statusOpt,
                                  }))
                                }
                              >
                                {statusOpt}
                                {isSelected && (
                                  <i
                                    className="bx bx-x"
                                    style={{
                                      fontSize: "18px", // slightly bigger icon
                                      cursor: "pointer",
                                    }}
                                    title="Clear status"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFilters((prev) => ({
                                        ...prev,
                                        status: null,
                                      }));
                                    }}
                                  />
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {key === "method" && (
                        <div className={styles.methodGroup}>
                          {["Cash", "UPI", "Card"].map((opt) => {
                            const isSelected = filters.method === opt;
                            return (
                              <button
                                key={opt}
                                className={`${styles.methodOption} ${
                                  isSelected ? styles.active : ""
                                }`}
                                onClick={() =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    method: prev.method === opt ? null : opt,
                                  }))
                                }
                              >
                                {opt}
                                {isSelected && (
                                  <i
                                    className="bx bx-x"
                                    title="Clear Method Filter"
                                    style={{
                                      fontSize: "14px",
                                      marginLeft: "6px",
                                      cursor: "pointer",
                                      color: "#000",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFilters((prev) => ({
                                        ...prev,
                                        method: null,
                                      }));
                                    }}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Table */}
      <table className={styles.invoiceTable}>
        <thead>
          <tr>
            <th>Invoice ID</th>
            <th>Customer Name</th>
            <th>Total</th>
            <th>Amount Paid</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Method</th>
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
              <tr
                key={idx}
                onClick={() => handleRowClick(row)}
                style={{ cursor: "pointer" }}
              >
                <td>{row.invoice_number}</td>
                <td>{row.customer_name}</td>
                <td>₹ {row.total.toFixed(2)}</td>
                <td>₹ {row.amount_paid}</td>
                <td>₹ {row.balance}</td>
                <td>
                  <span
                    className={`${styles.status} ${getStatusStyle(row.status)}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td>{row.issueDate}</td>
                <td>{row.dueDate}</td>

                <td className="type-cell-with-actions">
                  {row.paymentMethod}
                  <span className="action-icons">
                    <button
                      className={`table-icon-btn edit ${
                        row.status.toLowerCase() === "paid" ? "disabled" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // 🚫 prevent row click
                        handleEdit(row);
                      }}
                      disabled={row.status.toLowerCase() === "paid"}
                      title={
                        row.status.toLowerCase() === "paid"
                          ? "Paid entries cannot be edited"
                          : "Edit Sale"
                      }
                    >
                      <FiEdit />
                    </button>
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {showModal && selectedInvoice && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Update Invoice</h2>

            <div className={styles.modalContent}>
              <p>
                <strong>Invoice:</strong> {selectedInvoice.invoice_number}
              </p>
              <p>
                <strong>Customer:</strong> {selectedInvoice.customer_name}
              </p>

              <label>Previous Amount Paid</label>
              <input value={`₹ ${selectedInvoice.amount_paid}`} readOnly />

              <label>Add Amount</label>
              <input
                type="number"
                min="0"
                value={additionalAmount}
                onChange={(e) => setAdditionalAmount(e.target.value)}
              />

              <label>New Due Date</label>
              <DatePicker
                selected={newDueDate}
                onChange={(date) => setNewDueDate(date)}
                minDate={parse(
                  selectedInvoice.dueDate,
                  "dd/MM/yyyy",
                  new Date()
                )}
                dateFormat="dd/MM/yyyy"
                className={styles.dateInput}
                placeholderText="Select new due date"
              />
            </div>

            <div className={styles.modalActions}>
              <button onClick={handleSaveChanges} className={styles.saveBtn}>
                Save
              </button>
              <button
                onClick={() => setShowModal(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pagination Code */}
      {/* Pagination Code */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Invoice;
