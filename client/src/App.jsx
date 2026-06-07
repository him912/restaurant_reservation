import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import RestaurantDetail from "./pages/RestaurantDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import { getToken, logout, getUserRole } from "./utils/auth";

function App() {
  const token = getToken();
  const role = getUserRole();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <Link to="/">EazyDiner</Link>
        </div>
        <nav>
          <Link to="/">Explore</Link>
          {token ? (
            <>
              <Link to="/profile">Profile</Link>
              <button className="link-button" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
          {role === "admin" && <span className="role-chip">Admin</span>}
          {role === "restaurant_owner" && <span className="role-chip">Owner</span>}
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>Restaurant reservations, reviews, and real-time availability in one platform.</p>
      </footer>
    </div>
  );
}

export default App;
