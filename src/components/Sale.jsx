import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "../styles/Sale.css";
import {
  FiFileText,
  FiEdit,
  FiFolderPlus,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse, isValid, isAfter, isBefore, isSameDay } from "date-fns";
import Pagination from "../recomponents/Pagination";
import {
  showSuccessDialog,
  showWarningDialog,
  showErrorDialog,
} from "../utils/dialogUtils";

const { electron } = window;

const Sale = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const salesState = location.state || {};

  const [summaryCards, setSummaryCards] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [startDate, setStartDate] = useState(salesState.startDate || null);
  const [endDate, setEndDate] = useState(salesState.endDate || null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [saleNumber, setSaleNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState(salesState.searchTerm || "");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [additionalAmount, setAdditionalAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState(null);

  const [filters, setFilters] = useState(
    salesState.filters || {
      amountSymbol: null,
      amountValue: null,
      paidSymbol: null,
      paidValue: null,
      balanceSymbol: null,
      balanceValue: null,
      status: null,
      type: null,
    }
  );

  // 2. Comparison function for numeric filters
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

  // 3. Filter the table data
  const filteredItems = tableData.filter((sale) => {
    const matchesSearchTerm = [
      sale.unique_number,
      sale.customer_name,
      sale.type,
    ].some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAmount = matchNumber(
      sale.total,
      filters.amountSymbol,
      filters.amountValue
    );
    const matchesPaid = matchNumber(
      sale.amount_paid,
      filters.paidSymbol,
      filters.paidValue
    );
    const matchesBalance = matchNumber(
      sale.balance,
      filters.balanceSymbol,
      filters.balanceValue
    );
    const matchesStatus = !filters.status || sale.status === filters.status;
    const matchestype = !filters.type || sale.type === filters.type;

    const issueDate = parse(sale.issueDate, "dd/MM/yyyy", new Date());
    const matchesStartDate =
      !startDate ||
      isAfter(issueDate, startDate) ||
      isSameDay(issueDate, startDate);
    const matchesEndDate =
      !endDate || isBefore(issueDate, endDate) || isSameDay(issueDate, endDate);

    return (
      matchesSearchTerm &&
      matchesAmount &&
      matchesPaid &&
      matchesBalance &&
      matchesStatus &&
      matchestype &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  // 4. Dropdown toggle logic
  const toggleDropdown = () => setFilterDropdownOpen((prev) => !prev);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeNestedFilter, setActiveNestedFilter] = useState(null);
  const toggleNested = (key) =>
    setActiveNestedFilter((prev) => (prev === key ? null : key));

  // 5. Constants for filter symbols
  const SYMBOLS = ["<", "<=", "=", ">=", ">"];

  const [formData, setFormData] = useState({
    unique_uuid: uuidv4(),
    unique_number: "",
    customer_name: "",
    total: "",
    amount_paid: "",
    balance: 0.0,
    status: "Paid",
    issueDate: "",
    dueDate: "",
    paymentMethod: "",
    type: "Sale",
    customer_id: 0,
    gst_number: "",
  });

  const [currentPage, setCurrentPage] = useState(salesState.page || 1);
  const itemsPerPage = 8;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "total" && { amount_paid: value }),
    }));
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

  // fetch sales data from DB
  const fetchSales = async () => {
    try {
      await electron.updateAllOverdues();
      const sales = await electron.getAllSales();
      setTableData(sales);

      const allCount = sales.length;
      const allValue = sales.reduce((sum, sale) => sum + sale.total, 0);

      const draftSales = sales.filter((s) => s.status === "Unpaid");
      const draftCount = draftSales.length;
      const draftValue = draftSales.reduce((sum, s) => sum + s.amount_paid, 0);

      const balanceSales = sales.filter((s) => s.status === "Unpaid");
      const balanceCount = balanceSales.length;
      const balanceValue = balanceSales.reduce((sum, s) => sum + s.balance, 0);

      const overdueSales = sales.filter((s) => s.status === "Overdue");
      const overdueCount = overdueSales.length;
      const overdueValue = overdueSales.reduce(
        (sum, s) => sum + (s.total - s.amount_paid),
        0
      );

      const paidSales = sales.filter((s) => s.status === "Paid");
      const paidCount = paidSales.length;
      const paidValue = paidSales.reduce((sum, s) => sum + s.total, 0);

      const updatedSummaryCards = [
        {
          label: "All Sales",
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
      console.error("Error updating overdues or fetching sales:", error);
    }
  };

  // call fetchSales when component mounts
  useEffect(() => {
    fetchSales();
  }, []);

  const resetForm = async () => {
    const latest = await window.electron.getLatestSaleNumber();
    const nextNumber = generateNextSaleNumber(latest);
    setSaleNumber(nextNumber);
    setFormData({
      unique_uuid: uuidv4(),
      unique_number: "",
      customer_name: "",
      total: "",
      amount_paid: "",
      balance: 0.0,
      status: "Paid",
      issueDate: "",
      dueDate: "",
      paymentMethod: "",
      type: "Sale",
      gst_number: "",
    });
    setSearch("");
  };

  // Handle Add Sales via Backend API and store it in the Database

  const handleAddSale = async (e) => {
    e.preventDefault();
    const finalCustomerName = formData.customer_name || search;
    const updatedFormData = {
      ...formData,
      unique_number: saleNumber,
      customer_name: finalCustomerName,
      gst_number: "",
    };
    await electron.addSale(updatedFormData); // add new sale to DB
    fetchSales(); // refresh table after adding
    await resetForm(); // Reset form after submit
    setShowModal(false);
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

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim().length === 0) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const res = await window.electron.searchCustomers(value);
    setResults(res);
    setShowDropdown(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchLatestSaleNumber = async () => {
      const latest = await window.electron.getLatestSaleNumber();
      const nextNumber = generateNextSaleNumber(latest);
      setSaleNumber(nextNumber);
    };

    fetchLatestSaleNumber();
  }, []);

  const generateNextSaleNumber = (latest) => {
    if (!latest) return "SAL0001";
    const num = parseInt(latest.replace("SAL", ""), 10);
    return `SAL${String(num).padStart(4, "0")}`;
  };

  const handleExportPrompt = async () => {
    const result = await window.electron.promptExportFormat();

    if (result === "excel") {
      const exportResult = await window.electron.exportSalesExcel(filteredItems);
      if (exportResult?.success) {
        await showSuccessDialog({
          title: "Export Complete",
          message: `Sales exported to ${exportResult.filePath}`,
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
  const handleSaveChanges = async () => {
    if (!selectedInvoice) return;

    const addedAmount = parseFloat(additionalAmount) || 0;
    const currentPaid = parseFloat(selectedInvoice.amount_paid) || 0;
    const currentBalance = parseFloat(selectedInvoice.balance) || 0;
    const updatedPaid = (currentPaid + addedAmount).toFixed(2);
    const updatedBalance = (currentBalance - addedAmount).toFixed(2);

    if (addedAmount > currentBalance) {
      await showWarningDialog({
        title: "Update Error",
        message: `Can not add more than Balance.\n Balance: ₹${currentBalance}`,
      });
      setAdditionalAmount("");
      return;
    }

    const currentDue = parse(selectedInvoice.dueDate, "dd/MM/yyyy", new Date());

    if (newDueDate && newDueDate <= currentDue) {
      await showWarningDialog({
        title: "Update Error",
        message: "New due date must be later than current.",
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
        ? format(newDueDate, "dd/MM/yyyy")
        : selectedInvoice.dueDate,
      invoice_number: selectedInvoice.unique_number,
    };
    try {
      let result_status = "";
      if (updatedInvoice.type === "Invoice") {
        const result = await window.electron.updateInvoice(updatedInvoice);
        result_status = result.success;
      } else if (updatedInvoice.type === "Memo") {
        const result = await window.electron.updateMemo(updatedInvoice);
        result_status = result.success;
      }
      if (result_status) {
        const updatedData = tableData.map((item) =>
          item.unique_number === selectedInvoice.unique_number
            ? updatedInvoice
            : item
        );

        setTableData(updatedData);
        setShowModal(false);
        setAdditionalAmount("");
        setNewDueDate(null);
        fetchSales();
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
    setSelectedInvoice(null);
  };

  // changes
  const handleEdit = (sale) => {
    const prefix = sale.unique_number?.slice(0, 3)?.toUpperCase();

    if (prefix === "INV" || prefix === "MMO") {
      // Open Invoice/Memo modal
      setSelectedInvoice(sale);
      setAdditionalAmount("");
      setNewDueDate(null);
      setInvoiceModal(true);
    } else {
      // Open default Sale modal
      setFormData({ ...sale });
      setSearch(sale.customer_name);
      setShowModal(true);
    }
  };

  const handleRowClick = (row) => {
    if (row.type === "Sale") return;

    const prefix =
      row.type === "Invoice" ? "INV" : row.type === "Memo" ? "MMO" : null;
    if (!prefix) return;

    navigate("/show-bill", {
      state: {
        billType: prefix,
        billNumber: `${row.unique_number}`,
        fromPage: "sales",
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
    <div className="inventory-wrapper">
      <div className="topActions">
        <h2 className="sales-heading">Sales</h2>
        <div className="actionButtons">
          <button className="sales-btn exportBtn" onClick={handleExportPrompt}>
            Export
          </button>
          <button
            className="sales-btn createBtn"
            onClick={() => setShowModal(true)}
          >
            + Add Sale
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="cardsContainer">
        {summaryCards.map((card, index) => (
          <div className="card" key={index}>
            <div className="cardTop">
              <div className="cardIcon">{getIcon(index)}</div>
              <div className="cardLabel">
                {card.label} <span>({card.count})</span>
              </div>
            </div>
            <div className="cardAmountTrend">
              <span className="cardAmount">{card.value}</span>
              <span className={parseFloat(card.growth) >= 0 ? "green" : "red"}>
                {card.growth}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filtersWrapper">
        <div className="filtersContainer">
          <div className="searchIcon">
            <input
              type="text"
              placeholder="Search"
              className="searchInput"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="bx bx-search icon"></i>
          </div>
          <div className="calendarIcon">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              placeholderText="Start Date..."
              className="dateFilter"
              popperPlacement="bottom-start"
              dateFormat="dd/MM/yyyy"
              maxDate={endDate}
            />
            <i className="bx bx-calendar icon" />
          </div>
          <div className="calendarIcon">
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              placeholderText="End Date..."
              className="dateFilter"
              popperPlacement="bottom-start"
              dateFormat="dd/MM/yyyy"
              minDate={startDate}
            />
            <i className="bx bx-calendar icon" />
          </div>
        </div>
        <div className="filterIcons" style={{ position: "relative" }}>
          <button className="iconBtn" onClick={toggleDropdown}>
            <i className="bx bx-filter"></i>
            <span>More Filters</span>
            <i
              className={`bx ${
                filterDropdownOpen ? "bx-chevron-up" : "bx-chevron-down"
              }`}
            ></i>
          </button>

          {filterDropdownOpen && (
            <div className="filterDropdown">
              {[
                { key: "amount", label: "Total" },
                { key: "paid", label: "Amount Paid" },
                { key: "balance", label: "Balance" },
                { key: "status", label: "Status" },
                { key: "type", label: "Type" },
              ].map(({ key, label }) => (
                <div key={key} className="filterCategory">
                  <button
                    onClick={() => toggleNested(key)}
                    className="filterCategoryBtn"
                  >
                    <span>{label}</span>

                    {/* Clear icons */}
                    {key === "amount" &&
                      (filters.amountSymbol || filters.amountValue) && (
                        <i
                          className="bx bx-x"
                          title="Clear Total Filter"
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters((prev) => ({ ...prev, status: null }));
                        }}
                      />
                    )}
                    {key === "type" && filters.type && (
                      <i
                        className="bx bx-x"
                        title="Clear type Filter"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters((prev) => ({ ...prev, type: null }));
                        }}
                      />
                    )}

                    <i
                      className={`bx ${
                        activeNestedFilter === key
                          ? "bx-chevron-up"
                          : "bx-chevron-down"
                      }`}
                    ></i>
                  </button>

                  {activeNestedFilter === key && (
                    <div className="nestedFilterContent">
                      {["amount", "paid", "balance", "due"].includes(key) && (
                        <div className="nestedRowGrid">
                          <select
                            className="selectInput"
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
                            className="numberInput"
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
                        <div className="statusFilterGroup">
                          {["Paid", "Unpaid", "Overdue"].map((statusOpt) => {
                            const keyClass = statusOpt.toLowerCase();
                            const isActive = filters.status === statusOpt;

                            return (
                              <span
                                key={statusOpt}
                                className={`status-label ${keyClass} ${
                                  isActive ? "activestatusfilter" : ""
                                }`}
                                style={{ cursor: "pointer" }}
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
                                {isActive && (
                                  <i
                                    className="bx bx-x"
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
                      {key === "type" && (
                        <div>
                          {["Invoice", "Memo", "Sale"].map((opt) => {
                            const isSelected = filters.type === opt;
                            return (
                              <button
                                key={opt}
                                className={`optionBtn ${
                                  isSelected ? "selectedOption" : ""
                                }`}
                                onClick={() =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    type: prev.type === opt ? null : opt,
                                  }))
                                }
                              >
                                {opt}
                                {isSelected && (
                                  <i
                                    className="bx bx-x"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFilters((prev) => ({
                                        ...prev,
                                        type: null,
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
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Unique ID</th>
            <th>Customer Name</th>
            <th>Total</th>
            <th>Amount Paid</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="9" className="noDataRow">
                No Items to Show
              </td>
            </tr>
          ) : (
            currentItems.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => {
                  if (row.type !== "Sale") handleRowClick(row);
                }}
                style={{
                  cursor: row.type === "Sale" ? "not-allowed" : "pointer",
                }}
              >
                <td>{row.unique_number}</td>
                <td>{row.customer_name}</td>
                <td>₹ {row.total.toFixed(2)}</td>
                <td>₹ {row.amount_paid}</td>
                <td>₹ {row.balance}</td>
                <td>
                  <span
                    className={`status-label ${row.status
                      .toLowerCase()
                      .replace(/\s+/g, "")}`}
                  >
                    {row.status.charAt(0).toUpperCase() +
                      row.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td>{row.issueDate}</td>
                <td>{row.dueDate}</td>
                <td className="type-cell-with-actions">
                  {row.type}
                  <span className="action-icons">
                    <button
                      className={`table-icon-btn edit ${
                        row.type === "Sale" ||
                        ((row.type === "Invoice" || row.type === "Memo") &&
                          row.status.toLowerCase() === "paid")
                          ? "disabled"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // 🚫 prevent row click
                        handleEdit(row);
                      }}
                      disabled={
                        row.type === "Sale" ||
                        ((row.type === "Invoice" || row.type === "Memo") &&
                          row.status.toLowerCase() === "paid")
                      }
                      title={
                        row.type === "Sale"
                          ? "Sales cannot be edited"
                          : row.status.toLowerCase() === "paid"
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
            <h3>Add Sale</h3>
            <form onSubmit={handleAddSale}>
              <input
                type="text"
                name="unique_number"
                placeholder="Unique ID"
                value={saleNumber}
                onChange={(e) => setSaleNumber(e.target.value)}
                required
              />
              <div ref={dropdownRef} className="customer-search-wrapper">
                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search Customers..."
                  className="customer-search-input"
                />
                {showDropdown && results.length > 0 && (
                  <ul className="customer-search-dropdown">
                    {results.map((c) => (
                      <li
                        key={c.customer_id}
                        className="customer-search-item"
                        onClick={() => {
                          setSearch(c.customer_name);
                          setFormData({
                            ...formData,
                            customer_name: c.customer_name,
                            customer_id: c.customer_id,
                          });
                          setShowDropdown(false);
                        }}
                      >
                        {c.customer_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                type="number"
                name="total"
                placeholder="Amount"
                value={formData.total}
                onChange={handleChange}
                required
              />
              <div className="calendarIcon">
                <DatePicker
                  name="issueDate"
                  selected={
                    formData.issueDate
                      ? parse(formData.issueDate, "dd/MM/yyyy", new Date())
                      : null
                  }
                  placeholderText="Issue Date..."
                  className="dateFilter"
                  popperPlacement="bottom-start"
                  dateFormat="dd/MM/yyyy"
                  onChange={(date) =>
                    handleChange({
                      target: {
                        name: "issueDate",
                        value: isValid(date) ? format(date, "dd/MM/yyyy") : "",
                      },
                    })
                  }
                  required
                />
              </div>
              <div className="calendarIcon">
                <DatePicker
                  name="dueDate"
                  selected={
                    formData.dueDate
                      ? parse(formData.dueDate, "dd/MM/yyyy", new Date())
                      : null
                  }
                  placeholderText="Due Date..."
                  className="dateFilter"
                  popperPlacement="bottom-start"
                  dateFormat="dd/MM/yyyy"
                  onChange={(date) =>
                    handleChange({
                      target: {
                        name: "dueDate",
                        value: isValid(date) ? format(date, "dd/MM/yyyy") : "",
                      },
                    })
                  }
                  required
                />
              </div>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
              >
                <option value="">Select Status</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
              </select>
              <div className="modal-buttons">
                <button type="submit" className="inventory-btn">
                  Submit
                </button>
                <button
                  type="button"
                  className="inventory-btn"
                  onClick={async () => {
                    await resetForm();
                    setShowModal(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {invoiceModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Update Invoice</h3>
            <div>
              <p>
                <strong>Invoice:</strong> {selectedInvoice.unique_number}
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
                className="dateFilter"
                placeholderText="Select new due date"
              />
            </div>

            <div className="modal-buttons">
              <button onClick={handleSaveChanges} className="inventory-btn">
                Save
              </button>
              <button
                onClick={() => {
                  setInvoiceModal(false);
                  setSelectedInvoice(null);
                }}
                className="inventory-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sale;
