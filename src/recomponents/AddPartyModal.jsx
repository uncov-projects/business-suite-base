import React, { useState } from "react";
import styles from "../styles/AddPartyModal.module.css";

const AddPartyModal = ({ sidebarClosed, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: "", phone: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;
    onSave(formData);
    onClose();
    setFormData({ name: "", phone: "" });
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
        <h2 className={styles.modalTitle}>Add Party</h2>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.sectionCard}>
            <div className={styles.formGroup}>
              <label>Party Name</label>
              <input
                type="text"
                placeholder="Enter party name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <input
                type="text"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
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

export default AddPartyModal;
