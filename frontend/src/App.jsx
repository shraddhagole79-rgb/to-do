import React, { useState, useEffect, useCallback } from "react";
import { authApi, todoApi } from "./api";
import PieChart from "./components/PieChart";
import TodoItem from "./components/TodoItem";
import AuthModal from "./components/AuthModal";

const THEME_KEY = "todo_theme_pref";

const PRIORITY_COLORS = {
  low: "#5E8C74",
  medium: "#C99A3C",
  high: "#C2634A",
};

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1.2V2.6M8 13.4V14.8M14.8 8H13.4M2.6 8H1.2M12.7 3.3L11.7 4.3M4.3 11.7L3.3 12.7M12.7 12.7L11.7 11.7M4.3 4.3L3.3 3.3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13.5 9.5A6 6 0 116.5 2.5a5 5 0 007 7z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M2.5 14c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function App() {
  const [user, setUser] = useState(authApi.getUsername());
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || "light";
    } catch {
      return "light";
    }
  });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Load todos from backend when user is logged in
  const loadTodos = useCallback(async () => {
    if (!authApi.isAuthenticated()) {
      setTodos([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await todoApi.getAll();
      setTodos(data);
    } catch (err) {
      setError(err.message || "Failed to load tasks");
      if (!authApi.isAuthenticated()) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos, user]);

  const handleAuthSuccess = (newUsername) => {
    setUser(newUsername);
    loadTodos();
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    setTodos([]);
  };

  // Add a new task
  const addTodo = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!authApi.isAuthenticated()) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const created = await todoApi.create({
        text: trimmed,
        priority,
        dueDate: dueDate || null,
        done: false,
      });
      setTodos((prev) => [created, ...prev]);
      setText("");
      setDueDate("");
    } catch (err) {
      setError(err.message || "Failed to add task");
    }
  };

  // Toggle todo done status
  const toggleTodo = async (id, done) => {
    try {
      // Optimistic update
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
      await todoApi.update(id, { done });
    } catch (err) {
      setError(err.message || "Failed to update task");
      loadTodos();
    }
  };

  // Inline edit task title
  const editTodo = async (id, newText) => {
    try {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: newText } : t)));
      await todoApi.update(id, { text: newText });
    } catch (err) {
      setError(err.message || "Failed to edit task");
      loadTodos();
    }
  };

  // Delete a todo
  const deleteTodo = async (id) => {
    try {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      await todoApi.delete(id);
    } catch (err) {
      setError(err.message || "Failed to delete task");
      loadTodos();
    }
  };

  // Clear completed
  const clearCompleted = async () => {
    try {
      setTodos((prev) => prev.filter((t) => !t.done));
      await todoApi.clearCompleted();
    } catch (err) {
      setError(err.message || "Failed to clear completed tasks");
      loadTodos();
    }
  };

  // Filtering & Search
  const filtered = todos
    .filter((t) => (filter === "all" ? true : filter === "active" ? !t.done : t.done))
    .filter((t) => t.text.toLowerCase().includes(query.trim().toLowerCase()));

  const remaining = todos.filter((t) => !t.done).length;
  const hasCompleted = todos.some((t) => t.done);
  const completedCount = todos.length - remaining;

  const chartSegments = [
    { label: "Completed", color: "#B7B8AF", value: completedCount },
    { label: "High", color: PRIORITY_COLORS.high, value: todos.filter((t) => !t.done && t.priority === "high").length },
    { label: "Medium", color: PRIORITY_COLORS.medium, value: todos.filter((t) => !t.done && t.priority === "medium").length },
    { label: "Low", color: PRIORITY_COLORS.low, value: todos.filter((t) => !t.done && t.priority === "low").length },
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div>
          <h1>Todo</h1>
          <p>Keep track of what needs doing.</p>
        </div>

        <div className="header-actions">
          {user ? (
            <div className="user-profile">
              <span className="user-badge" title={`Signed in as ${user}`}>
                <UserIcon />
                <span className="username">{user}</span>
              </span>
              <button className="ghost-btn" onClick={handleLogout} title="Sign Out">
                Logout
              </button>
            </div>
          ) : (
            <button className="auth-btn" onClick={() => setIsAuthOpen(true)}>
              Sign In
            </button>
          )}

          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle dark mode"
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>

      {/* Guest Notice */}
      {!user && (
        <div className="auth-notice" onClick={() => setIsAuthOpen(true)}>
          <p>
            🔒 You are currently in guest mode. <strong>Sign in or create an account</strong> to save and sync your tasks with SQLite & JWT!
          </p>
        </div>
      )}

      {/* Error alert */}
      {error && <div className="global-error">{error}</div>}

      {/* Task Statistics & Pie Chart Overview */}
      <div className="overview">
        <PieChart segments={chartSegments} />
        <div className="overview-text">
          <div className="stats-row">
            <span className="count">{remaining}</span>
            <span className="label">
              task{remaining === 1 ? "" : "s"} remaining · {todos.length} total
            </span>
          </div>
          <div className="legend">
            {chartSegments.map((s) => (
              <span className="legend-item" key={s.label}>
                <span className="legend-dot" style={{ background: s.color }}></span>
                {s.label} ({s.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="search-wrap">
        <input
          className="search-input"
          type="text"
          placeholder="Search tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Add Task Form */}
      <form className="add-row" onSubmit={addTodo}>
        <input
          className="add-input"
          type="text"
          placeholder={user ? "Add a new task..." : "Sign in to add tasks..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <select
          className="priority-select"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          aria-label="Priority"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          className="date-input"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="Due date"
        />
        <button className="add-btn" type="submit">
          Add
        </button>
      </form>

      {/* Filter Tabs */}
      <div className="filter-row">
        {["all", "active", "completed"].map((f) => (
          <button
            key={f}
            className={"filter-btn" + (filter === f ? " active" : "")}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        {hasCompleted && (
          <button className="clear-completed" onClick={clearCompleted}>
            Clear completed
          </button>
        )}
      </div>

      {/* Task List or Empty State */}
      {loading ? (
        <div className="empty-state">
          <p>Loading your tasks...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">○</div>
          <p>{todos.length === 0 ? "No tasks yet. Add one above." : "Nothing matches here."}</p>
        </div>
      ) : (
        <ul className="todo-list">
          {filtered.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onEdit={editTodo}
            />
          ))}
        </ul>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
