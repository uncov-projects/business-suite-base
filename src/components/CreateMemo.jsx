// src/components/CreateInvoice.jsx
import React, { useEffect, useState, useRef } from "react";
import "../styles/CreateInvoice.css";
import { useNavigate } from "react-router-dom";
import logo2 from "../assets/LOGO-5.png";
import { v4 as uuidv4 } from "uuid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse, isValid } from "date-fns";
import { Tooltip as ReactTooltip } from "react-tooltip";
import AddCustomer from "./AddCustomer";
import { showConfirmDialog, showErrorDialog } from "../utils/dialogUtils";
import WaitDialog from "../recomponents/WaitDialog";
import NotesSection from "../recomponents/NotesSection";
import AdditionalInfoBox from "../recomponents/AdditionalInfoBox";

const CreateMemo = () => {
  const [items, setItems] = useState([
    {
      description: "",
      qty: 0,
      unit: "",
      cost: "",
      amount: 0,
      item_id: 0,
      available_stock: 0,
    },
  ]);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [item_name, setItemName] = useState([]);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);
  const [customerAddress, setCustomerAddress] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [memo_number, setMemoNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [customer_id, setCustomerID] = useState(0);
  const memo_uuid = uuidv4();

  // ------------------ DISCOUNT STATE ------------------ //
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountType, setDiscountType] = useState("amount"); // 'amount' | 'percent'
  const [discountValue, setDiscountValue] = useState("");

  const [customerError, setCustomerError] = useState("");
  const [itemErrors, setItemErrors] = useState([]);
  const [issueDateError, setIssueDateError] = useState("");
  const [dueDateError, setDueDateError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    address: "",
    joinDate: "",
    customerType: "",
    email: "",
  });

  // ------------------ NOTE POPUP STATE ------------------ //
  const clickTimeoutRef = useRef();
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [showWaitDialog, setShowWaitDialog] = useState(false);

  const TOTAL_LIMIT = 9;
  const MAX_NOTES = Math.min(
    5,
    TOTAL_LIMIT - items.length - selectedNotes.length
  );
  const MAX_ITEMS = TOTAL_LIMIT - selectedNotes.length;

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    setCustomerID(null);
    if (value.trim().length === 0) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const res = await window.electron.searchCustomers(value);
    setResults(res);
    setShowDropdown(true);
  };

  const getStatus = () => {
    const balance = finalTotal - amountPaid - discountAmount;
    return balance > 0 ? "Unpaid" : "Paid";
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const result = await electron.addCustomer(formData);
    const newId = result.id;
    setFormData({
      customer_name: "",
      phone: "",
      address: "",
      joinDate: "",
      customerType: "",
      email: "",
    });
    setShowModal(false);

    setSearch(formData.customer_name);
    setCustomerID(newId);
    setCustomerAddress(formData.address);
  };

  const handleSaveSale = async () => {
    const notesIdList = selectedNotes?.length
      ? selectedNotes.map((note) => note.notes_id)
      : [];
    const sales = {
      unique_uuid: memo_uuid,
      unique_number: memo_number,
      customer_name: search,
      customer_address: customerAddress,
      subtotal: calculateSubtotal(),
      gst: 0.0,
      discount: safeDiscountAmount,
      total: finalTotal.toFixed(2),
      amount_paid: safeAmountPaid,
      balance: (finalTotal - safeAmountPaid).toFixed(2),
      status: getStatus(),
      issueDate,
      dueDate,
      paymentMethod,
      type: "Memo",
      customer_id,
      notes_added: JSON.stringify(notesIdList),
    };
    await window.electron.addSale(sales);
  };

  const handleSaveMemo = async () => {
    const notesIdList = selectedNotes?.length
      ? selectedNotes.map((note) => note.notes_id)
      : [];
    const memoData = {
      memo_uuid,
      memo_number,
      customer_name: search,
      customer_address: customerAddress,
      subtotal: calculateSubtotal(),
      gst: 0.0,
      discount: safeDiscountAmount,
      total: finalTotal.toFixed(2),
      amount_paid: safeAmountPaid,
      balance: (finalTotal - safeAmountPaid).toFixed(2),
      status: getStatus(),
      issueDate,
      dueDate,
      paymentMethod,
      customer_id,
      notes_added: JSON.stringify(notesIdList),
    };
    await window.electron.addMemo(memoData);

    for (const item of items) {
      const itemData = {
        sold_item_uuid: uuidv4(),
        unique_number: memo_number,
        unique_uuid: memo_uuid,
        description: item.description,
        unit: item.unit,
        quantity: item.qty,
        cost: item.cost,
        amount: item.amount,
        item_id: item.item_id,
      };
      await window.electron.addSoldItem(itemData);
    }

    await window.electron.updateInventoryAfterSales();
  };

  const handleSaveAndContinue = async () => {
    const confirmed = await showConfirmDialog({
      title: "Generate Memo",
      message: "Do you want to continue and generate Memo?",
    });

    if (confirmed) {
      // Show Wait Dialog via state
      setShowWaitDialog(true);

      try {
        await handleSaveMemo();
        await handleSaveSale();
        setShowWaitDialog(false); // Hide wait dialog
        navigate(`/invoice/create-memo/memo/${memo_number}`);
      } catch (error) {
        setShowWaitDialog(false);
        await showErrorDialog({
          title: "Save Error",
          message: "Failed to save data. Please try again.",
        });
      }
    }
  };

  const handleBackClick = () => {
    navigate("/invoice");
  };

  const handleDeleteItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);

    const updatedErrors = itemErrors.filter((_, i) => i !== index);
    setItemErrors(updatedErrors);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchLatestMemoNumber = async () => {
      const latest = await window.electron.getLatestMemoNumber();
      const nextNumber = generateNextMemoNumber(latest);
      setMemoNumber(nextNumber);
    };

    fetchLatestMemoNumber();
  }, []);

  const generateNextMemoNumber = (latest) => {
    if (!latest) return "MMO0001";
    const num = parseInt(latest.replace("MMO", ""), 10);
    return `MMO${String(num).padStart(4, "0")}`;
  };

  const handleAddItem = () => {
    if (items.length >= MAX_ITEMS) {
      return;
    }
    setItems([
      ...items,
      {
        description: "",
        qty: 0,
        unit: "",
        cost: "",
        amount: 0,
        item_id: 0,
        available_stock: 0,
      },
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;

    const updatedErrors = [...itemErrors];
    updatedErrors[index] = updatedErrors[index] || {};

    if (field === "qty") {
      const availableQty = updatedItems[index].available_stock;

      if (updatedItems[index].item_id === 0) {
        // Set error for description on qty input
        updatedErrors[index].description =
          "Item not found. Please select from the list.";
        updatedErrors[index].qty = "";
      } else if (availableQty <= 0) {
        updatedErrors[index].qty = "Item out of stock!";
        updatedErrors[index].description = "";
      } else if (parseFloat(value) > availableQty) {
        updatedErrors[index].qty = "Not enough stock available!";
        updatedErrors[index].description = "";
      } else {
        updatedErrors[index].qty = "";
        updatedErrors[index].description = "";
      }
    }

    const qty = parseFloat(updatedItems[index].qty) || 0;
    const cost = parseFloat(updatedItems[index].cost) || 0;
    updatedItems[index].amount = qty * cost;

    setItems(updatedItems);
    setItemErrors(updatedErrors);
  };

  const validateForm = () => {
    let hasError = false;
    let lastErrorIndex = -1;

    // Validate customer
    if (!search.trim() || customer_id === null) {
      setCustomerError("Please fill customer name");
      hasError = true;
    } else {
      setCustomerError("");
    }

    // Validate dates
    if (!issueDate?.trim()) {
      setIssueDateError("Please select issue date");
      hasError = true;
    } else {
      setIssueDateError("");
    }

    if (!dueDate?.trim()) {
      setDueDateError("Please select due date");
      hasError = true;
    } else {
      setDueDateError("");
    }

    // Validate item list
    const newItemErrors = items.map((item, index) => {
      const errors = {};

      if (!item.description?.trim() || item.item_id === 0) {
        errors.description = "Item not found. Please select from the list.";
        hasError = true;
        lastErrorIndex = index;
        return errors;
      }

      const availableQty = item.available_stock ?? 0;
      const qty = parseFloat(item.qty) || 0;

      if (availableQty <= 0) {
        errors.qty = "Item out of stock!";
        hasError = true;
        lastErrorIndex = index;
        return errors;
      } else if (qty > availableQty) {
        errors.qty = "Not enough stock available!";
        hasError = true;
        lastErrorIndex = index;
        return errors;
      } else if (qty <= 0) {
        errors.qty = "Quantity must be greater than zero";
        hasError = true;
        lastErrorIndex = index;
        return errors;
      }

      if (!item.cost || parseFloat(item.cost) <= 0) {
        errors.cost = "Please fill the cost";
        hasError = true;
        lastErrorIndex = index;
        return errors;
      }

      return errors;
    });

    // Keep only the last errored row's errors — clear others
    const cleanedErrors = newItemErrors.map((errors, index) =>
      index === lastErrorIndex ? errors : {}
    );

    setItemErrors(cleanedErrors);

    return !hasError;
  };

  const handleItemSearch = (term, index) => {
    if (term.trim() === "") {
      setItemName([]);
      return;
    }
    window.electron.searchInventory(term).then((results) => {
      setItemName(results);
      setActiveDropdownIndex(index);
    });
  };

  // ------------------ CALCULATIONS ------------------ //
  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + item.amount, 0);
  };

  const rawTotal = calculateSubtotal();

  const discountAmount =
    discountType === "percent"
      ? (rawTotal * discountValue) / 100
      : discountValue;

  const finalTotal = Math.max(0, rawTotal - discountAmount);

  const safeAmountPaid = amountPaid === "" ? 0.0 : parseFloat(amountPaid);
  const safeDiscountAmount = discountAmount === "" ? 0.0 : discountAmount;

  return (
    <div className="invoice-main">
      <div className="invoice-header">
        <h2>Create Memo</h2>
        <div className="invoice-actions">
          {/* <button className="save-draft-btn">Save to Draft</button> */}
          {showWaitDialog && (
            <WaitDialog message="Saving memo and sale data..." />
          )}
          <button
            className="save-continue-btn"
            onClick={() => {
              if (!validateForm()) return;
              handleSaveAndContinue();
            }}
          >
            Save and Continue
          </button>
        </div>
      </div>

      <div className="invoice-body">
        {/* Left Part */}
        <div className="invoice-left">
          <div className="company-info">
            <div className="logo-placeholder">
              <img src={logo2} alt="Logo" />
            </div>
            <div className="company-details">
              <div ref={dropdownRef} className="customer-search-wrapper">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    handleSearch(e);
                    setCustomerError("");
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      if (search && !customer_id) {
                        setFormData((prev) => ({
                          ...prev,
                          customer_name: search,
                        }));
                        setShowModal(true);
                      }
                      setShowDropdown(false); // close dropdown after blur + possible modal open
                    }, 150);
                  }}
                  placeholder="Search Customers..."
                  className={`customer-search-input ${
                    customerError ? "input-error" : ""
                  }`}
                />
                {customerError && (
                  <div className="error-message">{customerError}</div>
                )}
                {showDropdown && (
                  <ul className="customer-search-dropdown">
                    {results.length > 0 ? (
                      <>
                        {results.map((c) => (
                          <li
                            key={c.customer_id}
                            className="customer-search-item"
                            onMouseDown={() => {
                              setSearch(c.customer_name);
                              setCustomerID(c.customer_id);
                              setCustomerAddress(c.address);
                              setShowDropdown(false);
                            }}
                          >
                            {c.customer_name}
                          </li>
                        ))}
                        <li
                          className="customer-search-item add-customer"
                          onMouseDown={() => {
                            setShowDropdown(false);
                            setFormData((prev) => ({
                              ...prev,
                              customer_name: search,
                            }));
                            setShowModal(true);
                          }}
                        >
                          + Add Customer
                        </li>
                      </>
                    ) : search.trim() !== "" ? (
                      <li
                        className="customer-search-item add-customer"
                        onMouseDown={() => {
                          setShowDropdown(false);
                          setFormData((prev) => ({
                            ...prev,
                            customer_name: search,
                          }));
                          setShowModal(true);
                        }}
                      >
                        + Add Customer
                      </li>
                    ) : null}
                  </ul>
                )}
                <AddCustomer
                  isOpen={showModal}
                  onClose={() => setShowModal(false)}
                  onSubmit={handleAddCustomer}
                  formData={formData}
                  setFormData={setFormData}
                />
              </div>
              <div className="customer-address-wrapper">
                <input
                  type="text"
                  value={customerAddress}
                  placeholder="Auto-filled address"
                  className="customer-address-input"
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="invoice-section">
            <h3>Memo</h3>

            <div className="input-grid">
              <div className="input-group">
                <label>Memo Number</label>
                <input
                  type="text"
                  value={memo_number}
                  onChange={(e) => setMemoNumber(e.target.value)}
                  placeholder="000"
                />
              </div>
              <div className="input-group"></div>
            </div>

            <div className="item-table">
              <div className="item-header">
                <span>Items</span>
                <span>QTY</span>
                <span>UNIT</span>
                <span>Cost</span>
                <span>Amount</span>
              </div>

              {items.map((item, index) => (
                <div className="item-row" key={index}>
                  <div className="item-search-wrapper">
                    <input
                      type="text"
                      placeholder="Enter item"
                      value={item.description}
                      onChange={(e) => {
                        handleItemChange(index, "description", e.target.value);
                        handleItemSearch(e.target.value, index);
                        const updatedErrors = [...itemErrors];
                        if (updatedErrors[index])
                          updatedErrors[index].description = "";
                        setItemErrors(updatedErrors);
                      }}
                      onFocus={() => setActiveDropdownIndex(index)}
                      onBlur={() => {
                        setTimeout(() => {
                          setActiveDropdownIndex(null);
                          if (items[index].item_id === 0) {
                            const updatedErrors = [...itemErrors];
                            updatedErrors[index] = updatedErrors[index] || {};
                            updatedErrors[index].description =
                              "Item not found. Please select from the list.";
                            setItemErrors(updatedErrors);
                          }
                        }, 100);
                      }}
                      data-tooltip-id={`desc-tooltip-${index}`}
                      data-tooltip-content={itemErrors[index]?.description}
                      className={
                        itemErrors[index]?.description ? "input-error" : ""
                      }
                    />
                    <ReactTooltip
                      id={`desc-tooltip-${index}`}
                      place="right"
                      variant="error"
                      isOpen={!!itemErrors[index]?.description}
                    />
                    {activeDropdownIndex === index && item_name.length > 0 && (
                      <ul className="item-search-dropdown">
                        {item_name.map((item) => (
                          <li
                            key={item.item_id}
                            className="item-search-item"
                            onMouseDown={() => {
                              handleItemChange(
                                index,
                                "description",
                                item.item_name
                              );
                              handleItemChange(index, "item_id", item.item_id);
                              handleItemChange(index, "unit", item.unit);
                              handleItemChange(
                                index,
                                "available_stock",
                                item.quantity
                              );
                              setItemName([]);
                              setActiveDropdownIndex(null);
                            }}
                          >
                            {item.item_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) =>
                      handleItemChange(index, "qty", e.target.value)
                    }
                    className={itemErrors[index]?.qty ? "input-error" : ""}
                    data-tooltip-id={`qty-tooltip-${index}`}
                    data-tooltip-content={itemErrors[index]?.qty || ""}
                  />
                  <ReactTooltip
                    id={`qty-tooltip-${index}`}
                    place="right"
                    variant="error"
                    isOpen={!!itemErrors[index]?.qty}
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={item.unit}
                    disabled
                    className={itemErrors[index]?.unit ? "input-error" : ""}
                  />
                  <input
                    type="number"
                    placeholder="₹0.00"
                    value={item.cost}
                    onChange={(e) => {
                      handleItemChange(index, "cost", e.target.value);
                      const updatedErrors = [...itemErrors];
                      if (updatedErrors[index]) updatedErrors[index].cost = "";
                      setItemErrors(updatedErrors);
                    }}
                    data-tooltip-id={`cost-tooltip-${index}`}
                    data-tooltip-content={itemErrors[index]?.cost}
                    className={itemErrors[index]?.cost ? "input-error" : ""}
                  />
                  <ReactTooltip
                    id={`cost-tooltip-${index}`}
                    place="right"
                    variant="error"
                    isOpen={!!itemErrors[index]?.cost}
                  />
                  <input
                    type="text"
                    disabled
                    value={`₹${item.amount.toFixed(2)}`}
                  />
                  <button
                    className="delete-icon"
                    onClick={() => handleDeleteItem(index)}
                    title="Delete item"
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              ))}

              <div className="add-item">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={items.length >= MAX_ITEMS}
                  className={items.length >= MAX_ITEMS ? "disabled-btn" : ""}
                >
                  + Add Item
                </button>
                {items.length >= MAX_ITEMS && (
                  <span className="item-limit-msg">
                    Maximum of 9 items reached. (including Notes/Terms)
                  </span>
                )}
              </div>
            </div>

            <NotesSection
              selectedNotes={selectedNotes}
              setSelectedNotes={setSelectedNotes}
              maxNotes={MAX_NOTES}
            />
          </div>
        </div>

        {/* Right Part */}
        <div className="invoice-right">
          <h3>Memo Information & Payment</h3>

          <div className="input-group full-width">
            <label>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option>Select...</option>
              <option>Cash</option>
              <option>Card</option>
              <option>UPI</option>
            </select>
          </div>

          <div className="date-fields">
            <div className="input-group">
              <label>Issued Date</label>
              <div className="calendar-wrapper">
                <DatePicker
                  selected={
                    issueDate
                      ? parse(issueDate, "dd/MM/yyyy", new Date())
                      : null
                  }
                  onChange={(date) => {
                    const formattedDate = isValid(date)
                      ? format(date, "dd/MM/yyyy")
                      : "";
                    setIssueDate(formattedDate);
                    if (isValid(date)) setIssueDateError(""); // clear error when date picked
                  }}
                  placeholderText="Issued Date"
                  dateFormat="dd/MM/yyyy"
                  className="date-filter"
                  popperPlacement="bottom-start"
                />
                <i className="bx bx-calendar calendar-icon-inside" />
              </div>
              {issueDateError && (
                <div className="error-message">{issueDateError}</div>
              )}
            </div>
            <div className="input-group">
              <label>Due Date</label>
              <div className="calendar-wrapper">
                <DatePicker
                  selected={
                    dueDate ? parse(dueDate, "dd/MM/yyyy", new Date()) : null
                  }
                  onChange={(date) => {
                    const formattedDate = isValid(date)
                      ? format(date, "dd/MM/yyyy")
                      : "";
                    setDueDate(formattedDate);
                    if (isValid(date)) setDueDateError(""); // clear error when date picked
                  }}
                  placeholderText="Due Date"
                  dateFormat="dd/MM/yyyy"
                  className="date-filter"
                  popperPlacement="bottom-start"
                />
                <i className="bx bx-calendar calendar-icon-inside" />
              </div>
              {dueDateError && (
                <div className="error-message">{dueDateError}</div>
              )}
            </div>
          </div>

          <div className="summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹ {calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <span>-</span>
            </div>
            <div className="add-discount">
              {showDiscountInput ? (
                <div className="discount-input-wrapper">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="discount-type"
                  >
                    <option value="amount">₹ Amount</option>
                    <option value="percent">% Percent</option>
                  </select>
                  <input
                    type="number"
                    className="discount-input"
                    placeholder="Discount"
                    value={discountValue}
                    onChange={(e) =>
                      setDiscountValue(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              ) : (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDiscountInput(true);
                  }}
                >
                  + Add Discount
                </a>
              )}
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>₹ {finalTotal.toFixed(2)}</span>
            </div>

            <div className="summary-row input-amount-paid">
              <label htmlFor="amountPaid">Amount Paid</label>
              <input
                type="number"
                id="amountPaid"
                className="amount-paid-input"
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                placeholder="0.0"
              />
            </div>

            <div className="summary-row balance-due">
              <span>Balance Due</span>
              <span>₹ {(finalTotal - (amountPaid || 0)).toFixed(2)}</span>
            </div>
            <div className="back-button-container">
              <button onClick={handleBackClick} className="back-button">
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
      <AdditionalInfoBox />
    </div>
  );
};

export default CreateMemo;
