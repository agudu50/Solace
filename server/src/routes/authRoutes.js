import { Router } from 'express';
import {
  getChallengeHandler,
  verifyChallengeHandler,
  getMeHandler,
  logoutHandler,
  evaluatorSignHandler,
  registerEmailHandler,
  loginEmailHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  linkWalletHandler,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Email Authentication
router.post('/register', registerEmailHandler);
router.post('/login', loginEmailHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);

// Public Blockchain Wallet Challenge & Verification
router.post('/challenge', getChallengeHandler);
router.post('/verify', verifyChallengeHandler);
router.post('/evaluator-sign', evaluatorSignHandler);

// Authenticated Session Endpoints
router.get('/me', requireAuth, getMeHandler);
router.post('/logout', logoutHandler);
router.post('/link-wallet', requireAuth, linkWalletHandler);

export default router;
