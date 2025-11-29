// OAuth Token Response Types
export interface TwitterTokenRequest {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface TwitterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface TwitterUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
  };
}

export interface DiscordTokenRequest {
  code: string;
  redirectUri: string;
}

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordUserResponse {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error Types
export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}
