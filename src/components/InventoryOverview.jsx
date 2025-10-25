// components/InventoryOverview.jsx
import React, { useEffect, useState } from "react";
import styles from "../styles/Inventory.module.css";

const { electron } = window;

const InventoryOverview = () => {
  const [counts, setCounts] = useState({
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const fetchStockCounts = async () => {
    const result = await electron.getStockOverviewCounts();
    setCounts(result);
  };

  useEffect(() => {
    fetchStockCounts();
    const handler = () => fetchStockCounts();
    window.addEventListener("inventoryUpdated", handler);

    return () => {
      window.removeEventListener("inventoryUpdated", handler);
    };
  }, []);

  const totalProducts = counts.inStock + counts.lowStock + counts.outOfStock;

  const inStockWidth = totalProducts
    ? (counts.inStock / totalProducts) * 100
    : 0;
  const lowStockWidth = totalProducts
    ? (counts.lowStock / totalProducts) * 100
    : 0;
  const outOfStockWidth = totalProducts
    ? (counts.outOfStock / totalProducts) * 100
    : 0;

  return (
    <div className={styles.overviewCard}>
      <div className={styles.rightSection}>
        <h3 className={styles.productCount}>
          {totalProducts} <span>Products</span>
        </h3>
        <div className={styles.barWrapper}>
          <div
            className={styles.bar}
            style={{ backgroundColor: "#695cfe", width: `${inStockWidth}%` }}
          ></div>
          <div
            className={styles.bar}
            style={{ backgroundColor: "#d65dfe", width: `${lowStockWidth}%` }}
          ></div>
          <div
            className={styles.bar}
            style={{ backgroundColor: "#fe5d85", width: `${outOfStockWidth}%` }}
          ></div>
        </div>
        <div className={styles.legend}>
          <span>
            <span
              className={styles.dot}
              style={{ background: "#695cfe" }}
            ></span>{" "}
            In stock: {counts.inStock}
          </span>
          <span>
            <span
              className={styles.dot}
              style={{ background: "#d65dfe" }}
            ></span>{" "}
            Low stock: {counts.lowStock}
          </span>
          <span>
            <span
              className={styles.dot}
              style={{ background: "#fe5d85" }}
            ></span>{" "}
            Out of stock: {counts.outOfStock}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InventoryOverview;
