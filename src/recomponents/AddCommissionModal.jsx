import React, { useState, useEffect, useCallback } from "react";
import styles from "../styles/AddCommissionModal.module.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "boxicons/css/boxicons.min.css";

const AddCommissionModal = ({ onClose }) => {
  const [memoNumber, setMemoNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [billDate, setBillDate] = useState(new Date());
  const [commissionDate, setCommissionDate] = useState(new Date());
  const [totalAmount, setTotalAmount] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [mode, setMode] = useState("percent"); // "percent" | "amount"
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 🔹 Auto-calculate
  useEffect(() => {
    if (!totalAmount) return;
    const amt = parseFloat(totalAmount);
    if (mode === "percent") {
      const pct = parseFloat(commissionPercent);
      if (!isNaN(amt) && !isNaN(pct)) {
        setCommissionAmount(((amt * pct) / 100).toFixed(2));
      }
    } else if (mode === "amount") {
      const commAmt = parseFloat(commissionAmount);
      if (!isNaN(amt) && !isNaN(commAmt)) {
        setCommissionPercent(((commAmt / amt) * 100).toFixed(2));
      }
    }
  }, [commissionPercent, commissionAmount, totalAmount, mode]);

  // 🔹 Manual fetch only when search icon clicked
  const fetchMemoAndFill = useCallback(async () => {
    if (!memoNumber?.trim()) {
      setErrorMessage("Please enter a memo number before searching.");
      return;
    }

    const memoFullNumber = `MMO${memoNumber.trim()}`;
    setLoading(true);
    setErrorMessage("");

    try {
      // Simulate backend call
      const rows = await window.electron.fetchMemoData(memoFullNumber);

      if (rows && rows.length > 0) {
        const memoData = rows[0];
        setCustomerId(memoData.customer_id || "");
        setCustomerName(memoData.customer_name || "");
        setBillDate(memoData.date ? new Date(memoData.date) : new Date());
        setTotalAmount(memoData.total_amount || memoData.total || "");
      } else {
        setCustomerId("");
        setCustomerName("");
        setTotalAmount("");
        setErrorMessage(`No memo found for: ${memoFullNumber}`);
      }
    } catch (err) {
      console.error("Error fetching memo:", err);
      setErrorMessage("Error fetching memo data.");
    } finally {
      setLoading(false);
    }
  }, [memoNumber]);

  // 🔹 Remove the old useEffect that auto-fetched on typing

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!memoNumber.trim() || !customerName.trim()) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    const payload = {
      memoNumber: `MMO${memoNumber.trim()}`,
      customerId: customerId || null,
      customerName: customerName.trim(),
      billDate: billDate ? billDate.toISOString().slice(0, 10) : null,
      commissionDate: commissionDate
        ? commissionDate.toISOString().slice(0, 10)
        : null,
      totalAmount: parseFloat(totalAmount),
      commissionPercent: parseFloat(commissionPercent),
      commissionAmount: parseFloat(commissionAmount),
      commissionMode: mode,
    };

    console.log("Add commission payload:", payload);
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Add Commission</h2>

        {errorMessage && <div className={styles.errorBox}>{errorMessage}</div>}

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* Memo Section */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>Memo Details</div>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Memo Number</label>
                <div className={styles.memoContainer}>
                  <span className={styles.memoPrefix}>MMO</span>
                  <input
                    type="text"
                    placeholder="Enter number"
                    value={memoNumber}
                    onChange={(e) => setMemoNumber(e.target.value)}
                  />
                  <i
                    className={`bx bx-search ${styles.searchIcon}`}
                    title="Search Memo"
                    onClick={fetchMemoAndFill}
                  ></i>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="Auto-filled after search"
                  value={customerName}
                  readOnly
                  className={styles.autoFilled}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>Dates</div>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Bill Date</label>
                <DatePicker
                  selected={billDate}
                  onChange={(date) => setBillDate(date)}
                  className={`${styles.dateInput} ${styles.autoFilled}`}
                  dateFormat="yyyy-MM-dd"
                  readOnly
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
            </div>
          </div>

          {/* Commission Section */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>Commission Info</div>

            {/* 🔥 Toggle */}
            <div className={styles.toggleRow}>
              <label>
                <input
                  type="radio"
                  name="mode"
                  value="percent"
                  checked={mode === "percent"}
                  onChange={() => setMode("percent")}
                />
                By Percentage
              </label>
              <label>
                <input
                  type="radio"
                  name="mode"
                  value="amount"
                  checked={mode === "amount"}
                  onChange={() => setMode("amount")}
                />
                By Amount
              </label>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Total Amount</label>
                <input
                  type="number"
                  placeholder="Auto-filled after search"
                  value={totalAmount}
                  readOnly
                  className={styles.autoFilled}
                />
              </div>

              {mode === "percent" ? (
                <div className={styles.inputGroup}>
                  <label>Commission %</label>
                  <input
                    type="number"
                    placeholder="Enter %"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              ) : (
                <div className={styles.inputGroup}>
                  <label>Commission Amount</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Calculated Value</label>
                <input
                  type="text"
                  readOnly
                  value={
                    mode === "percent"
                      ? `${commissionAmount || 0} (Amount)`
                      : `${commissionPercent || 0}%`
                  }
                  className={styles.autoFilled}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? "Fetching..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCommissionModal;
