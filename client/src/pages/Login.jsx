import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getToken } from "../utils/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setMessage(err?.message || "Login failed. Please check your credentials.");
    }
  };

  if (getToken()) {
    navigate("/");
    return null;
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit">Login</button>
          {message && <p className="error-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;
