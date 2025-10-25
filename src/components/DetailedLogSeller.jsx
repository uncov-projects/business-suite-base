import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import SellerProgressBar from "../recomponents/SellerProgressBar";
import DataTable from "../recomponents/DataTable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../styles/DetailedLogSeller.module.css";
import "boxicons/css/boxicons.min.css";
import AddPurchaseModal from "../recomponents/AddPurchaseModal";
import AddTransactionModal from "../recomponents/AddTransactionModal";

const DetailedLogSeller = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const seller = state || {
    customer_name: "Unknown Seller",
    gst_no: "GST000000",
    address: "N/A",
    phone: "N/A",
    inStock: 56,
    lowStock: 6,
    outOfStock: 0,
  };

  const total = seller.inStock + seller.lowStock + seller.outOfStock;

  const [activeLog, setActiveLog] = useState("purchase");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [sidebarClosed, setSidebarClosed] = useState(false);

  // Detect sidebar state (open/closed)
  useEffect(() => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;
    const observer = new MutationObserver(() => {
      setSidebarClosed(sidebar.classList.contains("close"));
    });
    observer.observe(sidebar, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Purchase table state


  
  

  
  // Dummy Purchase Data (LR Number, Sender Name, From, To, Date)
  const purchaseData = Array.from({ length: 10 }).map((_, i) => ({
    lrNumber: `LR${1000 + i}`,
    senderName: `Sender ${i + 1}`,
    from: ["Mumbai", "Delhi", "Chennai", "Kolkata", "Bangalore"][i % 5],
    to: ["Pune", "Ahmedabad", "Hyderabad", "Surat", "Indore"][i % 5],
    date: `2025-10-${String(i + 1).padStart(2, "0")}`,
  }));


  return (
    <div className={styles.sellerDetailsContainer}>
      <div className={styles.sellerHeader}>
        <h2>Seller Details</h2>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          ⬅ Back
        </button>
      </div>

      <SellerProgressBar
        total={total}
        inStock={seller.inStock}
        lowStock={seller.lowStock}
        outOfStock={seller.outOfStock}
        seller={seller}
        sellerId={id}
        balanceAmount={12000}
        paidAmount={48000}
      />

      <div className={styles.sellerTableSection}>
        <div className={styles.tableHeaderRow}>
          <h3>
            {activeLog === "purchase"
              ? "Seller Purchase Details"
              : "Seller Transaction Details"}
          </h3>
          <div className={styles.logButtons}>
            {activeLog === "purchase" ? (
              <button
                className={styles.addBtn}
                onClick={() => setShowPurchaseModal(true)}
              >
                + Add Purchase
              </button>
            ) : (
              <button
                className={styles.addBtn}
                onClick={() => setShowTransactionModal(true)}
              >
                + Add Transaction
              </button>
            )}

            <button
              className={`${styles.logBtn} ${
                activeLog === "purchase" ? styles.active : ""
              }`}
              onClick={() => setActiveLog("purchase")}
            >
              Purchase Log
            </button>
            <button
              className={`${styles.logBtn} ${
                activeLog === "transaction" ? styles.active : ""
              }`}
              onClick={() => setActiveLog("transaction")}
            >
              Transaction Log
            </button>
          </div>
        </div>

        <DataTable
          headers={["LR Number", "Sender Name", "From", "To", "Date"]}
          data={purchaseData}
        />
      </div>

      {showPurchaseModal && (
  <AddPurchaseModal
    sidebarClosed={sidebarClosed}
    onClose={() => setShowPurchaseModal(false)}
    onSubmit={(items, total) => console.log("Purchase Submitted:", items, total)}
  />
)}

{showTransactionModal && (
  <AddTransactionModal
    sidebarClosed={sidebarClosed}
    onClose={() => setShowTransactionModal(false)}
    onSubmit={(data) => console.log("Transaction Submitted:", data)}
  />
)}

    </div>
  );
};

export default DetailedLogSeller;
