import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/auth';

// Validate Twitter token request
export const validateTwitterTokenRequest = (
  req: Request,
  res: Response<ApiError>,
  next: NextFunction
): void => {
  const { code, codeVerifier, redirectUri } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({
      error: 'Invalid request',
      message: 'code is required and must be a string'
    });
    return;
  }

  if (!codeVerifier || typeof codeVerifier !== 'string') {
    res.status(400).json({
      error: 'Invalid request',
      message: 'codeVerifier is required and must be a string'
    });
    return;
  }

  if (!redirectUri || typeof redirectUri !== 'string') {
    res.status(400).json({
      error: 'Invalid request',
      message: 'redirectUri is required and must be a string'
    });
    return;
  }

  // Basic validation for URL format
  try {
    new URL(redirectUri);
  } catch {
    res.status(400).json({
      error: 'Invalid request',
      message: 'redirectUri must be a valid URL'
    });
    return;
  }

  next();
};

// Validate Discord token request
export const validateDiscordTokenRequest = (
  req: Request,
  res: Response<ApiError>,
  next: NextFunction
): void => {
  const { code, redirectUri } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({
      error: 'Invalid request',
      message: 'code is required and must be a string'
    });
    return;
  }

  if (!redirectUri || typeof redirectUri !== 'string') {
    res.status(400).json({
      error: 'Invalid request',
      message: 'redirectUri is required and must be a string'
    });
    return;
  }

  // Basic validation for URL format
  try {
    new URL(redirectUri);
  } catch {
    res.status(400).json({
      error: 'Invalid request',
      message: 'redirectUri must be a valid URL'
    });
    return;
  }

  next();
};
