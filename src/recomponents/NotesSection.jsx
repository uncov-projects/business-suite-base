import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/NotesSection.module.css";

const NotesSection = ({ selectedNotes, setSelectedNotes, maxNotes = 5 }) => {
  const [notes, setNotes] = useState([]);
  const [noteType, setNoteType] = useState("text");
  const [notePrefix, setNotePrefix] = useState("+");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [showNotePopup, setShowNotePopup] = useState(false);
  const clickTimeoutRef = useRef(null);

  const reachedNoteLimit = maxNotes <= 0;

  const fetchNotes = async () => {
    const noteList = await window.electron.getAllNotes(); // your preload call
    setNotes(noteList);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleEditNote = (note, idx) => {
    setEditingIndex(idx);
    const derivedType = note.notes_flag === 1 ? "kv" : "text";
    setNoteTitle(note.notes_title || "");
    setNoteValue(note.notes_content || "");
    setNoteType(derivedType);
    setNotePrefix(derivedType === "kv" ? note.notes_operation || "+" : "+");
    setShowNotePopup(true);
  };

  const handleSelectNote = (note) => {
    setSelectedNotes((prev) => {
      // prevent duplicates
      const alreadyAdded = prev.some((n) => n.notes_id === note.notes_id);
      if (alreadyAdded) return prev;
      return [...prev, note];
    });
    setShowNotePopup(false);
  };

  const handleSaveNote = async () => {
    if (!noteTitle || !noteValue) return;

    const noteFlag = noteType === "text" ? 0 : 1;

    const newNote = {
      title: noteTitle,
      content: noteValue, // main text
      flag: noteFlag,
      operation: noteType === "kv" ? notePrefix : null, // store prefix in operation
      value: noteType === "kv" ? noteValue : null, // numeric / kv value
    };

    if (editingIndex !== null) {
      // until you create an IPC update, just update locally
      const noteId = notes[editingIndex].notes_id; // get id from list
      await window.electron.updateNote(noteId, newNote);
      await fetchNotes(); // refresh after update
    } else {
      // ⬇️ insert into DB via IPC
      await window.electron.addNote(newNote);
      await fetchNotes(); // refresh list after insert
    }

    // reset form
    setNoteTitle("");
    setNoteValue("");
    setEditingIndex(null);
  };
  return (
    <div className="input-group full-width">
      <label>Notes / Terms</label>
      <div className={styles["note-section"]}>
        <div
          className={`${styles["add-note-box"]} ${
            reachedNoteLimit ? styles.disabled : ""
          }`}
          onClick={() => {
            if (reachedNoteLimit) return;
            setShowNotePopup(true);
          }}
        >
          + Add Note
        </div>

        {selectedNotes.map((note, idx) => (
          <div key={idx} className={styles["note-block"]}>
            <div className={styles["note-header"]}>
              {note.notes_flag === 1 && `${note.notes_operation} `}
              {note.notes_title}
              <i
                className="bx bx-trash"
                style={{
                  float: "right",
                  marginRight: "6px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  const updated = selectedNotes.filter((_, i) => i !== idx);
                  setSelectedNotes(updated);
                }}
              ></i>
            </div>
            <div className={styles["note-content"]}>{note.notes_content}</div>
          </div>
        ))}
      </div>

      {showNotePopup && (
        <div className={styles["note-popup-overlay"]}>
          <div className={styles["note-popup"]}>
            <div className={styles["popup-header"]}>
              <h3>Select or Manage Notes</h3>
              <i
                className="bx bx-x"
                onClick={() => {
                  setShowNotePopup(false);
                  setNoteTitle("");
                  setNoteValue("");
                  setEditingIndex(null);
                }}
              ></i>
            </div>

            <div className={styles["note-scroll-wrapper"]}>
              <div className={styles["note-scroll-inner"]}>
                {notes.map((note, idx) => (
                  <div
                    key={idx}
                    className={styles["note-block"]}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      if (reachedNoteLimit) return;
                      handleSelectNote(note);
                    }}
                  >
                    <div className={styles["note-header"]}>
                      {note.notes_flag === 1 && `${note.notes_operation} `}
                      {note.notes_title}
                      <i
                        className="bx bx-trash"
                        style={{
                          float: "right",
                          marginRight: "6px",
                          cursor: "pointer",
                        }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          const noteId = note.notes_id;
                          try {
                            await window.electron.deleteNote(noteId); // call IPC
                            const updated = notes.filter((_, i) => i !== idx);
                            setNotes(updated);
                            if (editingIndex === idx) {
                              setNoteTitle("");
                              setNoteValue("");
                              setEditingIndex(null);
                            }
                          } catch (err) {
                            console.error("Failed to delete note:", err);
                          }
                        }}
                      ></i>
                    </div>
                    <div className={styles["note-content"]}>
                      {note.notes_content}
                    </div>
                    <i
                      className={`bx bx-edit ${styles["note-edit-icon"]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearTimeout(clickTimeoutRef.current);
                        clickTimeoutRef.current = null;
                        handleEditNote(note, idx);
                      }}
                    ></i>
                  </div>
                ))}
              </div>
            </div>

            <label>Note Type:</label>
            <select
              value={noteType}
              disabled={editingIndex !== null}
              onChange={(e) => {
                setNoteType(e.target.value);
                setNoteTitle("");
                setNoteValue("");
              }}
            >
              <option value="text"> Text</option>
              <option value="kv">Description And Value</option>
            </select>

            {noteType === "text" ? (
              <>
                <label style={{ marginTop: "10px" }}>Note Title</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Delivery Terms"
                />

                <label>Note Content</label>
                <input
                  type="text"
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  placeholder="e.g. Deliver before 5PM"
                />
              </>
            ) : (
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label>Description</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <select
                      value={notePrefix}
                      onChange={(e) => setNotePrefix(e.target.value)}
                      style={{ width: "60px", padding: "8px" }}
                    >
                      <option value="+">+</option>
                      <option value="-">-</option>
                    </select>

                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="e.g. Warranty"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label>Value</label>
                  <input
                    type="number"
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                    placeholder="e.g. Rs 100"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            )}

            <div className={styles["note-popup-actions"]}>
              <button
                className={styles["popup-save-btn"]}
                onClick={handleSaveNote}
              >
                {editingIndex !== null ? "Update Note" : "Add Note"}
              </button>

              <button
                className={styles["popup-cancel-btn"]}
                onClick={() => {
                  setNoteTitle("");
                  setNoteValue("");
                  setNoteType("text");
                  setNotePrefix("+");
                  setEditingIndex(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesSection;
