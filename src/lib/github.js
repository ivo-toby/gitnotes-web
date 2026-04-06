// GitHub OAuth Device Flow for frontend-only apps
// Docs: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow

const GITHUB_DEVICE_CODE_URL = 'https://github.com/login/device/code';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_URL = 'https://api.github.com';

const STORAGE_KEY_TOKEN = 'gitnotes_github_token';
const STORAGE_KEY_USER = 'gitnotes_github_user';

export class GitHubOAuth {
  constructor(clientId) {
    this.clientId = clientId;
    this.token = sessionStorage.getItem(STORAGE_KEY_TOKEN);
    this.user = JSON.parse(sessionStorage.getItem(STORAGE_KEY_USER) || 'null');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }

  async startDeviceFlow() {
    // Step 1: Request device code
    const deviceResponse = await fetch(GITHUB_DEVICE_CODE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.clientId,
        scope: 'repo read:user'
      })
    });

    if (!deviceResponse.ok) {
      throw new Error('Failed to start OAuth flow');
    }

    const deviceData = await deviceResponse.json();
    
    return {
      userCode: deviceData.user_code,
      verificationUrl: deviceData.verification_uri,
      deviceCode: deviceData.device_code,
      interval: deviceData.interval || 5
    };
  }

  async pollForToken(deviceCode, interval = 5) {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              client_id: this.clientId,
              device_code: deviceCode,
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
            })
          });

          const tokenData = await tokenResponse.json();

          if (tokenData.error) {
            if (tokenData.error === 'authorization_pending') {
              // Still waiting for user authorization
              return false; // Continue polling
            }
            if (tokenData.error === 'expired_token') {
              reject(new Error('Authorization expired. Please try again.'));
              return true; // Stop polling
            }
            reject(new Error(tokenData.error_description || tokenData.error));
            return true; // Stop polling
          }

          // Success! Store token
          this.token = tokenData.access_token;
          sessionStorage.setItem(STORAGE_KEY_TOKEN, this.token);

          // Fetch user info
          await this.fetchAndStoreUser();
          
          resolve(this.token);
          return true; // Stop polling
        } catch (error) {
          reject(error);
          return true; // Stop polling
        }
      };

      // Start polling
      const pollInterval = setInterval(async () => {
        const stopPolling = await poll();
        if (stopPolling) {
          clearInterval(pollInterval);
        }
      }, interval * 1000);

      // Also try immediately
      poll();
    });
  }

  async fetchAndStoreUser() {
    try {
      const response = await fetch(`${GITHUB_API_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        this.user = await response.json();
        sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_USER);
  }

  // GitHub API methods
  async request(endpoint, options = {}) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${GITHUB_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      this.logout();
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async getContents(owner, repo, path = '') {
    const encodedPath = path ? `/${encodeURIComponent(path)}` : '';
    return this.request(`/repos/${owner}/${repo}/contents${encodedPath}`);
  }

  async getFile(owner, repo, path) {
    const contents = await this.getContents(owner, repo, path);
    
    if (Array.isArray(contents)) {
      // It's a directory, not a file
      return null;
    }

    // Decode content from base64
    if (contents.content && contents.encoding === 'base64') {
      return {
        ...contents,
        decodedContent: atob(contents.content.replace(/\n/g, ''))
      };
    }

    return contents;
  }

  async createOrUpdateFile(owner, repo, path, content, message, sha = null) {
    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(content)))
    };

    if (sha) {
      body.sha = sha;
    }

    return this.request(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async deleteFile(owner, repo, path, sha, message) {
    return this.request(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message,
        sha
      })
    });
  }

  async getRepos() {
    return this.request('/user/repos?per_page=100&sort=updated');
  }
}

export default GitHubOAuth;
