import express from 'express';
import { exchangeTwitterToken, exchangeDiscordToken } from '../controllers/authController';
import { validateTwitterTokenRequest, validateDiscordTokenRequest } from '../middleware/validation';

const router = express.Router();

// Twitter OAuth token exchange
router.post('/auth/twitter/token', validateTwitterTokenRequest, exchangeTwitterToken);

// Discord OAuth token exchange
router.post('/auth/discord/token', validateDiscordTokenRequest, exchangeDiscordToken);

export default router;
