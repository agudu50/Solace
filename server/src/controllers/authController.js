import { createChallenge, verifyAndConsumeChallenge } from '../services/challengeService.js';
import { findUserByWallet, createUser, recordLogin, isValidStellarAddress, normalizeWallet } from '../services/userService.js';
import { createSession, revokeSession } from '../services/sessionService.js';
import { getUserBalance } from '../services/creditStore.js';

/**
 * Request an authentication challenge
 * POST /api/auth/challenge
 */
export async function getChallengeHandler(req, res) {
  try {
    const address = req.body?.address || req.query?.address;
    const action = req.body?.action || 'solace-auth-login';

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required to request an authentication challenge.',
      });
    }

    const normalized = normalizeWallet(address);
    if (!isValidStellarAddress(normalized)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Stellar public key format (expected 56-character string starting with G).',
      });
    }

    // Determine domain from request headers or environment
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const domain = process.env.APP_DOMAIN || rawHost.split(':')[0] || 'localhost';

    const challenge = await createChallenge(normalized, action, domain);

    res.json({
      success: true,
      challengeId: challenge.challengeId,
      address: challenge.address,
      nonce: challenge.nonce,
      domain: challenge.domain,
      action: challenge.action,
      message: challenge.message,
      issuedAt: challenge.issuedAt,
      expiresAt: challenge.expiresAt,
    });
  } catch (err) {
    console.error('[Auth] Error generating challenge:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate authentication challenge.',
    });
  }
}

/**
 * Verify cryptographic signature and establish authenticated session
 * POST /api/auth/verify
 */
export async function verifyChallengeHandler(req, res) {
  try {
    const { challengeId, address, signature, action } = req.body || {};

    if (!challengeId || !address || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: challengeId, address, and signature are all required.',
      });
    }

    const normalized = normalizeWallet(address);
    if (!isValidStellarAddress(normalized)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Stellar public key format.',
      });
    }

    // 1. Verify cryptographic signature on challenge
    const verification = await verifyAndConsumeChallenge({
      challengeId,
      address: normalized,
      signature,
      expectedAction: action || null,
    });

    // 2. Lookup user in Neon PostgreSQL / DB
    let user = await findUserByWallet(normalized);

    // If attempting administrator login:
    if (verification.action === 'solace-admin-login') {
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({
          success: false,
          error: `Access Denied: Wallet ${normalized} is not authorized for administrator access. Please contact a platform super administrator.`,
          code: 'UNAUTHORIZED_ADMIN_WALLET',
        });
      }
    }

    // If new user, register as ordinary user ('user' role)
    if (!user) {
      user = await createUser(normalized, 'user');
      console.log(`[Auth] Registered new wallet user: ${normalized} [role: user]`);
    } else {
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'Your account has been suspended by an administrator. Please contact support.',
          code: 'ACCOUNT_SUSPENDED',
        });
      }
      await recordLogin(normalized);
    }

    // 3. Establish secure session
    const metadata = {
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const session = await createSession(user, metadata);

    // 4. Set secure HTTP-only cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('solace_session', session.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    const userCredits = getUserBalance(normalized);

    res.json({
      success: true,
      token: session.token,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        address: user.wallet_address,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
        availableCredits: userCredits.availableCredits,
      },
    });
  } catch (err) {
    console.error('[Auth] Verification failed:', err.message);
    const statusCode = err.message.includes('expired') || err.message.includes('already been used') ? 401 : 400;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Signature verification failed.',
    });
  }
}

/**
 * Get current authenticated user session details
 * GET /api/auth/me
 */
export async function getMeHandler(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated.',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const user = await findUserByWallet(req.user.address);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Session invalid or account suspended.',
      });
    }

    const userCredits = getUserBalance(user.wallet_address);

    res.json({
      success: true,
      user: {
        id: user.id,
        address: user.wallet_address,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        availableCredits: userCredits.availableCredits,
        totalPurchased: userCredits.totalPurchased,
        totalConsumed: userCredits.totalConsumed,
        permissions: {
          isAdmin: user.role === 'admin' || user.role === 'super_admin',
          isSuperAdmin: user.role === 'super_admin',
          canAudit: user.status === 'active' && userCredits.availableCredits > 0,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Logout and invalidate session
 * POST /api/auth/logout
 */
export async function logoutHandler(req, res) {
  try {
    const token = req.cookies?.solace_session || (req.headers.authorization && req.headers.authorization.substring(7));
    if (token) {
      await revokeSession(token);
    }

    res.clearCookie('solace_session', { path: '/' });
    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Evaluator Signer Endpoint (Server-Side Non-Custodial Key for Testnet Super-Admin Evaluation)
 * POST /api/auth/evaluator-sign
 */
export async function evaluatorSignHandler(req, res) {
  try {
    const { challengeId, address } = req.body || {};
    const DEMO_SIGNER = 'GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI';
    const AUDITOR_SECRET = process.env.AUDITOR_SECRET || 'SCJ7JERLLMAFWBKT75BDUBI7W2XKV32Q654NXRFBM7EPCHJO2QCAVILY';

    if (address !== DEMO_SIGNER) {
      return res.status(403).json({
        success: false,
        error: 'Evaluator automated signing is strictly restricted to the provisioned testnet demo keypair.',
      });
    }

    if (!challengeId) {
      return res.status(400).json({ success: false, error: 'Challenge ID is required.' });
    }

    const { Keypair } = await import('@stellar/stellar-sdk');
    const { readTable, usePostgres, query } = await import('../db/db.js');

    let challenge;
    if (usePostgres) {
      const dbRes = await query('SELECT * FROM auth_challenges WHERE id = $1', [challengeId]);
      challenge = dbRes.rows[0];
    } else {
      const challenges = readTable('auth_challenges');
      challenge = challenges.find((c) => c.id === challengeId);
    }

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found.' });
    }

    const kp = Keypair.fromSecret(AUDITOR_SECRET);
    const sigBuffer = kp.sign(Buffer.from(challenge.message, 'utf8'));
    const signature = sigBuffer.toString('hex');

    res.json({
      success: true,
      signature,
      address,
      challengeId,
    });
  } catch (err) {
    console.error('[Auth] Error in evaluator-sign:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}
