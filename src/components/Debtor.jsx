import React, { useState, useEffect } from "react";
import styles from "../styles/Debtor.module.css";
import { FiFilter } from "react-icons/fi";
import Pagination from "../recomponents/Pagination";

const Debtors = () => {
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState([]);
  const [customerSales, setCustomerSales] = useState({});

  const [filters, setFilters] = useState({
    unpaidSymbol: null,
    unpaidValue: null,
    billedSymbol: null,
    billedValue: null,
    paidSymbol: null,
    paidValue: null,
    balanceSymbol: null,
    balanceValue: null,
  });
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeNestedFilter, setActiveNestedFilter] = useState(null);
  const SYMBOLS = ["<", "<=", "=", ">=", ">"];
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

  const filteredDebtors = tableData.filter((debtor) => {
    const matchesSearchTerm = debtor.customer_name
      .toLowerCase()
      .startsWith(searchTerm.toLowerCase());

    const matchesUnpaid = matchNumber(
      debtor.unpaid_bills,
      filters.unpaidSymbol,
      filters.unpaidValue
    );
    const matchesBilled = matchNumber(
      debtor.total_amount,
      filters.billedSymbol,
      filters.billedValue
    );
    const matchesPaid = matchNumber(
      debtor.total_paid,
      filters.paidSymbol,
      filters.paidValue
    );
    const matchesBalance = matchNumber(
      debtor.total_balance,
      filters.balanceSymbol,
      filters.balanceValue
    );

    return (
      matchesSearchTerm &&
      matchesUnpaid &&
      matchesBilled &&
      matchesPaid &&
      matchesBalance
    );
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDebtors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDebtors.length / itemsPerPage);

  const fetchDebtors = async () => {
    const debtors = await electron.getAllDebtors();
    setTableData(debtors);
  };

  // call fetchSales when component mounts
  useEffect(() => {
    fetchDebtors();
  }, []);

  const toggleRow = async (customerId) => {
    if (expandedRow === customerId) {
      setExpandedRow(null); // collapse if already open
    } else {
      if (!customerSales[customerId]) {
        const sales = await electron.getOpenSalesByCustomer(customerId);
        setCustomerSales((prev) => ({ ...prev, [customerId]: sales }));
      }
      setExpandedRow(customerId); // open the clicked one
    }
  };

  return (
    <div className={styles.debtorWrapper}>
      <div className={styles.topActions}>
        <h2 className={styles.debtorheading}>Debtors</h2>
      </div>

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
          <button
            className={styles.iconBtn}
            onClick={() => setFilterDropdownOpen((prev) => !prev)}
          >
            <FiFilter /> More Filters
            <i
              className={`bx ${
                filterDropdownOpen ? "bx-chevron-up" : "bx-chevron-down"
              }`}
            />
          </button>

          {filterDropdownOpen && (
            <div className={styles.filterDropdown}>
              {[
                { key: "unpaid", label: "Unpaid Bills" },
                { key: "billed", label: "Total Billed" },
                { key: "paid", label: "Amount Paid" },
                { key: "balance", label: "Total Balance" },
              ].map(({ key, label }) => (
                <div key={key} className={styles.filterCategory}>
                  <button
                    className={styles.filterCategoryBtn}
                    onClick={() =>
                      setActiveNestedFilter((prev) =>
                        prev === key ? null : key
                      )
                    }
                  >
                    <span>{label}</span>

                    {(filters[`${key}Symbol`] || filters[`${key}Value`]) && (
                      <i
                        className="bx bx-x"
                        title={`Clear ${label} Filter`}
                        style={{
                          color: "red",
                          cursor: "pointer",
                          fontSize: "24px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters((prev) => ({
                            ...prev,
                            [`${key}Symbol`]: null,
                            [`${key}Value`]: null,
                          }));
                        }}
                      />
                    )}

                    <i
                      className={`bx ${
                        activeNestedFilter === key
                          ? "bx-chevron-up"
                          : "bx-chevron-down"
                      }`}
                    />
                  </button>

                  {activeNestedFilter === key && (
                    <div className={styles.nestedFilterContent}>
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
                          {SYMBOLS.map((s) => (
                            <option key={s} value={s}>
                              {s}
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <table className={styles.debtortable}>
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Unpaid Bills</th>
            <th>Total Billed</th>
            <th>Amount Paid</th>
            <th>Total Balance</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="7" className={styles.noDataRow}>
                No Customers to Show
              </td>
            </tr>
          ) : (
            currentItems.map((row, idx) => (
              <React.Fragment key={idx}>
                <tr
                  className={`${
                    row.unpaid_bills > 0 ? styles.clickableRow : ""
                  } ${expandedRow === row.customer_id ? styles.activeRow : ""}`}
                  onClick={() =>
                    row.unpaid_bills > 0 ? toggleRow(row.customer_id) : null
                  }
                >
                  <td>{row.customer_name}</td>
                  <td>+91-{row.phone}</td>
                  <td>{row.address}</td>
                  <td className={styles.debtorUnpaidCell}>
                    {row.unpaid_bills}
                  </td>
                  <td>₹ {row.total_amount.toFixed(2)}</td>
                  <td>₹ {row.total_paid.toFixed(2)}</td>
                  <td>₹ {row.total_balance.toFixed(2)}</td>
                </tr>

                {expandedRow === row.customer_id && (
                  <>
                    <tr>
                      <td colSpan="7" className={styles.nestedHeading}>
                        <div className={styles.nestedHeadingText}>
                          History for {row.customer_name}
                        </div>
                      </td>
                    </tr>
                    <tr className={styles.nested}>
                      <td colSpan="7">
                        <table className={styles.nestedtable}>
                          <thead>
                            <tr>
                              <th>Bill No.</th>
                              <th>Issue Date</th>
                              <th>Due Date</th>
                              <th>Total</th>
                              <th>Paid</th>
                              <th>Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerSales[row.customer_id]?.map((sale, i) => (
                              <tr key={i}>
                                <td>{sale.unique_number}</td>
                                <td>{sale.issueDate}</td>
                                <td>{sale.dueDate}</td>
                                <td>₹ {sale.total.toFixed(2)}</td>
                                <td>₹ {sale.amount_paid.toFixed(2)}</td>
                                <td>₹ {sale.balance.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {/* Pagination Code */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Debtors;
