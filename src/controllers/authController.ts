import { Request, Response } from 'express';
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

// Complete Twitter OAuth flow (token exchange + user info)
export const completeTwitterAuth = async (
  req: Request<{}, ApiResponse<{ user: { id: string; username: string; name: string }; access_token: string }>, TwitterTokenRequest>,
  res: Response<ApiResponse<{ user: { id: string; username: string; name: string }; access_token: string }> | ApiError>
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

    // Exchange code for token
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: TWITTER_CLIENT_ID!,
      code_verifier: codeVerifier,
    });

    const authHeader = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Twitter token exchange failed:', tokenResponse.status, errorText);

      res.status(tokenResponse.status).json({
        error: 'Twitter token exchange failed',
        message: `Twitter API returned ${tokenResponse.status}: ${errorText}`
      });
      return;
    }

    const tokenData = await tokenResponse.json() as TwitterTokenResponse;

    // Get user info using the access token
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,verified', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Twitter user info fetch failed:', userResponse.status);
      res.status(500).json({
        error: 'Failed to get user information',
        message: 'Could not retrieve user data from Twitter'
      });
      return;
    }

    const userData = await userResponse.json() as TwitterUserResponse;

    // Return both token and user data
    res.json({
      success: true,
      data: {
        access_token: tokenData.access_token,
        user: {
          id: userData.data.id,
          username: userData.data.username,
          name: userData.data.name,
        }
      }
    });
  } catch (error) {
    console.error('Twitter OAuth completion error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage
    });
  }
};

// Legacy Twitter Token Exchange (kept for compatibility)
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

    const data = await response.json() as TwitterTokenResponse;

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

// Complete Discord OAuth flow (token exchange + user info)
export const completeDiscordAuth = async (
  req: Request<{}, ApiResponse<{ user: { id: string; username: string; displayName: string; avatar?: string }; access_token: string }>, DiscordTokenRequest>,
  res: Response<ApiResponse<{ user: { id: string; username: string; displayName: string; avatar?: string }; access_token: string }> | ApiError>
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

    // Exchange code for token
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: DISCORD_CLIENT_ID!,
      client_secret: DISCORD_CLIENT_SECRET!,
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Discord token exchange failed:', tokenResponse.status, errorText);

      res.status(tokenResponse.status).json({
        error: 'Discord token exchange failed',
        message: `Discord API returned ${tokenResponse.status}: ${errorText}`
      });
      return;
    }

    const tokenData = await tokenResponse.json() as DiscordTokenResponse;

    // Get user info using the access token
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Discord user info fetch failed:', userResponse.status);
      res.status(500).json({
        error: 'Failed to get user information',
        message: 'Could not retrieve user data from Discord'
      });
      return;
    }

    const userData = await userResponse.json() as DiscordUserResponse;

    // Create display name
    const displayName = userData.global_name ||
      `${userData.username}${userData.discriminator !== '0' ? `#${userData.discriminator}` : ''}`;

    // Return both token and user data
    res.json({
      success: true,
      data: {
        access_token: tokenData.access_token,
        user: {
          id: userData.id,
          username: userData.username,
          displayName,
          avatar: userData.avatar,
        }
      }
    });
  } catch (error) {
    console.error('Discord OAuth completion error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage
    });
  }
};

// Legacy Discord Token Exchange (kept for compatibility)
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

    const data = await response.json() as DiscordTokenResponse;

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
