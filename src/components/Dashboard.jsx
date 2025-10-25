import React, { useEffect, useState } from "react";
import MetricCard from "../dashboard/MetricCard";
import styles from "../styles/Dashboard.module.css";
import OutstandingMetricCard from "../dashboard/OutstandingMetricCard";
import FastestMovingItemsCard from "../dashboard/FastestMovingItemsCard";
import StockReorderCard from "../dashboard/StockReorderCard";
import RecentTransactionsCard from "../dashboard/RecentTransactionsCard";
import MostFrequentBuyersCard from "../dashboard/MostFrequentBuyersCard";
import InvoiceMemoTrendCard from "../dashboard/InvoiceMemoTrendCard";

const Dashboard = () => {
  const [overdueCustomers, setOverdueCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [salesMetrics, setSalesMetrics] = useState(null);
  const [fastestMovingItems, setFastestMovingItems] = useState([]);
  const [stockReorderData, setStockReorderData] = useState({
    stockData: [],
    donutData: [],
  });
  const [transactions, setTransactions] = useState([]);

  const [mostFrequentBuyers, setMostFrequentBuyers] = useState([]);

  const [invoiceMemoTrends, setInvoiceMemoTrends] = useState({
    today: [],
    week: [],
    month: [],
  });

  function formatDate(dateStr) {
    const [day, month, year] = dateStr.split("/");
    const dateObj = new Date(`${year}-${month}-${day}`);
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  useEffect(() => {
    // Call the exposed preload API
    window.electron.getSalesMetrics().then((data) => {
      setSalesMetrics(data);
    });

    window.electron.getStockReorderDashboardData().then((result) => {
      setStockReorderData(result);
    });

    window.electron.getRecentTransactions().then((result) => {
      if (!result.error) {
        const formatted = result.map((txn) => ({
          id: txn.unique_number,
          customer: txn.customer_name,
          total: `₹${Number(txn.total).toFixed(2)}`,
          paid: `₹${Number(txn.amount_paid).toFixed(2)}`,
          balance: `₹${Number(txn.balance).toFixed(2)}`,
          status: txn.status,
          date: formatDate(txn.issueDate),
        }));
        setTransactions(formatted);
      }
    });

    window.electron.getMostFrequentBuyers().then((data) => {
      if (!data.error) setMostFrequentBuyers(data);
    });

    window.electron.getInvoiceMemoTrends().then((data) => {
      if (!data.error) {
        setInvoiceMemoTrends(data);
      }
    });

    window.electron.getOverdueCustomers().then((data) => {
      if (!data.error) setOverdueCustomers(data);
    });
  }, []);

  useEffect(() => {
    window.electron.getFastestMovingItems().then((data) => {
      if (!data.error) {
        const items = data.map((item) => ({
          name: item.description,
          category: "NA", // adjust if you have category data
          value: item.totalSold,
        }));
        setFastestMovingItems(items);
      }
    });
  }, []);

  const calculateChange = (current, previous) => {
    if (previous === 0) return { change: "0", trend: "up" };
    const diff = current - previous;
    const percentage = ((diff / previous) * 100).toFixed(1);
    return {
      change: Math.abs(percentage),
      trend: diff >= 0 ? "up" : "down",
    };
  };

  const metrics = salesMetrics
    ? [
        {
          title: "Today",
          value: `₹${(salesMetrics.todayTotal || 0).toFixed(2)}`,
          description: "Current day sales",
          ...calculateChange(
            salesMetrics.todayTotal,
            salesMetrics.yesterdayTotal
          ),
        },
        {
          title: "This Week",
          value: `₹${(salesMetrics.weekTotal || 0).toFixed(2)}`,
          description: "Current week sales",
          ...calculateChange(
            salesMetrics.weekTotal,
            salesMetrics.lastWeekTotal
          ),
        },
        {
          title: "This Month",
          value: `₹${(salesMetrics.monthTotal || 0).toFixed(2)}`,
          description: "Current month sales",
          ...calculateChange(
            salesMetrics.monthTotal,
            salesMetrics.lastMonthTotal
          ),
        },
        {
          title: "This Quarter",
          value: `₹${(salesMetrics.quarterTotal || 0).toFixed(2)}`,
          description: "Current quarter sales",
          ...calculateChange(
            salesMetrics.quarterTotal,
            salesMetrics.lastQuarterTotal
          ),
        },
      ]
    : [];

  const dummyData = [
    { name: "Paid", value: 32500, percent: 65 },
    { name: "Unpaid", value: 12500, percent: 25 },
    { name: "Overdue", value: 5000, percent: 10 },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.navbar}>
        <h1 className={styles.pageTitle}>Rambharose Iron Stores</h1>
        <div className={styles.controls}>
          <button
            className={styles.notificationBtn}
            // onClick={() => setShowDropdown(!showDropdown)}
          >
            <i className="bx bx-bell"></i>
          </button>
          {/* {showDropdown && (
            <div className={styles.notificationDropdown}>
              {overdueCustomers.length > 0 ? (
                overdueCustomers.map((cust, idx) => (
                  <div key={idx} className={styles.dropdownItem}>
                    <span>{cust.customer_name}</span>
                    <span>₹{cust.balance_due.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className={styles.dropdownItemEmpty}>
                  No Overdue Customers
                </div>
              )}
            </div>
          )} */}
        </div>
      </div>
      <div className={styles.metricContainer}>
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
      <div className={styles.outstandingSection}>
        <OutstandingMetricCard
          data={dummyData}
          total={50000}
          collectionRate={65}
        />
        <InvoiceMemoTrendCard
          dataToday={invoiceMemoTrends.today}
          dataWeek={invoiceMemoTrends.week}
          dataMonth={invoiceMemoTrends.month}
        />
      </div>
      <div className={styles.recentMetricsSection}>
        <RecentTransactionsCard
          transactions={transactions}
          className={styles.fullWidthCard}
        />
      </div>
      <div className={styles.cardRow}>
        <FastestMovingItemsCard items={fastestMovingItems} />
        <StockReorderCard
          stockItems={stockReorderData.stockData}
          donutData={stockReorderData.donutData}
        />
        <MostFrequentBuyersCard buyers={mostFrequentBuyers} />
      </div>
    </div>
  );
};

export default Dashboard;
