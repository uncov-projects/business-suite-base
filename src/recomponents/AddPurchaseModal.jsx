import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "boxicons/css/boxicons.min.css";
import styles from "../styles/AddPurchaseModal.module.css";

const AddPurchaseModal = ({
  sidebarClosed,
  onClose,
  onSubmit,
}) => {
  // table rows
  const [items, setItems] = useState([
    { description: "", quantity: 0, cost: 0, amount: 0 },
    { description: "", quantity: 0, cost: 0, amount: 0 },
    { description: "", quantity: 0, cost: 0, amount: 0 },
  ]);

  const [memoData, setMemoData] = useState({ total: 0 });

  const updateTotal = (data) => {
    const total = data.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    setMemoData({ total });
  };

  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (["quantity", "cost"].includes(field)) {
      updated[index].amount =
        (Number(updated[index].quantity) || 0) * (Number(updated[index].cost) || 0);
    }
    setItems(updated);
    updateTotal(updated);
  };

  const handleAddRow = () => {
    setItems([
      ...items,
      { description: "", quantity: 0, cost: 0, amount: 0 },
    ]);
  };

  const handleDeleteRow = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    updateTotal(updated);
  };

  const handleSubmit = () => {
    onSubmit(items, memoData.total);
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
          <h3>Add Purchase</h3>
        </div>

        <div className={styles.purchaseInputs}>
          <div className={styles.formGroup}>
            <label>LR Number</label>
            <input type="text" placeholder="Enter LR Number" />
          </div>
          <div className={styles.formGroup}>
            <label>Sender Name</label>
            <input type="text" placeholder="Enter Sender Name" />
          </div>
          <div className={styles.formGroup}>
            <label>From</label>
            <input type="text" placeholder="Enter Source" />
          </div>
          <div className={styles.formGroup}>
            <label>To</label>
            <input type="text" placeholder="Enter Destination" />
          </div>
          <div className={styles.formGroup}>
            <label>Date</label>
            <DatePicker
              selected={null}
              onChange={() => {}}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select Date"
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.memoTable}>
            <thead>
              <tr>
                <th>No.</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleChange(idx, "description", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleChange(idx, "quantity", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.cost}
                      onChange={(e) =>
                        handleChange(idx, "cost", e.target.value)
                      }
                    />
                  </td>
                  <td>₹{item.amount.toFixed(2)}</td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteRow(idx)}
                      title="Delete Row"
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.addRowBtn} onClick={handleAddRow}>
            + Add Row
          </button>
          <span>
            <strong>Grand Total:</strong> ₹{memoData.total.toFixed(2)}
          </span>
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
    </div>
  );
};

export default AddPurchaseModal;
