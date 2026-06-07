import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApi } from "../utils/api";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await getApi().post("/auth/register", { username, email, password });
      navigate("/login");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h2>Create account</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              value={username}
              required
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
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
          <button type="submit">Register</button>
          {message && <p className="error-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default Register;
