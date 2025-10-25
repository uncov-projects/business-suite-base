import React from "react";
import styles from "../styles/RecentTransactionsCard.module.css";

const RecentTransactionsCard = ({ transactions }) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Recent Transactions</h3>
      <div className={styles.tableHeader}>
        <span>TRANSACTION ID</span>
        <span>CUSTOMER</span>
        <span>TOTAL</span>
        <span>AMOUNT PAID</span>
        <span>BALANCE</span>
        <span>STATUS</span>
        <span>ISSUE DATE</span>
      </div>

      {transactions.map((txn, index) => (
        <div key={index} className={styles.tableRow}>
          <span>{txn.id}</span>
          <span>{txn.customer}</span>
          <span>{txn.total}</span>
          <span>{txn.paid}</span>
          <span className={txn.balance === "₹0.00" ? styles.purple : styles.red}>
            {txn.balance}
          </span>
          <span>
            <span
              className={`${styles.statusBadge} ${
                txn.status === "Paid"
                  ? styles.paid
                  : txn.status === "Unpaid"
                  ? styles.unpaid
                  : styles.overdue
              }`}
            >
              {txn.status}
            </span>
          </span>
          <span>{txn.date}</span>
        </div>
      ))}
    </div>
  );
};

export default RecentTransactionsCard;
