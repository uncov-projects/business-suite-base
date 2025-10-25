import React, { useState } from "react";
import styles from "../styles/AddCommissionModal.module.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AddCommissionModal = ({ onClose }) => {
  const [memoNumber, setMemoNumber] = useState("");
  const [billDate, setBillDate] = useState(new Date());
  const [commissionDate, setCommissionDate] = useState(new Date());
  const [totalAmount, setTotalAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ memoNumber, billDate, commissionDate, totalAmount });
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Add Commission</h2>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.inputGroup}>
            <label>Memo Number</label>
            <div className={styles.memoContainer}>
              <span className={styles.memoPrefix}>MMO</span>
              <input
                type="number"
                placeholder="Enter number"
                value={memoNumber}
                onChange={(e) => setMemoNumber(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Bill Date</label>
            <DatePicker
              selected={billDate}
              onChange={(date) => setBillDate(date)}
              className={styles.dateInput}
              dateFormat="yyyy-MM-dd"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Commission Date</label>
            <DatePicker
              selected={commissionDate}
              onChange={(date) => setCommissionDate(date)}
              className={styles.dateInput}
              dateFormat="yyyy-MM-dd"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Total Amount</label>
            <input
              type="number"
              placeholder="Enter amount"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCommissionModal;
