import { verifySession } from '../services/sessionService.js';
import { findUserByWallet, findUserById } from '../services/userService.js';

/**
 * Extract token from HTTP-only cookie or Authorization header
 */
function extractToken(req) {
  if (req.cookies && req.cookies.solace_session) {
    return req.cookies.solace_session;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

/**
 * Optional authentication: attaches req.user if valid session present
 */
export async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      req.user = null;
      return next();
    }

    const sessionData = await verifySession(token);
    if (!sessionData) {
      req.user = null;
      return next();
    }

    // Double-check real-time user status in DB (by wallet address or user ID)
    let user = null;
    if (sessionData.address) {
      user = await findUserByWallet(sessionData.address);
    }
    if (!user && (sessionData.userId || sessionData.id)) {
      user = await findUserById(sessionData.userId || sessionData.id);
    }

    if (!user || user.status !== 'active') {
      req.user = null;
      return next();
    }

    req.user = {
      id: user.id,
      address: user.wallet_address || null,
      email: user.email || null,
      role: user.role,
      status: user.status,
      sessionId: sessionData.sessionId,
    };
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

/**
 * Strict authentication: requires active authenticated wallet session
 */
export async function requireAuth(req, res, next) {
  await authenticate(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please connect and authenticate your cryptocurrency wallet.',
        code: 'AUTH_REQUIRED',
      });
    }
    next();
  });
}

/**
 * Administrator authorization: requires admin or super_admin role verified on server
 */
export async function requireAdmin(req, res, next) {
  await authenticate(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please authenticate your administrator wallet.',
        code: 'AUTH_REQUIRED',
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Wallet ${req.user.address} is not authorized for administrator access. Please contact a platform super administrator.`,
        code: 'FORBIDDEN_NOT_ADMIN',
      });
    }

    next();
  });
}

/**
 * Super Administrator authorization
 */
export async function requireSuperAdmin(req, res, next) {
  await authenticate(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
    }

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Super administrator privileges required.',
        code: 'FORBIDDEN_NOT_SUPER_ADMIN',
      });
    }

    next();
  });
}
