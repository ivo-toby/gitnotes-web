import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import GitHubOAuth from './github';

const GitHubContext = createContext(null);

// Get client ID from environment or use a placeholder (user needs to set this)
const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';

export function GitHubProvider({ children }) {
  const [github, setGithub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const gh = new GitHubOAuth(CLIENT_ID);
    setGithub(gh);
    
    if (gh.isAuthenticated()) {
      setIsAuthenticated(true);
      setUser(gh.getUser());
    }
    setLoading(false);
  }, []);

  const login = useCallback(async () => {
    if (!github) return;
    
    setError(null);
    setLoading(true);
    
    try {
      const flowData = await github.startDeviceFlow();
      return flowData; // Return so UI can show the code
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [github]);

  const pollForToken = useCallback(async (deviceCode, interval) => {
    if (!github) return;
    
    try {
      const token = await github.pollForToken(deviceCode, interval);
      setIsAuthenticated(true);
      setUser(github.getUser());
      return token;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [github]);

  const logout = useCallback(() => {
    if (github) {
      github.logout();
    }
    setIsAuthenticated(false);
    setUser(null);
  }, [github]);

  const value = {
    github,
    loading,
    error,
    isAuthenticated,
    user,
    login,
    pollForToken,
    logout,
    clientId: CLIENT_ID
  };

  return (
    <GitHubContext.Provider value={value}>
      {children}
    </GitHubContext.Provider>
  );
}

export function useGitHub() {
  const context = useContext(GitHubContext);
  if (!context) {
    throw new Error('useGitHub must be used within GitHubProvider');
  }
  return context;
}
