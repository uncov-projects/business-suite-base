import React, { useState, useEffect } from "react";
import styles from "../styles/Purchase.module.css";
import { FiEdit, FiTrash2, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import InlineCategoryModal from "../recomponents/InlineCategoryModal";
import AddCategoryModal from "../recomponents/AddCategoryModal";
import AddSellerModal from "../recomponents/AddSellerModal";
const { electron } = window;

const Purchase = () => {
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
        <div className={styles.purchaseTitle}>Purchase</div>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="3" className={styles.noDataRow}>
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
                    <td
                      className={styles.actionCell} // flex container
                      onClick={(e) => e.stopPropagation()} // prevent row click
                    >
                      <button
                        className={`${styles.tableIconBtn} ${styles.editIcon}`}
                        onClick={() => handleEdit(cat)}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className={`${styles.tableIconBtn} ${styles.deleteIcon}`}
                        onClick={() => handleDelete(cat.customer_id)}
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
      )}

      {showCategoryModal && selectedCategory && (
        <InlineCategoryModal
          category={selectedCategory}
          sellers={tableData}
          onClose={() => setShowCategoryModal(false)}
          onAddSeller={() => {
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
          onEditSeller={handleEdit}
          onDeleteSeller={handleDelete}
          onSellerClick={handleSellerClick}
        />
      )}

     {showSellerModal && (
  <AddSellerModal
    show={showSellerModal}
    editMode={editMode}
    formData={formData}
    setFormData={setFormData}
    onSave={handleAddSeller}
    onClose={() => {
      setShowSellerModal(false);
      setEditMode(false);
    }}
  />
)}

     {showModal && (
  <AddCategoryModal
    show={showModal}
    newCategory={newCategory}
    setNewCategory={setNewCategory}
    onSave={handleAddCategory}
    onClose={() => {
      setShowModal(false);
      setNewCategory({ id: "", name: "" });
    }}
  />
)}

    </div>
  );
};

export default Purchase;
