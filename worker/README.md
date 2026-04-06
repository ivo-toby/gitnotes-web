# GitNotes Auth Worker

A Cloudflare Worker that handles GitHub OAuth authentication for the GitNotes Web app.

## Why Do We Need This?

The GitNotes Web app needs a GitHub Personal Access Token (PAT) to read/write files in your repository. Since GitHub's OAuth flow requires a client secret that cannot be safely stored in a browser, this worker acts as a secure proxy:

```
Browser (React app) → Worker (secret here) → GitHub API
```

## Setup Instructions

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new) → **OAuth Apps** → **New OAuth App**
2. Fill in the details:
   - **Application name**: GitNotes Web
   - **Homepage URL**: `https://ivo-toby.github.io/gitnotes-web`
   - **Authorization callback URL**: `https://gitnotes-auth.pages.dev/callback` (or your custom subdomain)
3. Click **Register application**
4. Save your **Client ID** (public, needed for the React app)
5. Generate a **Client Secret** (click **Generate a new client secret**)
6. Copy both values — you'll need them in the next step

### 2. Deploy the Worker to Cloudflare

1. Install dependencies:
   ```bash
   cd worker
   npm install
   ```

2. Set the secrets (replace with your actual values):
   ```bash
   # The redirect URI must match what you registered with GitHub
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   ```

3. Update `wrangler.toml` with your deployment subdomain:
   ```toml
   [vars]
   GITHUB_REDIRECT_URI = "https://gitnotes-auth.pages.dev/callback"
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. Note the deployment URL (e.g., `https://gitnotes-auth.pages.dev`)

### 3. Update GitHub OAuth App Callback

If you used a temporary callback URL during setup, update it now to match your actual worker URL.

### 4. Update the React App

In `src/components/Auth.jsx`, update the OAuth worker URL to match your deployment:

```javascript
const OAUTH_WORKER_URL = 'https://gitnotes-auth.pages.dev'; // Your worker URL
```

### 5. Test the Flow

1. Clear any existing localStorage (or use incognito)
2. Open GitNotes Web
3. Click "Login with GitHub"
4. Approve the OAuth request on GitHub
5. You should be redirected back and see "Authentication Successful"
6. The popup should close automatically

## Security Notes

- The **Client Secret** is stored only in Cloudflare secrets — it's never exposed to the browser
- Tokens are stored in localStorage (same as PAT-based auth — no additional risk)
- For production, consider adding CSRF validation using Cloudflare KV store to store the state parameter

## Troubleshooting

### "OAuth is not properly configured"
- Ensure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` secrets are set
- Run: `wrangler secret list` to verify

### "Application not found" error
- Check that the GitHub OAuth App callback URL matches exactly (including https://)
- The worker URL must be accessible

### Token not persisting
- Check browser console for any errors
- Ensure the popup isn't blocked by the browser

## File Structure

```
worker/
├── src/
│   └── index.ts      # Main worker code
├── package.json       # Dependencies (wrangler, typescript)
├── tsconfig.json     # TypeScript config
└── wrangler.toml     # Worker configuration
```
