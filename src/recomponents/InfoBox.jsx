import React, { useState } from "react";
import "../styles/InfoBox.css";
import { ChevronDown, ChevronRight, Minus, Maximize2 } from "lucide-react";

const InfoBox = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleBox = () => setIsOpen((prev) => !prev);

  return (
    <div className={`info-box-container ${isOpen ? "open" : "closed"}`}>
      <div className="info-box-header" onClick={toggleBox}>
        <div className="info-box-title">
          {isOpen ? (
            <ChevronDown className="info-toggle-icon" />
          ) : (
            <ChevronRight className="info-toggle-icon" />
          )}
          <h4>{title}</h4>
        </div>
        <button className="minimize-btn">
          {isOpen ? <Minus size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      <div
        className="info-box-body"
        style={{
          maxHeight: isOpen ? "300px" : "0",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="info-box-content">{children}</div>
      </div>
    </div>
  );
};

export default InfoBox;
