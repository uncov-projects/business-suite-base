import React, { useState } from "react";
import "../styles/ShowBillPage.css";
import { showErrorDialog } from "../utils/dialogUtils";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Memo from "./Memo";
import InvoiceBill from "./Invoicebill";

const ShowBillPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [selectedOption, setSelectedOption] = useState("");
  const [searchText, setSearchText] = useState("");

  const [renderComponent, setRenderComponent] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { billType, billNumber, fromPage, pageState } = location.state || {};

  useEffect(() => {
    if (billType && billNumber) {
      if (billType === "INV") {
        setRenderComponent(<InvoiceBill invoice_number={billNumber} />);
      } else if (billType === "MMO") {
        setRenderComponent(<Memo memo_number={billNumber} />);
      }
    }
  }, [billNumber, billType]);

  const handleSearch = async () => {
    if (searchText.length !== 4 || parseInt(searchText, 10) === 0) {
      await showErrorDialog({
        title: "Invalid Number",
        message: "Please enter a valid 4-digit number between 0001 and 9999.",
      });
      const inputElement = document.querySelector(".your-input-class"); // replace with actual input class
      if (inputElement) inputElement.focus();
      return;
    }

    if (
      !selectedOption ||
      searchText.length !== 4 ||
      parseInt(searchText, 10) === 0
    );

    const numberString = `${selectedOption}${searchText}`;

    if (selectedOption === "INV") {
      setRenderComponent(<InvoiceBill invoice_number={numberString} />);
    } else if (selectedOption === "MMO") {
      setRenderComponent(<Memo memo_number={numberString} />);
    } else {
      await showErrorDialog({
        title: "Invalid Type",
        message: "Please select valid bill type MMO/INV.",
      });
    }
  };

  const handleBack = () => {
    if (fromPage === "sales") {
      navigate("/sales", { state: { ...pageState } });
    } else if (fromPage === "invoice") {
      navigate("/invoice", { state: { ...pageState } });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="page-container">
      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? "shrink" : "expand"}`}>
        {/* Navbar */}
        <div className="navbar">
          <h1 className="page-title">Bill</h1>

          <div className="controls">
            {fromPage && (
              <button className="back-btn" onClick={handleBack}>
                ← Back to {fromPage === "sales" ? "Sales" : "Invoice"}
              </button>
            )}
            <select
              className="dropdown"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              <option value="">Select Option</option>
              <option>MMO</option>
              <option>INV</option>
            </select>

            <input
              type="text"
              className="text-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Enter 4-digit number"
            />

            <button className="search-btn" onClick={handleSearch}>
              <i className="bx bx-search"></i>
            </button>
          </div>
        </div>

        {/* Dotted Border Box */}
        <div className="dotted-box">
          {renderComponent ? (
            renderComponent
          ) : (
            <p style={{ textAlign: "center" }}>No Bill to Show.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowBillPage;
