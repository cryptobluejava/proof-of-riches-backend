import { Request, Response } from 'express';
import fetch from 'node-fetch';
import {
  TwitterTokenRequest,
  TwitterTokenResponse,
  TwitterUserResponse,
  DiscordTokenRequest,
  DiscordTokenResponse,
  DiscordUserResponse,
  ApiResponse,
  ApiError
} from '../types/auth';

// Twitter OAuth 2.0 Configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

// Discord OAuth 2.0 Configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

// Validate environment variables
const validateTwitterConfig = (): void => {
  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    throw new Error('Twitter OAuth credentials not configured');
  }
};

const validateDiscordConfig = (): void => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    throw new Error('Discord OAuth credentials not configured');
  }
};

// Twitter Token Exchange
export const exchangeTwitterToken = async (
  req: Request<{}, ApiResponse<TwitterTokenResponse>, TwitterTokenRequest>,
  res: Response<ApiResponse<TwitterTokenResponse> | ApiError>
): Promise<void> => {
  try {
    validateTwitterConfig();

    const { code, codeVerifier, redirectUri } = req.body;

    if (!code || !codeVerifier || !redirectUri) {
      res.status(400).json({
        error: 'Missing required parameters',
        message: 'code, codeVerifier, and redirectUri are required'
      });
      return;
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: TWITTER_CLIENT_ID!,
      code_verifier: codeVerifier,
    });

    const authHeader = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitter token exchange failed:', response.status, errorText);

      res.status(response.status).json({
        error: 'Twitter token exchange failed',
        message: `Twitter API returned ${response.status}: ${errorText}`
      });
      return;
    }

    const data: TwitterTokenResponse = await response.json();

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Twitter token exchange error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage
    });
  }
};

// Discord Token Exchange
export const exchangeDiscordToken = async (
  req: Request<{}, ApiResponse<DiscordTokenResponse>, DiscordTokenRequest>,
  res: Response<ApiResponse<DiscordTokenResponse> | ApiError>
): Promise<void> => {
  try {
    validateDiscordConfig();

    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      res.status(400).json({
        error: 'Missing required parameters',
        message: 'code and redirectUri are required'
      });
      return;
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: DISCORD_CLIENT_ID!,
      client_secret: DISCORD_CLIENT_SECRET!,
    });

    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord token exchange failed:', response.status, errorText);

      res.status(response.status).json({
        error: 'Discord token exchange failed',
        message: `Discord API returned ${response.status}: ${errorText}`
      });
      return;
    }

    const data: DiscordTokenResponse = await response.json();

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Discord token exchange error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage
    });
  }
};
