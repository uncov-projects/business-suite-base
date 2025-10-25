import React, { useState, useEffect } from "react";
import "../styles/Customer.css";
import { FiFilter } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse, isValid } from "date-fns";
import Pagination from "../recomponents/Pagination";
import { FiEdit, FiTrash2 } from "react-icons/fi";
const { electron } = window;

const Customer = () => {
  const [showModal, setShowModal] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    address: "",
    joinDate: "",
    customerType: "",
    email: "",
  });

  const [filters, setFilters] = useState({
    customerType: null,
  });
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeNestedFilter, setActiveNestedFilter] = useState(null);
  const filteredCustomers = tableData.filter((customer) => {
    const matchesSearchTerm = customer.customer_name
      .toLowerCase()
      .startsWith(searchTerm.toLowerCase());

    const matchesType =
      !filters.customerType || customer.customerType === filters.customerType;

    return matchesSearchTerm && matchesType;
  });
  const toggleDropdown = () => {
    setFilterDropdownOpen((prev) => !prev);
  };

  const toggleNested = (key) => {
    setActiveNestedFilter((prev) => (prev === key ? null : key));
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // fetch sales data from DB
  const fetchCustomers = async () => {
    const customer = await electron.getAllCustomers();
    setTableData(customer); // <-- update UI table data
  };

  // call fetchSales when component mounts
  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    await electron.addCustomer(formData); // add new sale to DB
    fetchCustomers(); // refresh table after adding
    setFormData({
      customer_name: "",
      phone: "",
      address: "",
      joinDate: "",
      customerType: "",
      email: "",
    });
    setShowModal(false);
  };
  const handleEdit = (row) => {
    setFormData({ ...row });
    setShowModal(true);
    window.electron?.focusWindow();
  };

  const handleDelete = async (customer_id) => {
    await electron.deleteInventory(customer_id);
    fetchCustomers();
    window.dispatchEvent(new Event("inventoryUpdated"));
  };
  return (
    <div className="customer-wrapper">
      <div className="topActions">
        <h2 className="customer-heading">Customer</h2>
        <div className="actionButtons">
          <button
            className="customer-btn createBtn"
            onClick={() => setShowModal(true)}
          >
            + Add Customer
          </button>
        </div>
      </div>

      <div className="filtersWrapper">
        <div className="filtersContainer">
          <div className="searchIcon">
            <input
              type="text"
              placeholder="Search"
              className="searchInput"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="bx bx-search icon"></i>
          </div>
        </div>
        <div className="filterIcons" style={{ position: "relative" }}>
          <button className="iconBtn" onClick={toggleDropdown}>
            <FiFilter />
            <span>More Filters</span>
            <i
              className={`bx ${
                filterDropdownOpen ? "bx-chevron-up" : "bx-chevron-down"
              }`}
            />
          </button>

          {filterDropdownOpen && (
            <div className="filterDropdown">
              <div className="filterCategory">
                <button
                  onClick={() => toggleNested("customerType")}
                  className="filterCategoryBtn"
                >
                  <span>Customer Type</span>
                  {filters.customerType && (
                    <i
                      className="bx bx-x"
                      title="Clear Customer Type Filter"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters((prev) => ({ ...prev, customerType: null }));
                      }}
                      style={{
                        color: "red",
                        cursor: "pointer",
                        fontSize: "24px",
                      }}
                    />
                  )}
                  <i
                    className={`bx ${
                      activeNestedFilter === "customerType"
                        ? "bx-chevron-up"
                        : "bx-chevron-down"
                    }`}
                  />
                </button>

                {activeNestedFilter === "customerType" && (
                  <div className="nestedFilterContent">
                    {["Retail", "Wholesale"].map((opt) => {
                      const isSelected = filters.customerType === opt;
                      return (
                        <button
                          key={opt}
                          className={`optionBtn ${
                            isSelected ? "selectedOption" : ""
                          }`}
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              customerType:
                                prev.customerType === opt ? null : opt,
                            }))
                          }
                        >
                          {opt}
                          {isSelected && (
                            <i
                              className="bx bx-x"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilters((prev) => ({
                                  ...prev,
                                  customerType: null,
                                }));
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Table */}
      <table className="customer-table">
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Customer Type</th>
            <th>E-mail</th>
            <th>Join Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="6" className="noDataRow">
                No Customers to Show
              </td>
            </tr>
          ) : (
            currentItems.map((row, idx) => (
              <tr key={idx}>
                <td>{row.customer_name}</td>
                <td>{row.phone}</td>
                <td>{row.address}</td>
                <td>
                  <span
                    className={`status-label ${row.customerType
                      .toLowerCase()
                      .replace(/\s+/g, "")}`}
                  >
                    {row.customerType.charAt(0).toUpperCase() +
                      row.customerType.slice(1).toLowerCase()}
                  </span>
                </td>
                <td>{row.email}</td>
                <td>{row.joinDate}</td>
                <td
                  className="actionCell"
                  onClick={(e) => e.stopPropagation()} // ⬅ prevent row click when using action buttons
                >
                  <button
                    className="tableIconBtn editIcon"
                    title="Edit"
                    onClick={() => handleEdit(row)}
                  >
                    <FiEdit />
                  </button>
                  <button
                    className="tableIconBtn deleteIcon"
                    title="Delete"
                    onClick={() => handleDelete(row.customer_id)}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {/* Pagination Code */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Customer</h3>
            <form onSubmit={handleAddCustomer}>
              <input
                type="text"
                name="customer_name"
                placeholder="Customer Name"
                value={formData.customer_name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <input
                type="type"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                required
              />
              <div className="calendarIcon">
                <DatePicker
                  name="joinDate"
                  selected={
                    formData.joinDate
                      ? parse(formData.joinDate, "dd/MM/yyyy", new Date())
                      : null
                  }
                  placeholderText="Join Date..."
                  className="dateFilter"
                  popperPlacement="bottom-start"
                  dateFormat="dd/MM/yyyy"
                  onChange={(date) =>
                    handleChange({
                      target: {
                        name: "joinDate",
                        value: isValid(date) ? format(date, "dd/MM/yyyy") : "",
                      },
                    })
                  }
                  required
                />
              </div>
              <select
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
                required
              >
                <option value="">Select Status</option>
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
              </select>
              <input
                type="type"
                name="email"
                placeholder="E-Mail"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <div className="modal-buttons">
                <button type="submit" className="customer-btn">
                  Submit
                </button>
                <button
                  type="button"
                  className="customer-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;
