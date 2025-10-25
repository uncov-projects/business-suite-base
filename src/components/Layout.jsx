import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useState } from "react";
import "../styles/Layout.css"

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${!isSidebarOpen ? "collapsed" : ""}`}>
        <Sidebar setIsSidebarOpen={setIsSidebarOpen} />
      </div>

      <div className={`home ${!isSidebarOpen ? "collapsed" : ""}`}>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;