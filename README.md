# Larp or Not Backend

Backend service for Larp or Not application that handles OAuth authentication with Twitter and Discord.

## Features

- 🔐 OAuth 2.0 authentication for Twitter and Discord
- 🛡️ Security headers and CORS protection
- 🚦 Rate limiting
- 📝 TypeScript support
- 🔍 Request validation
- 🏥 Health check endpoint

## Prerequisites

- Node.js 18+
- Twitter OAuth 2.0 app credentials
- Discord OAuth 2.0 app credentials

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp env.example .env
```

4. Configure your environment variables in `.env`:
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Twitter OAuth 2.0 Credentials
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Discord OAuth 2.0 Credentials
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001` (or the port specified in your `.env`).

## Production

Build and start the production server:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and configuration info.

### Twitter OAuth
```
POST /api/auth/twitter/token
```
Exchanges authorization code for Twitter access tokens.

**Request Body:**
```json
{
  "code": "authorization_code_from_twitter",
  "codeVerifier": "pkce_code_verifier",
  "redirectUri": "http://localhost:3000/auth/callback"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "twitter_access_token",
    "token_type": "bearer",
    "expires_in": 7200,
    "refresh_token": "refresh_token",
    "scope": "tweet.read users.read offline.access"
  }
}
```

### Discord OAuth
```
POST /api/auth/discord/token
```
Exchanges authorization code for Discord access tokens.

**Request Body:**
```json
{
  "code": "authorization_code_from_discord",
  "redirectUri": "http://localhost:3000/auth/callback"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "discord_access_token",
    "token_type": "Bearer",
    "expires_in": 604800,
    "refresh_token": "refresh_token",
    "scope": "identify"
  }
}
```

## Security

- **CORS**: Configured to only allow requests from the frontend URL
- **Helmet**: Security headers enabled
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Request bodies are validated before processing
- **Error Handling**: Sensitive information is not exposed in error responses

## OAuth Setup

### Twitter
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app or use existing one
3. Configure OAuth 2.0 settings:
   - Type: Web App
   - Callback URLs: `http://localhost:3000/auth/callback` (for development)
   - Website URL: Your frontend URL
   - Enable OAuth 2.0
4. Copy Client ID and Client Secret to your `.env` file

### Discord
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or use existing one
3. Go to OAuth2 settings:
   - Redirects: Add `http://localhost:3000/auth/callback`
   - Scopes: `identify`
4. Copy Client ID and Client Secret to your `.env` file

## Deployment

### Vercel (Recommended)

1. Push this backend to a separate repository
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Update your frontend's `VITE_BACKEND_URL` to point to the Vercel deployment

### Other Platforms

This backend can be deployed to any Node.js hosting platform:
- Heroku
- Railway
- DigitalOcean App Platform
- AWS Lambda
- etc.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## License

MIT
