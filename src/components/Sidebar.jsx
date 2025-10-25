import { useNavigate, useLocation } from "react-router-dom";
import React, { useState } from "react";
import "../styles/Sidebar.css";
import logo from "../assets/LOGO-5.png";

const Sidebar = ({ setIsSidebarOpen }) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen((prev) => {
      const newState = !prev;
      setIsSidebarOpen(newState);
      return newState;
    });
  };

  const handleLogout = () => {
    navigate("/");
  };

  const menuItems = [
    { label: "dashboard", icon: "bx-home-alt" },
    { label: "inventory", icon: "bx bx-package" },
    { label: "purchase", icon: "bx bx-cart" },
    { label: "quotation", icon: "bx bx-file" },
    { label: "sales", icon: "bx-money" },
    { label: "invoice", icon: "bx bx-receipt" },
    { label: "show-bill", icon: "bx-show-alt" },
    { label: "commission", icon: "bx bx-receipt" },
  ];
  const [customerDropdown, setCustomerDropdown] = useState(false);

  return (
    <nav className={`sidebar ${isOpen ? "open" : "close"}`}>
      <header>
        <div className="image-text">
          <span className="image">
            <img src={logo} alt="Logo" />
          </span>
          {isOpen && (
            <div className="text header-text">
              <span className="name">uNCov.</span>
              <span className="profession">Business Suite</span>
            </div>
          )}
        </div>
        <i
          className="bx bx-chevron-right toggle"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        ></i>
      </header>

      <div className="menu-bar">
        <ul className="menu">
          <li className="search-box">
            <i
              className="bx bx-menu icon"
              onClick={() => !isOpen && toggleSidebar()}
            ></i>
            {isOpen && <span className="text nav-text">Menu</span>}
          </li>

          {menuItems.map((item, index) => {
            const path = `/${item.label}`;
            const isActive = location.pathname === path;

            return (
              <li
                key={index}
                className={`nav-link ${isActive ? "active" : ""}`}
                onClick={() => navigate(path)}
              >
                <i className={`bx ${item.icon} icon`}></i>
                <span className="text nav-text">
                  {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
                </span>
                {!isOpen && (
                  <span className="tooltip">
                    {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
                  </span>
                )}
              </li>
            );
          })}
          {/* Customer Dropdown */}
          <li
            className={`nav-link ${customerDropdown ? "open-dropdown" : ""}`}
            onClick={() => setCustomerDropdown(!customerDropdown)}
          >
            <i className="bx bx-user-circle icon"></i>
            <span className="text nav-text">Customer</span>
            <i
              className={`bx ${
                customerDropdown ? "bx-chevron-down" : "bx-chevron-right"
              } dropdown-arrow`}
            ></i>
            {!isOpen && <span className="tooltip">Customer</span>}
          </li>

          {customerDropdown && (
            <ul className="submenu">
              <li
                className={`nav-link ${
                  location.pathname === "/customer" ? "active" : ""
                }`}
                onClick={() => navigate("/customer")}
              >
                <i className="bx bx-user-plus icon"></i>
                <span className="text nav-text">Customer</span>
                {!isOpen && <span className="tooltip">Customer</span>}
              </li>
              <li
                className={`nav-link ${
                  location.pathname === "/debtor" ? "active" : ""
                }`}
                onClick={() => navigate("/debtor")}
              >
                <i className="bx bx-error-circle icon"></i>
                <span className="text nav-text">Debtor</span>
                {!isOpen && <span className="tooltip">Debtor</span>}
              </li>
            </ul>
          )}
        </ul>

        <ul className="menu bottom-content">
          <li className="nav-link" onClick={() => navigate("/settings")}>
            <i className="bx bx-cog icon"></i>
            {isOpen && <span className="text nav-text">Settings</span>}
            {!isOpen && <span className="tooltip">Settings</span>}
          </li>

          <li className="nav-link" onClick={handleLogout}>
            <i className="bx bx-log-out icon"></i>
            <span className="text nav-text">Logout</span>
            {!isOpen && <span className="tooltip">Logout</span>}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
