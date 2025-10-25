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

  const handleSubmit = () => {
    onSubmit(paymentData);
    onClose();
  };

  return (
    <div
      className={`${styles.modalOverlay} ${sidebarClosed ? styles.sidebarClosed : ""}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`${styles.modalBox} ${sidebarClosed ? styles.modalExpanded : ""}`}
      >
        <div className={styles.modalHeaderCentered}>
          <h3>Add Transaction</h3>
        </div>

        <div className={styles.formGroup}>
          <label>Balance Amount</label>
          <input type="text" value={paymentData.balance} readOnly />
        </div>
        <div className={styles.formGroup}>
          <label>Payment Amount</label>
          <input
            type="number"
            value={paymentData.payment}
            onChange={(e) =>
              setPaymentData({ ...paymentData, payment: e.target.value })
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>Date of Payment</label>
          <DatePicker
            selected={paymentData.date}
            onChange={(date) => setPaymentData({ ...paymentData, date })}
            dateFormat="yyyy-MM-dd"
            placeholderText="Select date"
          />
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
