import React from "react";
import styles from "../styles/MetricCard.module.css";

const MetricCard = ({ title, value, description, change, trend }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{title}</span>
          <i className={`bx bx-info-circle ${styles.infoIcon}`}></i>
        </div>
        <div
          className={`${styles.changeBadge} ${
            trend === "up" ? styles.greenBadge : styles.redBadge
          }`}
        >
          <i
            className={`bx ${
              trend === "up" ? "bx-trending-up" : "bx-trending-down"
            }`}
          ></i>{" "}
          {change}%
        </div>
      </div>

      <h2 className={styles.value}>{value}</h2>
      <p className={styles.description}>{description}</p>
    </div>
  );
};

export default MetricCard;
