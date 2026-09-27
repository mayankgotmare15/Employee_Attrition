const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'attrition_prediction_super_secret_jwt_2026';

/**
 * Middleware to verify JWT token and attach user to request object.
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, department: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session: user not found.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
}

/**
 * Middleware to restrict access to specific user roles (RBAC).
 * Allowed roles: 'ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'DEPT_MANAGER'
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRoles,
};
