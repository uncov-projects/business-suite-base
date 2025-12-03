import React from "react";
import styles from "../styles/AddSellerModal.module.css";

const AddSellerModal = ({
  show,
  editMode,
  formData,
  setFormData,
  onSave,
  onClose,
}) => {
  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>
          {editMode ? "Edit Seller" : "Add Seller"}
        </h2>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* Seller Info Section */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>Seller Details</div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Seller ID</label>
                <input
                  type="text"
                  name="customer_id"
                  placeholder="Enter Seller ID"
                  value={formData.customer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_id: e.target.value })
                  }
                  disabled={editMode}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Seller Name</label>
                <input
                  type="text"
                  name="customer_name"
                  placeholder="Enter Seller Name"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>GST Number</label>
                <input
                  type="text"
                  name="gst_no"
                  placeholder="Enter GST Number"
                  value={formData.gst_no}
                  onChange={(e) =>
                    setFormData({ ...formData, gst_no: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Enter Phone Number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter Address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>
              {editMode ? "Update Seller" : "Save Seller"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSellerModal;
