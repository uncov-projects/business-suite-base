// src/recomponents/AdditionalInfoBox.jsx
import React, { useState } from "react";
import "../styles/AdditionalInfoBox.css";


const AdditionalInfoBox = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`additional-info-box ${isExpanded ? "expanded" : "collapsed"}`}>
      <div
        className="additional-info-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3>Additional Information</h3>
        <i
          className={`bx ${
            isExpanded ? "bx-chevron-up" : "bx-chevron-down"
          } toggle-icon`}
        ></i>
      </div>

      {isExpanded && (
        <div className="additional-info-content">
          <div className="item-header">
            <span>Items</span>
            <span>QTY</span>
            <span>UNIT</span>
            <span>Cost</span>
            <span>Amount</span>
          </div>

          <div className="item-row">
            <input type="text" placeholder="Description" />
            <input type="number" placeholder="Qty" />
            <input type="text" placeholder="Unit" />
            <input type="number" placeholder="₹0.00" />
            <input type="text" placeholder="₹0.00" disabled />
          </div>

          <div className="item-row">
            <input type="text" placeholder="Description" />
            <input type="number" placeholder="Qty" />
            <input type="text" placeholder="Unit" />
            <input type="number" placeholder="₹0.00" />
            <input type="text" placeholder="₹0.00" disabled />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdditionalInfoBox;
