import React from "react";
import styles from "../styles/MostFrequentBuyersCard.module.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const MostFrequentBuyersCard = ({ buyers }) => {
  const COLORS = [
    "#695CFE",
    "#5C6AFF",
    "#5C86FF",
    "#5CA2FF",
    "#5CBEFF",
    "#5CDAFF",
    "#5CF6FF",
    "#5CFFEC",
  ];

  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>Most Frequent Buyers</h3>
      <p className={styles.subtext}>Top customers by number of purchases</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={buyers} layout="vertical" barSize={14}>
          <XAxis type="number" hide />
          <YAxis dataKey="customer_name" type="category" width={130} />
          <Tooltip formatter={(value) => [`${value}`, "Total Count"]} />
          <Bar dataKey="purchase_count" radius={[4, 4, 4, 4]}>
            {buyers.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MostFrequentBuyersCard;
