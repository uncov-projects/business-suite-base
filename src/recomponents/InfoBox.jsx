import React, { useState } from "react";
import styles from "../styles/InfoBox.module.css";
import { ChevronDown, ChevronRight, Minus, Maximize2 } from "lucide-react";

const InfoBox = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleBox = () => setIsOpen((prev) => !prev);

  return (
    <div
      className={`${styles.infoBoxContainer} ${
        isOpen ? styles.open : styles.closed
      }`}
    >
      <div className={styles.infoBoxHeader} onClick={toggleBox}>
        <div className={styles.infoBoxTitle}>
          {isOpen ? (
            <ChevronDown className={styles.infoToggleIcon} />
          ) : (
            <ChevronRight className={styles.infoToggleIcon} />
          )}
          <h4>{title}</h4>
        </div>
        <button className={styles.minimizeBtn}>
          {isOpen ? <Minus size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      <div
        className={styles.infoBoxBody}
        style={{
          maxHeight: isOpen ? "300px" : "0",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className={styles.infoBoxContent}>{children}</div>
      </div>
    </div>
  );
};

export default InfoBox;
