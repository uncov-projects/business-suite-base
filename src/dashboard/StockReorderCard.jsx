import React from "react";
import styles from "../styles/StockReorderCard.module.css";
import { PieChart, Pie, Cell } from "recharts";
import { BiParty } from "react-icons/bi"; // using react-icons for boxicons

const StockReorderCard = ({ stockItems, donutData }) => {
  const COLORS = ["#695cfe", "#d65dfe", "#ef4444"];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3>Stock Reorder Suggestions</h3>
          <p>Items needing urgent stock action</p>
        </div>
        <PieChart width={60} height={60}>
          <Pie
            data={donutData}
            dataKey="value"
            innerRadius={20}
            outerRadius={30}
            paddingAngle={2}
          >
            {donutData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </div>

      {stockItems.length === 0 ? (
        <div className={styles.emptyMessage}>
          <div className={styles.emptyIcon}>
            <BiParty />
          </div>
          <div className={styles.emptyText}>All items are sufficiently stocked!</div>
        </div>
      ) : (
        <div className={styles.list}>
          {stockItems.map((item, index) => (
            <div key={index} className={styles.itemRow}>
              <span className={styles.itemName}>{item.item_name}</span>
              <div className={styles.qtyWrapper}>
                <span className={styles.qty}>Qty: {item.quantity}</span>
                <span
                  className={`${styles.status} ${
                    item.status === "Out of Stock"
                      ? styles.outOfStock
                      : styles.lowStock
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockReorderCard;
