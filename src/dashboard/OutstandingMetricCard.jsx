import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell } from "recharts";
import styles from "../styles/OutstandingMetricCard.module.css";

const OutstandingMetricCard = () => {
  const [data, setData] = useState([
    { name: "Paid", value: 0, color: "#22c55e" },
    { name: "Unpaid", value: 0, color: "#facc15" },
    { name: "Overdue", value: 0, color: "#ef4444" },
  ]);

  useEffect(() => {
    window.electron.getOutstandingMetrics().then((metrics) => {
      if (!metrics.error) {
        setData([
          { name: "Paid", value: metrics.paid, color: "#695cfe" },
          { name: "Unpaid", value: metrics.unpaid, color: "#d65dfe" },
          { name: "Overdue", value: metrics.overdue, color: "#fe5d85" },
        ]);
      }
    });
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const collectionRate = total === 0 ? 0 : ((data[0].value / total) * 100).toFixed(0);

  const displayData = data.filter(item => item.value > 0);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3>Outstanding Distribution</h3>
          <p>Payment status overview</p>
        </div>
        <span className={styles.totalAmount}>₹ {total.toLocaleString()}</span>
      </div>

      <div className={styles.chart}>
        <PieChart width={200} height={200}>
          <Pie
            data={displayData}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {displayData.map((item, index) => (
              <Cell key={`cell-${index}`} fill={item.color} />
            ))}
          </Pie>
        </PieChart>

        <div
          className={`${styles.chartCenter} ${
            total.toLocaleString().length > 9 ? styles.smallText : ""
          }`}
        >
          ₹{total.toLocaleString()}
        </div>
      </div>

      <div className={styles.collectionRate}>
        <span>Collection Rate</span>
        <span className={styles.collectionValue}>
          {collectionRate}% <span className={styles.collected}>collected</span>
        </span>
      </div>

      <div className={styles.legend}>
        {displayData.map((item) => (
          <div key={item.name} className={styles.legendItem}>
            <div className={styles.legendLeft}>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: item.color }}
              />
              <div className={styles.legendText}>
                <strong>{item.name}</strong>
                <p>{((item.value / total) * 100).toFixed(0)}% of total</p>
              </div>
            </div>
            <span className={styles.legendAmount}>
              ₹{item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutstandingMetricCard;
