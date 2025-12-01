import express from 'express';
import { completeTwitterAuth, exchangeTwitterToken, completeDiscordAuth, exchangeDiscordToken } from '../controllers/authController';
import { validateTwitterTokenRequest, validateDiscordTokenRequest } from '../middleware/validation';

const router = express.Router();

// Complete OAuth flows (recommended - handles token + user info)
router.post('/auth/twitter/complete', validateTwitterTokenRequest, completeTwitterAuth);
router.post('/auth/discord/complete', validateDiscordTokenRequest, completeDiscordAuth);

// Legacy token-only endpoints (for compatibility)
router.post('/auth/twitter/token', validateTwitterTokenRequest, exchangeTwitterToken);
router.post('/auth/discord/token', validateDiscordTokenRequest, exchangeDiscordToken);

export default router;
