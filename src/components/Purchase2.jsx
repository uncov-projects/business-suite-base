import React, { useState, useEffect } from "react";
import styles from "../styles/Purchase.module.css";
import { FiEdit, FiTrash2, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const { electron } = window;

const Purchase2 = () => {
  const navigate = useNavigate();

  // UI states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [categories, setCategories] = useState([]);
  // Data states
  const [searchTerm, setSearchTerm] = useState("");
  const [tableData, setTableData] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    gst_no: "",
    phone: "",
    address: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ id: "", name: "" });
  // Fetch customers initially
  useEffect(() => {
    fetchCustomers();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const dummyCategories = [
      { customer_id: "C001", customer_name: "chivda" },
      { customer_id: "C002", customer_name: "bhajipala" },
      { customer_id: "C003", customer_name: "sev" },
    ];
    setCategories(dummyCategories);
  };

  const fetchCustomers = async () => {
    const customers = await electron.getAllCustomers();
    setTableData(customers);
  };

  // Category click → open inline modal
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowCategoryModal(true);
  };

  // Seller row click → navigate to detail view
  const handleSellerClick = (seller) => {
    navigate(`/detailedlogseller/${seller.customer_id}`, { state: seller });
  };

  // Delete seller
  const handleDelete = async (customer_id) => {
    await electron.deleteInventory(customer_id);
    fetchCustomers();
  };

  // Edit seller → prefill form
  const handleEdit = (seller) => {
    setEditMode(true);
    setFormData({
      customer_id: seller.customer_id || "",
      customer_name: seller.customer_name || "",
      gst_no: seller.gst_no || "",
      phone: seller.phone || "",
      address: seller.address || "",
    });
    setShowSellerModal(true);
  };

  // Add or Update seller
  const handleAddSeller = async (e) => {
    e.preventDefault();
    if (editMode) {
      await electron.updateCustomer(formData);
    } else {
      await electron.addCustomer(formData);
    }
    fetchCustomers();
    setShowSellerModal(false);
    setEditMode(false);
    setFormData({
      customer_id: "",
      customer_name: "",
      gst_no: "",
      phone: "",
      address: "",
    });
  };

  // Filtered categories
  const filteredCategories = tableData.filter((c) =>
    c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    const newCat = {
      customer_id: newCategory.id,
      customer_name: newCategory.name,
      gst_no: "",
      phone: "",
      address: "",
    };

    // Update main table data instead of categories
    setTableData((prev) => [...prev, newCat]);

    setShowModal(false);
    setShowCategoryModal(false);
    setNewCategory({ id: "", name: "" });
  };

  return (
    <div className={styles.customerWrapper}>
      {/* Tabs */}

      <div className={styles.headerRow}>
        <div className={styles.purchaseTitle}>Purchase GST</div>
        <div className={styles.topActions}>
          <button
            className={`${styles.tabBtn} ${styles.activeTab}`}
            onClick={() => navigate("/purchase")}
          >
            Purchase
          </button>
          <button
            className={styles.tabBtn}
            onClick={() => navigate("/purchase2")}
          >
            Purchase GST
          </button>
            
        </div>
      </div>

      {/* Search Input */}
      <div className={styles.filtersWrapper}>
        <div className={styles.searchContainer}>
          <div className={styles.searchIcon}>
            <input
              type="text"
              placeholder="Search Category..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className={styles.searchInputIcon} />
          </div>

          <button
            className={styles.addCategoryBtn}
            onClick={() => {
              // Open modal for new category
              // setEditMode(false);
              // setFormData({
              //   customer_id: "",
              //   customer_name: "",
              //   gst_no: "",
              //   phone: "",
              //   address: "",
              // });
              // setShowCategoryModal(true);
              const nextId = `C${String(tableData.length + 1).padStart(
                3,
                "0"
              )}`;
              setNewCategory({ id: nextId, name: "" });
              setShowModal(true);
            }}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Category Table */}
      {!showCategoryModal && (
        <div className={styles.tableWrapper}>
          <table className={styles.purchaseTable}>
            <thead>
              <tr>
                <th>Category ID</th>
                <th>Category Name</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="2" className={styles.noDataRow}>
                    No Categories Found
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, idx) => (
                  <tr
                    key={idx}
                    className={styles.clickableRow}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    <td>{cat.customer_id}</td>
                    <td>{cat.customer_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline Modal for Category */}
      {showCategoryModal && selectedCategory && (
        <div className={styles.inlineModal}>
          <div className={styles.inlineModalHeader}>
            <h3>
              Category:{" "}
              <span className={styles.modalCategoryName}>
                {selectedCategory.customer_name}
              </span>
            </h3>

            <div className={styles.modalHeaderActions}>
              <button
                className={styles.addSellerBtn}
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    customer_id: "",
                    customer_name: "",
                    gst_no: "",
                    phone: "",
                    address: "",
                  });
                  setShowSellerModal(true);
                }}
              >
                + Add Seller
              </button>
              <button
                className={styles.closeModalBtn}
                onClick={() => setShowCategoryModal(false)}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
          </div>

          <div className={styles.inlineModalBody}>
            <table className={styles.sellerTable}>
              <thead>
                <tr>
                  <th>Seller ID</th>
                  <th>Seller Name</th>
                  <th>GST No</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.noDataRow}>
                      No Sellers Found
                    </td>
                  </tr>
                ) : (
                  tableData.map((seller, i) => (
                    <tr
                      key={i}
                      className={styles.subRow}
                      onClick={() => handleSellerClick(seller)}
                    >
                      <td>{seller.customer_id}</td>
                      <td>{seller.customer_name}</td>
                      <td>{seller.gst_no}</td>
                      <td>{seller.phone}</td>
                      <td>{seller.address}</td>
                      <td
                        className={styles.actionCell}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className={`${styles.tableIconBtn} ${styles.editIcon}`}
                          onClick={() => handleEdit(seller)}
                        >
                          <FiEdit />
                        </button>
                        <button
                          className={`${styles.tableIconBtn} ${styles.deleteIcon}`}
                          onClick={() => handleDelete(seller.customer_id)}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Seller Modal */}
      {showSellerModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalRectangle}>
            <h3>
              {editMode
                ? `Edit Seller: ${formData.customer_name}`
                : "Add Seller"}
            </h3>
            <form onSubmit={handleAddSeller}>
              <input
                type="text"
                name="customer_id"
                placeholder="Customer ID"
                value={formData.customer_id}
                onChange={(e) =>
                  setFormData({ ...formData, customer_id: e.target.value })
                }
                required
                disabled={editMode} // prevent editing ID during edit mode
              />
              <input
                type="text"
                name="customer_name"
                placeholder="Customer Name"
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData({ ...formData, customer_name: e.target.value })
                }
                required
              />
              <input
                type="text"
                name="gst_no"
                placeholder="GST No"
                value={formData.gst_no}
                onChange={(e) =>
                  setFormData({ ...formData, gst_no: e.target.value })
                }
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
              <div className={styles.modalButtons}>
                <button type="submit">
                  {editMode ? "Update Seller" : "Add Seller"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSellerModal(false);
                    setEditMode(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Category Model */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalRectangle}>
            <h3>Add Category</h3>
            <form onSubmit={handleAddCategory}>
              <input
                type="text"
                placeholder="Category ID (Auto Generated)"
                value={newCategory.id}
                disabled
              />
              <input
                type="text"
                placeholder="Category Name"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                required
              />
              <div className={styles.modalButtons}>
                <button type="submit">Save</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewCategory({ id: "", name: "" });
                  }}
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

export default Purchase2;
