import React, { useState } from "react";
import { authApi } from "../api";

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const res = await authApi.register(trimmedUser, password);
        onAuthSuccess(res.username || trimmedUser);
      } else {
        const res = await authApi.login(trimmedUser, password);
        onAuthSuccess(res.username || trimmedUser);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (toRegister) => {
    setIsRegister(toRegister);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-tabs">
          <button
            type="button"
            className={"modal-tab" + (!isRegister ? " active" : "")}
            onClick={() => switchTab(false)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={"modal-tab" + (isRegister ? " active" : "")}
            onClick={() => switchTab(true)}
          >
            Create Account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="auth-confirm">Confirm Password</label>
              <input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div className="modal-actions">
            <button
              type="submit"
              className="add-btn submit-auth-btn"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isRegister
                ? "Register"
                : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
