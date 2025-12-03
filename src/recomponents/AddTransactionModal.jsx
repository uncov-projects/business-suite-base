import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../styles/AddTransactionModal.module.css";

const AddTransactionModal = ({ sidebarClosed, onClose, onSubmit }) => {
  const [paymentData, setPaymentData] = useState({
    balance: 12000,
    payment: "",
    date: null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(paymentData);
    onClose();
  };

  return (
    <div
      className={`${styles.modalOverlay} ${
        sidebarClosed ? styles.sidebarClosed : ""
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`${styles.modalBox} ${
          sidebarClosed ? styles.modalExpanded : ""
        }`}
      >
        <h2 className={styles.modalTitle}>Add Transaction</h2>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* --- Section: Payment Details --- */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>Transaction Details</div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Balance Amount</label>
                <input
                  type="text"
                  value={paymentData.balance}
                  readOnly
                  className={styles.readOnlyField}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Payment Amount</label>
                <input
                  type="number"
                  placeholder="Enter payment amount"
                  value={paymentData.payment}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, payment: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Date of Payment</label>
                <DatePicker
                  selected={paymentData.date}
                  onChange={(date) => setPaymentData({ ...paymentData, date })}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select date"
                  className={styles.dateInput}
                  required
                />
              </div>
            </div>
          </div>

          {/* --- Sticky Footer --- */}
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
