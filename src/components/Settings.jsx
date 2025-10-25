import React, { useState } from "react";
import styles from "../styles/Settings.module.css";
import {
  showSuccessDialog,
  showWarningDialog,
  showErrorDialog,
} from "../utils/dialogUtils";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Account");

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);

  const [showAddCategoryPopup, setShowAddCategoryPopup] = useState(false);
  const [showDeleteCategoryPopup, setShowDeleteCategoryPopup] = useState(false);
  const [showAddUnitPopup, setShowAddUnitPopup] = useState(false);
  const [showDeleteUnitPopup, setShowDeleteUnitPopup] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newUnitName, setNewUnitName] = useState("");

  const fetchCategories = async () => {
    const res = await electron.getAllCategories();
    setCategories(res.map((item) => item.category_name));
  };

  const fetchUnits = async () => {
    const res = await electron.getAllUnits();
    setUnits(res.map((item) => item.unit_name));
  };

  const openAddCategoryPopup = async () => {
    setShowAddCategoryPopup(true);
    await fetchCategories();
  };

  const openDeleteCategoryPopup = async () => {
    setShowDeleteCategoryPopup(true);
    await fetchCategories();
  };

  const openAddUnitPopup = async () => {
    setShowAddUnitPopup(true);
    await fetchUnits();
  };

  const openDeleteUnitPopup = async () => {
    setShowDeleteUnitPopup(true);
    await fetchUnits();
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim() === "") return;
    await electron.addCategory(newCategoryName);
    await fetchCategories();
    setNewCategoryName("");
  };

  const handleAddUnit = async () => {
    if (newUnitName.trim() === "") return;
    await electron.addUnit(newUnitName);
    await fetchUnits();
    setNewUnitName("");
  };

  const handleDeleteSelectedCategories = async () => {
    if (selectedCategories.length === 0) return;
    await electron.deleteCategories(selectedCategories);
    await fetchCategories(); // refresh
    setSelectedCategories([]); // clear selection
  };

  const handleDeleteSelectedUnits = async () => {
    if (selectedUnits.length === 0) return;
    await electron.deleteUnits(selectedUnits);
    await fetchUnits(); // refresh
    setSelectedUnits([]); // clear selection
  };

  const handleBackup = async () => {
    const result = await window.electron.backupDatabase();
    if (result.success) {
      await showSuccessDialog({
        title: "Backup Complete",
        message: "Data backed up successfully!",
      });
    } else {
      await showWarningDialog({
        title: "Backup Cancelled",
        message: "Backup operation was cancelled.",
      });
    }
  };

  const handleRestore = async () => {
    const result = await electron.restoreDatabase();
    if (result.success) {
      await showSuccessDialog({
        title: "Restore Complete",
        message: "Data restored successfully!",
      });
    } else {
      await showWarningDialog({
        title: "Restore Cancelled",
        message: "Restore was cancelled.",
      });
    }
  };

  const handleCleanCustomer = async () => {
    const result = await window.electron.cleanCustomerTable();

    if (result.success) {
      await showSuccessDialog({
        title: "Clean Complete",
        message: "Customer data cleaned successfully!",
      });
    } else if (result.message === "Operation cancelled by user.") {
      await showInfoDialog?.({
        title: "Operation Cancelled",
        message: "No data was deleted.",
      });
    } else {
      await showErrorDialog({
        title: "Clean Failed",
        message: "Failed to clean customer data.",
      });
    }
  };

  const handleCleanInventory = async () => {
    const result = await window.electron.cleanInventoryTable();

    if (result.success) {
      await showSuccessDialog({
        title: "Clean Complete",
        message: "Inventory data cleaned successfully!",
      });
    } else if (result.message === "Operation cancelled by user.") {
      await showInfoDialog?.({
        title: "Operation Cancelled",
        message: "No data was deleted.",
      });
    } else {
      await showErrorDialog({
        title: "Clean Failed",
        message: "Failed to clean inventory data.",
      });
    }
  };

  const handleMemoData = async () => {
    const result = await window.electron.cleanMemoData();

    if (result.success) {
      await showSuccessDialog({
        title: "Clean Complete",
        message: "Memo data cleaned successfully!",
      });
    } else if (result.message === "Operation cancelled by user.") {
      await showInfoDialog?.({
        title: "Operation Cancelled",
        message: "No data was deleted.",
      });
    } else {
      await showErrorDialog({
        title: "Clean Failed",
        message: "Failed to clean memo data.",
      });
    }
  };

  const handleSaleData = async () => {
    const result = await window.electron.cleanSaleData();

    if (result.success) {
      await showSuccessDialog({
        title: "Clean Complete",
        message: "Sale data cleaned successfully!",
      });
    } else if (result.message === "Operation cancelled by user.") {
      await showInfoDialog?.({
        title: "Operation Cancelled",
        message: "No data was deleted.",
      });
    } else {
      await showErrorDialog({
        title: "Clean Failed",
        message: "Failed to clean sale data.",
      });
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <nav className={styles.navbar}>
        <h2 className={styles.settingsheading}>Settings</h2>
      </nav>
      <div className={styles.settingswrapper}>
        <div className={styles.settingsidebar}>
          <button
            className={`${styles.sidebarButton} ${
              activeTab === "Account" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("Account")}
          >
            <i className="bx bx-user"></i>
            Account
          </button>
          <button
            className={`${styles.sidebarButton} ${
              activeTab === "Inventory" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("Inventory")}
          >
            <i className="bx bx-box"></i>
            Inventory
          </button>
          <button
            className={`${styles.sidebarButton} ${
              activeTab === "Backup Data" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("Backup Data")}
          >
            <i className="bx bx-cloud-upload"></i>
            Backup Data
          </button>
          <button
            className={`${styles.sidebarButton} ${
              activeTab === "Clean Data" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("Clean Data")}
          >
            <i className="bx bx-reset"></i>
            Clean Data
          </button>
        </div>
        <div className={styles.settingscontent}>
          {activeTab === "Account" && (
            <div className={styles.accountContainer}>
              <h3 className={styles.accountHeading}>Account Details</h3>
              <p className={styles.accountSubheading}>
                Your account information and preferences.
              </p>

              <div className={styles.profileCard}>
                <h4 className={styles.cardTitle}>Profile Information</h4>
                <p className={styles.cardSubheading}>
                  Update your personal information (Please contact vendor)
                </p>

                <div className={styles.profileTop}>
                  <div className={styles.avatarCircle}>RAM</div>
                  {/* <button className={styles.photoButton}>Change Photo</button> */}
                </div>

                <div className={styles.detailRow}>
                  <div className={styles.detailBox}>
                    <label>First Name</label>
                    <div className={styles.detailInput}>
                      Rambharose Iron Stores
                    </div>
                  </div>
                  <div className={styles.detailBox}>
                    <label>Last Name</label>
                    <div className={styles.detailInput}>NA</div>
                  </div>
                </div>

                <div className={styles.detailBox}>
                  <label>Email Address</label>
                  <div className={styles.detailInput}>NA</div>
                </div>

                <div className={styles.detailBox}>
                  <label>Phone Number</label>
                  <div className={styles.detailInput}>+91 940443077</div>
                </div>

                <div className={styles.detailBox}>
                  <label>GST Number</label>
                  <div className={styles.detailInput}>27AFHPM1467K1Z4</div>
                </div>

                <div className={styles.detailBox}>
                  <label>Address</label>
                  <div className={styles.detailInput}>
                    Ganesh Nagar Gondia, Maharashtra - 441601
                  </div>
                </div>

                <div className={styles.detailBox}>
                  <label>Bio</label>
                  <div className={styles.detailInput}>
                    Retail seller of Iron and Iron products.
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "Backup Data" && (
            <div className={styles.backupContainer}>
              <h3 className={styles.backupHeading}>Backup Settings</h3>
              <p className={styles.backupSubheading}>
                Manage your data backup and restoration options.
              </p>

              <div className={styles.backupCard}>
                <h4 className={styles.cardTitle}>Backup Options</h4>

                <div className={styles.optionList}>
                  <button
                    className={styles.optionButton}
                    onClick={handleBackup}
                  >
                    <i className="bx bx-cloud-upload"></i> Backup Data
                  </button>
                  <button
                    className={styles.optionButton}
                    onClick={handleRestore}
                  >
                    <i className="bx bx-cloud-download"></i> Restore Data
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === "Inventory" && (
            <div className={styles.inventoryContainer}>
              <h3 className={styles.inventoryHeading}>Inventory Settings</h3>
              <p className={styles.inventorySubheading}>
                Manage your inventory categories and units.
              </p>

              <div className={styles.inventoryCard}>
                <h4 className={styles.cardTitle}>Inventory Options</h4>

                <div className={styles.optionList}>
                  <button
                    className={styles.optionButton}
                    onClick={openAddCategoryPopup}
                  >
                    <i className="bx bx-plus-circle"></i> Add Category
                  </button>
                  <button
                    className={styles.optionButton}
                    onClick={openDeleteCategoryPopup}
                  >
                    <i className="bx bx-trash"></i> Delete Category
                  </button>
                  <button
                    className={styles.optionButton}
                    onClick={openAddUnitPopup}
                  >
                    <i className="bx bx-plus-circle"></i> Add Unit
                  </button>
                  <button
                    className={styles.optionButton}
                    onClick={openDeleteUnitPopup}
                  >
                    <i className="bx bx-trash"></i> Delete Unit
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === "Clean Data" && (
            <div className={styles.backupContainer}>
              <h3 className={styles.backupHeading}>Clean Data Settings</h3>
              <p className={styles.backupSubheading}>
                Manage and Delete data from each options.
              </p>

              <div className={styles.backupCard}>
                <h4 className={styles.cardTitle}>Cleaning Options</h4>

                <div className={styles.optionList}>
                  <button
                    className={styles.optionButton}
                    onClick={handleCleanCustomer}
                  >
                    <i className="bx bx-user-x"></i> Clean Customer Data
                  </button>
                  <button
                    className={styles.optionButton}
                    onClick={handleMemoData}
                  >
                    <i className="bx bx-file"></i> Clean Memo Data
                  </button>
                  <button
                    className={styles.optionButton}
                    onClick={handleSaleData}
                  >
                    <i className="bx bx-bar-chart"></i> Clean Sale Data
                  </button>
                  <button
                    className={styles.optionButton}
                    onClick={handleCleanInventory}
                  >
                    <i className="bx bx-box"></i> Clean Inventory Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Category Popup */}
          {showAddCategoryPopup && (
            <div className={styles.popupOverlay}>
              <div className={styles.popupCard}>
                <div className={styles.popupHeader}>
                  <h3>Add Category</h3>
                  <button
                    onClick={() => setShowAddCategoryPopup(false)}
                    className={styles.closeButton}
                  >
                    &times;
                  </button>
                </div>
                <div className={styles.popupBody}>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                  />
                  <button
                    className={styles.primaryButton}
                    onClick={handleAddCategory}
                  >
                    Add
                  </button>
                  <div className={styles.existingList}>
                    <h4>Existing Categories</h4>
                    <ul>
                      {categories.map((cat, idx) => (
                        <li key={idx}>{cat}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Category Popup */}
          {showDeleteCategoryPopup && (
            <div className={styles.popupOverlay}>
              <div className={styles.popupCard}>
                <div className={styles.popupHeader}>
                  <h3>Delete Category</h3>
                  <button
                    onClick={() => setShowDeleteCategoryPopup(false)}
                    className={styles.closeButton}
                  >
                    &times;
                  </button>
                </div>
                <div className={styles.popupBody}>
                  <div className={styles.checkboxGroup}>
                    {categories.map((cat, idx) => (
                      <label key={idx}>
                        <input
                          type="checkbox"
                          value={cat}
                          checked={selectedCategories.includes(cat)}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSelectedCategories((prev) =>
                              prev.includes(value)
                                ? prev.filter((item) => item !== value)
                                : [...prev, value]
                            );
                          }}
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                  <button
                    className={styles.dangerButton}
                    onClick={handleDeleteSelectedCategories}
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Unit Popup */}
          {showAddUnitPopup && (
            <div className={styles.popupOverlay}>
              <div className={styles.popupCard}>
                <div className={styles.popupHeader}>
                  <h3>Add Unit</h3>
                  <button
                    onClick={() => setShowAddUnitPopup(false)}
                    className={styles.closeButton}
                  >
                    &times;
                  </button>
                </div>
                <div className={styles.popupBody}>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    placeholder="Enter unit name"
                  />
                  <button
                    className={styles.primaryButton}
                    onClick={handleAddUnit}
                  >
                    Add
                  </button>

                  <div className={styles.existingList}>
                    <h4>Existing Units</h4>
                    <ul>
                      {units.map((unit, idx) => (
                        <li key={idx}>{unit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Unit Popup */}
          {showDeleteUnitPopup && (
            <div className={styles.popupOverlay}>
              <div className={styles.popupCard}>
                <div className={styles.popupHeader}>
                  <h3>Delete Unit</h3>
                  <button
                    onClick={() => setShowDeleteUnitPopup(false)}
                    className={styles.closeButton}
                  >
                    &times;
                  </button>
                </div>
                <div className={styles.popupBody}>
                  <div className={styles.checkboxGroup}>
                    {units.map((unit, idx) => (
                      <label key={idx}>
                        <input
                          type="checkbox"
                          value={unit}
                          checked={selectedUnits.includes(unit)}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSelectedUnits((prev) =>
                              prev.includes(value)
                                ? prev.filter((item) => item !== value)
                                : [...prev, value]
                            );
                          }}
                        />
                        {unit}
                      </label>
                    ))}
                  </div>
                  <button
                    className={styles.dangerButton}
                    onClick={handleDeleteSelectedUnits}
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
