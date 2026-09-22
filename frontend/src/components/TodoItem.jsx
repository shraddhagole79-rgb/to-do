import React, { useState, useRef, useEffect } from "react";

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PRIORITY_COLORS = {
  low: "#5E8C74",
  medium: "#C99A3C",
  high: "#C2634A",
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5L6.5 12L13 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 4H13.5M6 4V2.5H10V4M6.5 7V11M9.5 7V11M3.5 4L4 13H12L12.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function isOverdue(todo) {
  if (!todo.dueDate || todo.done) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(todo.dueDate) < today;
}

function formatDue(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(todo.text);
  }, [todo.text]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== todo.text) {
      onEdit(todo.id, trimmed);
    } else {
      setDraft(todo.text);
    }
    setEditing(false);
  };

  return (
    <li className="todo-item">
      <div
        className={"checkbox" + (todo.done ? " checked" : "")}
        onClick={() => onToggle(todo.id, !todo.done)}
        role="checkbox"
        aria-checked={todo.done}
        tabIndex={0}
      >
        <CheckIcon />
      </div>

      <div className="todo-main">
        {editing ? (
          <input
            ref={inputRef}
            className="edit-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(todo.text);
                setEditing(false);
              }
            }}
          />
        ) : (
          <div
            className={"todo-text" + (todo.done ? " done" : "")}
            onDoubleClick={() => setEditing(true)}
            title="Double-click to edit"
          >
            {todo.text}
          </div>
        )}

        <div className="todo-meta">
          <span
            className="priority-dot"
            style={{ background: PRIORITY_COLORS[todo.priority] || PRIORITY_COLORS.medium }}
          ></span>
          <span className="priority-label">{PRIORITY_LABELS[todo.priority] || "Medium"}</span>
          {todo.dueDate && (
            <span className={"due-badge" + (isOverdue(todo) ? " overdue" : "")}>
              {isOverdue(todo) ? "Overdue · " : "Due "}
              {formatDue(todo.dueDate)}
            </span>
          )}
        </div>
      </div>

      <button className="delete-btn" onClick={() => onDelete(todo.id)} aria-label="Delete task">
        <TrashIcon />
      </button>
    </li>
  );
}
