import React from "react";
import styles from "../styles/FastestMovingItemsCard.module.css";
import { ArrowUpRight } from "lucide-react";

const FastestMovingItemsCard = ({ items = [] }) => {
  const colors = ["#695CFE", "#5C6AFF", "#5C86FF", "#5CA2FF", "#5CBEFF"];
  const maxValue = Math.max(...items.map((item) => item.value), 100);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <ArrowUpRight size={20} color="#9333ea" />
        <h3>Fastest Moving Items</h3>
      </div>
      <p className={styles.subtext}>
        Top performing products by sales velocity
      </p>

      <div className={styles.list}>
        {items.map((item, index) => (
          <div className={styles.itemRow} key={index}>
            <div className={styles.rank}>#{index + 1}</div>
            <div className={styles.itemDetails}>
              <div className={styles.itemName}>{item.name}</div>
              <div className={styles.itemCategory}>{item.category}</div>
              <div className={styles.progressBarWrapper}>
                <div
                  className={styles.progressBar}
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                />
              </div>
            </div>
            <div className={styles.itemValue}>{item.value.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FastestMovingItemsCard;
