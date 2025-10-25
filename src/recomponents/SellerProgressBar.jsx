import React from "react";
import styles from "../styles/SellerProgressBar.module.css";

const SellerProgressBar = ({
  total,
  inStock,
  lowStock,
  outOfStock,
  seller,
  sellerId,
  balanceAmount,
  paidAmount,
}) => {
  const safeTotal = total || 1;
  const inStockWidth = (inStock / safeTotal) * 100;
  const lowStockWidth = (lowStock / safeTotal) * 100;
  const outOfStockWidth = (outOfStock / safeTotal) * 100;

  return (
    <div className={styles.sellerCard}>
      <div className={styles.sellerHeader}>
        <h3>{seller?.customer_name || "Seller Overview"}</h3>
        <p>Purchase Summary</p>
      </div>

      <div className={styles.sellerProgressTrack}>
        <div
          className={`${styles.progressSegment} ${styles.inStock}`}
          style={{ width: `${inStockWidth}%` }}
        ></div>
        <div
          className={`${styles.progressSegment} ${styles.lowStock}`}
          style={{ width: `${lowStockWidth}%` }}
        ></div>
        <div
          className={`${styles.progressSegment} ${styles.outOfStock}`}
          style={{ width: `${outOfStockWidth}%` }}
        ></div>
      </div>

      <div className={styles.sellerDetails}>
        <div className={styles.infoRow}>
          <div className={`${styles.infoItem} ${styles.ratio1_6}`}>
            <span className={styles.label}>Seller ID</span>
            <span className={styles.value}>{sellerId || "-"}</span>
          </div>
          <div className={`${styles.infoItem} ${styles.ratio3_6}`}>
            <span className={styles.label}>GST Number</span>
            <span className={styles.value}>{seller?.gst_no || "-"}</span>
          </div>
          <div className={`${styles.infoItem} ${styles.ratio1_3}`}>
            <span className={styles.label}>Phone</span>
            <span className={styles.value}>{seller?.phone || "-"}</span>
          </div>
        </div>

        <div className={`${styles.infoItem} ${styles.fullWidth}`}>
          <span className={styles.label}>Address</span>
          <span className={styles.value}>{seller?.address || "-"}</span>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.infoRow}>
          <div className={`${styles.infoItem} ${styles.halfWidth}`}>
            <span className={styles.label}>Balance Amount</span>
            <span className={`${styles.value} ${styles.highlight}`}>
              ₹{balanceAmount?.toLocaleString() || "0"}
            </span>
          </div>
          <div className={`${styles.infoItem} ${styles.halfWidth}`}>
            <span className={styles.label}>Paid Amount</span>
            <span
              className={`${styles.value} ${styles.highlight} ${styles.success}`}
            >
              ₹{paidAmount?.toLocaleString() || "0"}
            </span>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProgressBar;
