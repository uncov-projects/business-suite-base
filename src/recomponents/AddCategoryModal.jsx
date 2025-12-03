import React from "react";
import styles from "../styles/AddCategoryModal.module.css";

const AddCategoryModal = ({
  show,
  newCategory,
  setNewCategory,
  onSave,
  onClose,
}) => {
  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Add Category</h2>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* Category ID */}
          <div className={styles.formGroup}>
            <label>Category ID</label>
            <input
              type="text"
              value={newCategory.id}
              disabled
              className={`${styles.inputField} ${styles.autoFilled}`}
            />
          </div>

          {/* Category Name */}
          <div className={styles.formGroup}>
            <label>Category Name</label>
            <input
              type="text"
              placeholder="Enter category name"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
              required
              className={styles.inputField}
            />
          </div>

          {/* Action Buttons */}
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

export default AddCategoryModal;
