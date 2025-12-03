import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "boxicons/css/boxicons.min.css";
import styles from "../styles/AddPurchaseModal.module.css";

const AddPurchaseModal = ({ sidebarClosed, onClose, onSubmit }) => {
  const [items, setItems] = useState([
    { description: "", quantity: 0, cost: 0, amount: 0 },
    { description: "", quantity: 0, cost: 0, amount: 0 },
    { description: "", quantity: 0, cost: 0, amount: 0 },
  ]);

  const [formData, setFormData] = useState({
    lrNumber: "",
    senderName: "",
    from: "",
    to: "",
    date: null,
    deliveryCharge: "",
  });

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
    setItems([...items, { description: "", quantity: 0, cost: 0, amount: 0 }]);
  };

  const handleDeleteRow = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    updateTotal(updated);
  };

  const handleSubmit = () => {
    const totalWithDelivery =
      memoData.total + Number(formData.deliveryCharge || 0);
    onSubmit({ ...formData, items, total: totalWithDelivery });
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
        <h2 className={styles.modalTitle}>Add Purchase</h2>

        {/* --- Section 1: Basic Details --- */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Purchase Details</div>

          {/* First Row - LR & Sender Name */}
          <div className={styles.rowSplit}>
            <div className={`${styles.formGroup} ${styles.lrField}`}>
              <label>LR Number</label>
              <input
                type="text"
                placeholder="Enter LR Number"
                value={formData.lrNumber}
                onChange={(e) =>
                  setFormData({ ...formData, lrNumber: e.target.value })
                }
              />
            </div>
            <div className={`${styles.formGroup} ${styles.nameField}`}>
              <label>Sender Name</label>
              <input
                type="text"
                placeholder="Enter Sender Name"
                value={formData.senderName}
                onChange={(e) =>
                  setFormData({ ...formData, senderName: e.target.value })
                }
              />
            </div>
          </div>

          {/* Second Row - From, To, Date, Delivery Charge */}
          <div className={styles.rowFour}>
            <div className={styles.formGroup}>
              <label>From</label>
              <input
                type="text"
                placeholder="Enter Source"
                value={formData.from}
                onChange={(e) =>
                  setFormData({ ...formData, from: e.target.value })
                }
              />
            </div>
            <div className={styles.formGroup}>
              <label>To</label>
              <input
                type="text"
                placeholder="Enter Destination"
                value={formData.to}
                onChange={(e) =>
                  setFormData({ ...formData, to: e.target.value })
                }
              />
            </div>
            <div className={styles.formGroup}>
              <label>Date</label>
              <DatePicker
                selected={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select Date"
                className={styles.dateInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Delivery Charge</label>
              <input
                type="number"
                placeholder="Enter Charge"
                value={formData.deliveryCharge}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryCharge: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* --- Section 2: Table --- */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Items</div>
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
        </div>

        {/* --- Footer --- */}
        <div className={styles.modalActions}>
          <button className={styles.addRowBtn} onClick={handleAddRow}>
            + Add Row
          </button>

          <div className={styles.totalDisplay}>
            <strong>Grand Total:</strong> ₹
            {(memoData.total + Number(formData.deliveryCharge || 0)).toFixed(2)}
          </div>

          <div className={styles.footerButtons}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.saveBtn} onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPurchaseModal;
