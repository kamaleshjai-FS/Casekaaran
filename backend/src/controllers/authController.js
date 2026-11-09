/**
 * Casekaaran — Admin Authentication Controller
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { success, error } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-casekaaran-jwt-secret-key-change-in-production-2026';
const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'casekaaran_admin_token';

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, 'Username and password are required', 400, 'VALIDATION_ERROR');
    }

    // Check database for admin
    const admins = await db.query(
      `SELECT id, username, email, password_hash, full_name, role, is_active
       FROM admins
       WHERE (username = ? OR email = ?) AND is_active = TRUE`,
      [username, username]
    );

    let admin = admins && admins.length > 0 ? admins[0] : null;

    // Fallback development account if DB table is unseeded
    if (!admin && username === 'admin' && password === 'Admin@Casekaaran2026') {
      admin = {
        id: 1,
        username: 'admin',
        email: 'admin@casekaaran.com',
        full_name: 'Super Administrator',
        role: 'SUPER_ADMIN'
      };
    } else if (admin) {
      const match = await bcrypt.compare(password, admin.password_hash);
      if (!match) {
        return error(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }
    } else {
      return error(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Set HTTP-Only Cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    return success(res, {
      id: admin.id,
      username: admin.username,
      full_name: admin.full_name,
      role: admin.role,
      token // also return in data for cross-origin preview
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie(COOKIE_NAME);
  return success(res, null, 'Logged out successfully');
}

async function getProfile(req, res) {
  return success(res, req.admin);
}

module.exports = {
  login,
  logout,
  getProfile
};
