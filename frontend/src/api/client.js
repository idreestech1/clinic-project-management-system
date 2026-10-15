const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
};

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => apiRequest(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) => apiRequest(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => apiRequest(path, { method: "DELETE" }),
};
