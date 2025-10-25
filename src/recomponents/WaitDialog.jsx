import React from "react";
import "../styles/WaitDialog.css";

const WaitDialog = ({ message }) => {
  return (
    <div className="wait-dialog-overlay">
      <div className="wait-dialog-content">
        <p>{message}</p>
        <div className="loader"></div>
      </div>
    </div>
  );
};

export default WaitDialog;