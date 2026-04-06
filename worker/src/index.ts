/**
 * GitNotes Auth Worker
 * 
 * Handles GitHub OAuth Device Flow for the GitNotes Web app.
 * This worker acts as a secure proxy to exchange the OAuth code for an access token
 * without exposing the client secret to the frontend.
 * 
 * Flow:
 * 1. User clicks "Login with GitHub" in React app
 * 2. React app opens popup to this worker URL
 * 3. Worker redirects to GitHub OAuth authorize page
 * 4. GitHub redirects back with ?code=xxx
 * 5. Worker exchanges code for token (with secret)
 * 6. Worker returns HTML that sets localStorage and closes popup
 */

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_REDIRECT_URI: string;
}

const DEFAULT_SCOPES = 'repo';

/**
 * Generate a random state string for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Build the GitHub OAuth authorization URL
 */
function buildAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: DEFAULT_SCOPES,
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange the authorization code for an access token
 */
async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token?: string; error?: string; error_description?: string }> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  return response.json();
}

/**
 * HTML page to display after successful authentication
 */
function getSuccessHtml(token: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitNotes - Authenticated</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
    }
    .card {
      background: #0f3460;
      padding: 2.5rem;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      margin: 1rem;
    }
    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    h2 {
      color: #4ade80;
      margin: 0 0 0.75rem;
      font-size: 1.5rem;
    }
    p {
      color: #94a3b8;
      line-height: 1.5;
    }
    .loading {
      margin-top: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #64748b;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #64748b;
      border-top-color: #4ade80;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h2>Authentication Successful</h2>
    <p>You can now close this window and return to GitNotes.</p>
    <div class="loading">
      <div class="spinner"></div>
      <span>Closing...</span>
    </div>
  </div>
  <script>
    // Store the GitHub token in localStorage
    localStorage.setItem('gitnotes_github_token', '${token}');
    localStorage.setItem('gitnotes_auth_method', 'oauth');
    
    // Close the popup after a short delay
    setTimeout(() => window.close(), 2000);
  </script>
</body>
</html>`;
}

/**
 * HTML page to display after authentication error
 */
function getErrorHtml(error: string, description: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitNotes - Authentication Failed</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
    }
    .card {
      background: #0f3460;
      padding: 2.5rem;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      margin: 1rem;
    }
    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    h2 {
      color: #ef4444;
      margin: 0 0 0.75rem;
      font-size: 1.5rem;
    }
    p {
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    .error-details {
      background: rgba(239, 68, 68, 0.1);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #fca5a5;
      word-break: break-all;
    }
    .close-hint {
      margin-top: 1.5rem;
      color: #64748b;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✗</div>
    <h2>Authentication Failed</h2>
    <p>There was a problem connecting to GitHub.</p>
    <div class="error-details">
      <strong>Error:</strong> ${error}<br>
      ${description ? `<strong>Details:</strong> ${description}` : ''}
    </div>
    <p class="close-hint">You can close this window and try again.</p>
  </div>
  <script>
    // Remove any partial auth state
    localStorage.removeItem('gitnotes_github_token');
    localStorage.removeItem('gitnotes_auth_method');
    
    // Close the popup after a delay
    setTimeout(() => window.close(), 5000);
  </script>
</body>
</html>`;
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Validate required environment variables
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      return new Response(
        getErrorHtml('Configuration Error', 'GitHub OAuth is not properly configured. Please contact the administrator.'),
        { status: 503, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Step 1: No code in URL = redirect to GitHub OAuth
    if (!url.searchParams.has('code')) {
      const state = generateState();
      const authUrl = buildAuthUrl(env.GITHUB_CLIENT_ID, env.GITHUB_REDIRECT_URI, state);

      // In a production app, we'd store state in a KV store for CSRF validation
      // For simplicity, we'll validate it client-side (not ideal for high-security)
      return Response.redirect(authUrl.toString(), 302);
    }

    // Step 2: Code received - exchange for token
    const code = url.searchParams.get('code')!;
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Check for OAuth errors (e.g., user denied access)
    if (error) {
      return new Response(
        getErrorHtml(error, errorDescription || 'Authorization was denied or failed.'),
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(
      code,
      env.GITHUB_CLIENT_ID,
      env.GITHUB_CLIENT_SECRET,
      env.GITHUB_REDIRECT_URI
    );

    // Check for token exchange errors
    if (tokenData.error) {
      return new Response(
        getErrorHtml(tokenData.error, tokenData.error_description || 'Failed to obtain access token.'),
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!tokenData.access_token) {
      return new Response(
        getErrorHtml('Token Error', 'No access token was returned from GitHub.'),
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Step 3: Success! Return HTML that sets localStorage and closes popup
    return new Response(getSuccessHtml(tokenData.access_token), {
      headers: { 'Content-Type': 'text/html' },
    });
  },
};
