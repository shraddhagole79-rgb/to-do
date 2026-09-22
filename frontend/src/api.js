const TOKEN_KEY = "todo_jwt_token";
const USER_KEY = "todo_username";

/**
 * Base helper for making authenticated API requests.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // If token is invalid or expired, clear local storage
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
}

export const authApi = {
  async login(username, password) {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, data.username);
    }
    return data;
  },

  async register(username, password) {
    const data = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, data.username);
    }
    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUsername() {
    return localStorage.getItem(USER_KEY);
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

export const todoApi = {
  getAll() {
    return request("/api/todos");
  },

  create(todo) {
    return request("/api/todos", {
      method: "POST",
      body: JSON.stringify(todo),
    });
  },

  update(id, updates) {
    return request(`/api/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  delete(id) {
    return request(`/api/todos/${id}`, {
      method: "DELETE",
    });
  },

  clearCompleted() {
    return request("/api/todos/completed", {
      method: "DELETE",
    });
  },
};
