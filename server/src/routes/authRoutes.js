import { Router } from 'express';
import {
  getChallengeHandler,
  verifyChallengeHandler,
  getMeHandler,
  logoutHandler,
  evaluatorSignHandler,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public Challenge & Verification
router.post('/challenge', getChallengeHandler);
router.post('/verify', verifyChallengeHandler);
router.post('/evaluator-sign', evaluatorSignHandler);

// Authenticated Session Endpoints
router.get('/me', requireAuth, getMeHandler);
router.post('/logout', logoutHandler);

export default router;
