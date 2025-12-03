import React from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import styles from "../styles/DataTable.module.css";

const DataTable = ({ headers, data, onRowClick, onEdit, onDelete }) => {
  return (
    <table className={styles.dataTable}>
      <thead>
        <tr>
          {headers.map((header, idx) => (
            <th key={idx}>{header}</th>
          ))}
          {(onEdit || onDelete) && <th>Actions</th>}
        </tr>
      </thead>

      <tbody>
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={headers.length + (onEdit || onDelete ? 1 : 0)}
              className={styles.noDataRow}
            >
              No Items to Show
            </td>
          </tr>
        ) : (
          data.map((row, idx) => (
            <tr
              key={idx}
              className={styles.clickableRow}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {Object.values(row)
                .slice(0, headers.length)
                .map((value, i) => (
                  <td key={i}>{value || "-"}</td>
                ))}

              {(onEdit || onDelete) && (
                <td
                  className={styles.actionCell}
                  onClick={(e) => e.stopPropagation()} // prevents row click when clicking buttons
                >
                  {onEdit && (
                    <button
                      className={`${styles.tableIconBtn} ${styles.editIcon}`}
                      title="Edit"
                      onClick={() => onEdit(row)}
                    >
                      <FiEdit />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className={`${styles.tableIconBtn} ${styles.deleteIcon}`}
                      title="Delete"
                      onClick={() =>
                        onDelete(row.id || row.customer_id || row._id)
                      }
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default DataTable;
