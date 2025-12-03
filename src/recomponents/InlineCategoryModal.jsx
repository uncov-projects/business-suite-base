import React from "react";
import styles from "../styles/InlineCategoryModal.module.css";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const InlineCategoryModal = ({
  category,
  sellers,
  onClose,
  onAddSeller,
  onEditSeller,
  onDeleteSeller,
  onSellerClick,
}) => {
  if (!category) return null;

  return (
    <div className={styles.inlineModal}>
      {/* Header */}
      <div className={styles.inlineModalHeader}>
        <h3>
          Category:{" "}
          <span className={styles.modalCategoryName}>
            {category.customer_name}
          </span>
        </h3>

        <div className={styles.modalHeaderActions}>
          <button className={styles.addSellerBtn} onClick={onAddSeller}>
            + Add Seller
          </button>
          <button className={styles.closeModalBtn} onClick={onClose}>
            <i className="bx bx-x"></i>
          </button>
        </div>
      </div>

      {/* Seller Table */}
      <div className={styles.inlineModalBody}>
        <table className={styles.sellerTable}>
          <thead>
            <tr>
              <th>Seller ID</th>
              <th>Seller Name</th>
              <th>GST No</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!sellers || sellers.length === 0) ? (
              <tr>
                <td colSpan="6" className={styles.noDataRow}>
                  No Sellers Found
                </td>
              </tr>
            ) : (
              sellers.map((seller, i) => (
                <tr
                  key={i}
                  className={styles.subRow}
                  onClick={() => onSellerClick(seller)}
                >
                  <td>{seller.customer_id}</td>
                  <td>{seller.customer_name}</td>
                  <td>{seller.gst_no}</td>
                  <td>{seller.phone}</td>
                  <td>{seller.address}</td>
                  <td
                    className={styles.actionCell}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`${styles.tableIconBtn} ${styles.editIcon}`}
                      onClick={() => onEditSeller(seller)}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className={`${styles.tableIconBtn} ${styles.deleteIcon}`}
                      onClick={() => onDeleteSeller(seller.customer_id)}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InlineCategoryModal;
