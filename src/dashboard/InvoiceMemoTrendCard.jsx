import React, { useState } from "react";
import styles from "../styles/InvoiceMemoTrendCard.module.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const InvoiceMemoTrendCard = ({ dataToday, dataWeek, dataMonth }) => {
  const [view, setView] = useState("Today");

  const getData = () => {
    if (view === "Today") return dataToday;
    if (view === "This Week") return dataWeek;
    return dataMonth;
  };

  const chartData = getData();
  const chartWidth =
    view === "This Month" ? Math.max(chartData.length * 30, 500) : "100%";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>Recent Trends</h3>
        <div className={styles.tabs}>
          {["Today", "This Week", "This Month"].map((v) => (
            <button
              key={v}
              className={`${styles.tabsButton} ${
                view === v ? styles.activeTab : ""
              }`}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            width={chartWidth}
            margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="invoices"
              fill="#5c4dfe"
              name="Invoices"
              barSize={14}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="memos"
              fill="#a29afe"
              name="Memos"
              barSize={14}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InvoiceMemoTrendCard;
