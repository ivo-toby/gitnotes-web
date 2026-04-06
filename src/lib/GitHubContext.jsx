import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import GitHubOAuth from './github';

const GitHubContext = createContext(null);

export function GitHubProvider({ children }) {
  const [github, setGithub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const gh = new GitHubOAuth();
    setGithub(gh);
    
    if (gh.isAuthenticated()) {
      setIsAuthenticated(true);
      setUser(gh.getUser());
    }
    setLoading(false);
  }, []);

  const authenticateWithToken = useCallback(async (token) => {
    if (!github) return;
    
    setError(null);
    setLoading(true);
    
    try {
      const user = await github.authenticateWithToken(token);
      setIsAuthenticated(true);
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
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
    authenticateWithToken,
    logout
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
