import React from "react";
import "../styles/Pagination.css";     


const Pagination = ({
  totalPages,
  currentPage,
  onPageChange,
  windowSize = 5,
}) => {
  if (totalPages <= 1) return null; 

  
  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= windowSize + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    const start = Math.max(2, currentPage - Math.floor(windowSize / 2));
    const end   = Math.min(totalPages - 1, start + windowSize - 1);

    if (start > 2) pages.push("…");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("…");

    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
      >
        &lt;
      </button>

      {getPageNumbers().map((p, i) =>
        p === "…" ? (
          <span key={`dots-${i}`} className="dots">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={currentPage === p ? "activePage" : ""}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;
