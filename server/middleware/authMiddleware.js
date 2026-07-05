const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token;

  // Check Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info
      req.user = decoded;

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }
};

const optionalProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // If token is invalid, do not block public access.
      req.user = null;
    }
  }
  next();
};

const adminOnly = async (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

const ownerOnly = async (req, res, next) => {
  if (req.user?.role !== "restaurant_owner") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Restaurant owner privileges required.",
    });
  }
  next();
};

module.exports = { protect, adminOnly, ownerOnly, optionalProtect };
