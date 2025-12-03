import React, { useState } from "react";
import styles from "../styles/Commission.module.css";
import { FiFilter, FiPlus } from "react-icons/fi";
import Pagination from "../recomponents/Pagination";
import AddCommissionModal from "../recomponents/AddCommissionModal";
import AddPartyModal from "../recomponents/AddPartyModal";

const Commission = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);

  const tableData = [
    {
      party_name: "Mohan Traders",
      party_id: "P001",
      unpaid_bills: 2,
      total_amount: 25000,
      commission_paid: 12000,
      commissions: [
        {
          bill_no: "INV001",
          customer_name: "Ravi Kumar",
          bill_date: "2025-09-10",
          commission_date: "2025-09-15",
          total_amount: 12000,
          commission_paid: 5000,
        },
        {
          bill_no: "INV002",
          customer_name: "Ajay Singh",
          bill_date: "2025-09-12",
          commission_date: "2025-09-20",
          total_amount: 13000,
          commission_paid: 7000,
        },
      ],
    },
    {
      party_name: "Sharma Exports",
      party_id: "P002",
      unpaid_bills: 1,
      total_amount: 18000,
      commission_paid: 9000,
      commissions: [
        {
          bill_no: "INV003",
          customer_name: "Rahul Jain",
          bill_date: "2025-09-25",
          commission_date: "2025-09-28",
          total_amount: 18000,
          commission_paid: 9000,
        },
      ],
    },
  ];

  const itemsPerPage = 8;
  const filteredData = tableData.filter((item) =>
    item.party_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const toggleRow = (id) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const handleAddParty = (party) => {
    console.log("New Party Added:", party);
    setShowAddPartyModal(false);
  };

  return (
    <div className={styles.commissionWrapper}>
      {/* Header */}
      <div className={styles.topActions}>
        <h2 className={styles.commissionHeading}>Commission</h2>

        {/* 🔁 SWAPPED BUTTONS */}
        <div className={styles.actionButtons}>
          <button
            className={styles.addPartyBtn}
            onClick={() => setShowAddPartyModal(true)}
          >
            <FiPlus /> Add Party
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className={styles.filtersWrapper}>
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Search Party"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.actionSection}>
          <button
            className={styles.iconBtn}
            onClick={() => setFilterDropdownOpen((prev) => !prev)}
          >
            <FiFilter /> More Filters
          </button>

          {/* 🔁 SWAPPED BUTTONS */}
          <button
            className={styles.addCommissionBtn}
            onClick={() => setShowCommissionModal(true)}
          >
            <FiPlus /> Add Commission
          </button>
        </div>
      </div>

      {/* Main Table */}
      <table className={styles.commissionTable}>
        <thead>
          <tr>
            <th>Party Name</th>
            <th>Party ID</th>
            <th>Unpaid Bills</th>
            <th>Total Amount</th>
            <th>Commission Paid</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="5" className={styles.noDataRow}>
                No Records Found
              </td>
            </tr>
          ) : (
            currentItems.map((row, idx) => (
              <React.Fragment key={idx}>
                <tr
                  className={`${styles.clickableRow} ${
                    expandedRow === row.party_id ? styles.activeRow : ""
                  }`}
                  onClick={() => toggleRow(row.party_id)}
                >
                  <td>{row.party_name}</td>
                  <td>{row.party_id}</td>
                  <td>{row.unpaid_bills}</td>
                  <td>₹ {row.total_amount.toFixed(2)}</td>
                  <td>₹ {row.commission_paid.toFixed(2)}</td>
                </tr>

                {expandedRow === row.party_id && (
                  <>
                    <tr>
                      <td colSpan="5" className={styles.nestedHeading}>
                        <div className={styles.nestedHeadingText}>
                          Commission Details for {row.party_name}
                        </div>
                      </td>
                    </tr>
                    <tr className={styles.nested}>
                      <td colSpan="5">
                        <table className={styles.nestedTable}>
                          <thead>
                            <tr>
                              <th>Bill No.</th>
                              <th>Customer Name</th>
                              <th>Bill Date</th>
                              <th>Commission Date</th>
                              <th>Total Amount</th>
                              <th>Commission Paid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.commissions.map((c, i) => (
                              <tr key={i}>
                                <td>{c.bill_no}</td>
                                <td>{c.customer_name}</td>
                                <td>{c.bill_date}</td>
                                <td>{c.commission_date}</td>
                                <td>₹ {c.total_amount.toFixed(2)}</td>
                                <td>₹ {c.commission_paid.toFixed(2)}</td>
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
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
      {showCommissionModal && (
        <AddCommissionModal onClose={() => setShowCommissionModal(false)} />
      )}
      {showAddPartyModal && (
        <AddPartyModal
          onClose={() => setShowAddPartyModal(false)}
          onSave={handleAddParty}
        />
      )}
    </div>
  );
};

export default Commission;
