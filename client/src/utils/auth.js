export const getToken = () => window.localStorage.getItem("reservation_token");
export const getUserRole = () => window.localStorage.getItem("reservation_role");

export const login = async ({ email, password }) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5009"}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  window.localStorage.setItem("reservation_token", data.token);
  window.localStorage.setItem("reservation_role", data.data.role || "user");
  return data;
};

export const logout = () => {
  window.localStorage.removeItem("reservation_token");
  window.localStorage.removeItem("reservation_role");
  window.location.href = "/";
};
