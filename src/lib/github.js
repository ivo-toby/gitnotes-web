// GitHub API authentication using Personal Access Tokens (PAT)
// PATs work directly from browser apps without CORS issues
// Docs: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

const GITHUB_API_URL = 'https://api.github.com';

const STORAGE_KEY_TOKEN = 'gitnotes_github_token';
const STORAGE_KEY_USER = 'gitnotes_github_user';

export class GitHubOAuth {
  constructor() {
    this.token = localStorage.getItem(STORAGE_KEY_TOKEN);
    this.user = JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || 'null');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }

  /**
   * Authenticate with a Personal Access Token
   * @param {string} token - GitHub PAT
   * @returns {Promise<Object>} - User info
   */
  async authenticateWithToken(token) {
    // Validate token by fetching user info
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid token. Please check your Personal Access Token.');
      }
      throw new Error(`Failed to authenticate: ${response.statusText}`);
    }

    this.user = await response.json();
    this.token = token;
    
    localStorage.setItem(STORAGE_KEY_TOKEN, this.token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
    
    return this.user;
  }

  async logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
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

    // Decode content from base64 (with proper UTF-8 handling)
    if (contents.content && contents.encoding === 'base64') {
      return {
        ...contents,
        decodedContent: decodeURIComponent(escape(atob(contents.content.replace(/\n/g, ''))))
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
