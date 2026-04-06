# GitNotes Web - OAuth Cloudflare Worker Implementation

## Overview

This document describes the implementation of GitHub OAuth authentication for GitNotes Web using a Cloudflare Worker as a secure backend proxy.

## Problem Statement

GitNotes Web needs GitHub API access to read/write notes in a user's repository. Current authentication uses Personal Access Tokens (PAT), which require manual setup. OAuth provides a cleaner "Login with GitHub" experience.

**Challenge**: GitHub OAuth requires a client secret that cannot be safely stored in a browser-based SPA.

**Solution**: A Cloudflare Worker acts as a secure proxy, exchanging the OAuth code for a token without exposing the secret.

## Architecture

```
┌──────────────────┐        ┌────────────────────────┐        ┌──────────────┐
│   GitNotes Web   │        │   Cloudflare Worker    │        │   GitHub    │
│   (React SPA)    │──────▶│   gitnotes-auth        │──────▶│   OAuth     │
│                  │  popup │   (secret lives here)  │  POST  │   API       │
│   localStorage   │◀───────│                        │◀───────│              │
│   stores token   │  HTML  │                        │  JSON  │              │
└──────────────────┘        └────────────────────────┘        └──────────────┘
```

## Components

### 1. Cloudflare Worker (`worker/`)

**File**: `worker/src/index.ts`

The worker handles the OAuth callback flow:

1. **Initial request** (no `?code=`): Redirects to GitHub OAuth authorize page with client_id, redirect_uri, scope, and state
2. **Callback request** (`?code=xxx`): 
   - Exchanges the code for an access token (with client_secret)
   - Returns an HTML page that:
     - Sets `localStorage.gitnotes_github_token` with the token
     - Sets `localStorage.gitnotes_auth_method = 'oauth'`
     - Auto-closes the popup after 2 seconds
3. **Error handling**: Returns a user-friendly error page for any failures

**Configuration via wrangler.toml**:
- `GITHUB_CLIENT_ID` - public, set via secrets
- `GITHUB_CLIENT_SECRET` - private, set via secrets  
- `GITHUB_REDIRECT_URI` - must match GitHub OAuth App callback URL

### 2. React App Updates (`src/`)

**File**: `src/components/LoginScreen.jsx`

- Added `handleOAuthLogin()` function that opens a popup to the worker URL
- Polls for localStorage changes to detect successful auth
- Shows "Login with GitHub" button when `OAUTH_WORKER_URL` is configured
- Existing PAT login remains available as fallback

**File**: `src/components/LoginScreen.css`

- Added `.btn-oauth` styles for the OAuth button
- Added `.divider` styles to separate OAuth from PAT sections

## Authentication Flow

1. User clicks "Login with GitHub" → Popup opens to `https://gitnotes-auth.pages.dev`
2. Worker redirects to `https://github.com/login/oauth/authorize?...`
3. User approves on GitHub → GitHub redirects to worker with `?code=xxx`
4. Worker exchanges code for token (with secret) → Returns success HTML
5. Success HTML sets `localStorage.gitnotes_github_token` and closes popup
6. React app detects token and reloads → User is authenticated

## Security Considerations

1. **Client Secret**: Stored only in Cloudflare secrets, never exposed to browser
2. **Token Storage**: Same as PAT method (localStorage) - no additional risk
3. **Scope**: Uses `repo` scope for full read/write access to repositories
4. **CSRF Protection**: Currently uses client-side state validation (production should use Cloudflare KV)

## Deployment Steps (TODO for user tomorrow)

1. Create GitHub OAuth App at https://github.com/settings/applications/new
2. Deploy worker: `cd worker && npm install && wrangler secret put GITHUB_CLIENT_ID && wrangler secret put GITHUB_CLIENT_SECRET && npm run deploy`
3. Update `wrangler.toml` with actual deployment URL
4. Update `LoginScreen.jsx` with `OAUTH_WORKER_URL`
5. Test the flow

## Files Changed

| File | Change |
|------|--------|
| `worker/` (new) | Cloudflare Worker project |
| `worker/src/index.ts` (new) | OAuth handler logic |
| `worker/package.json` (new) | Dependencies |
| `worker/tsconfig.json` (new) | TypeScript config |
| `worker/wrangler.toml` (new) | Worker configuration |
| `worker/README.md` (new) | Setup instructions |
| `src/components/LoginScreen.jsx` | Added OAuth button and handler |
| `src/components/LoginScreen.css` | Added OAuth styles |
| `SPEC.md` (new) | This spec |

## Status

- [x] Worker implementation complete
- [x] React app OAuth button added
- [ ] GitHub OAuth App creation (pending user)
- [ ] Worker deployment (pending user)
- [ ] URL configuration (pending user)
- [ ] Testing (pending user)
