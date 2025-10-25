import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "../styles/Dashboard.module.css";

const SalesTrendChart = ({ data, title }) => {
  return (
    <div className={styles.chartWrapper}>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="totalSales" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="invoiceSales" stroke="#82ca9d" strokeWidth={2} />
          <Line type="monotone" dataKey="memoSales" stroke="#ff7f7f" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesTrendChart;
