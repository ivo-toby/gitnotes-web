import React, { useState, useEffect } from 'react';
import { useGitHub } from '../lib/GitHubContext';
import { useSettings } from '../lib/SettingsContext';
import './SetupScreen.css';

export default function SetupScreen() {
  const { github, user } = useGitHub();
  const { settings, updateSettings, isConfigured } = useSettings();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customForm, setCustomForm] = useState({
    owner: settings.owner || '',
    repo: settings.repo || '',
    branch: settings.branch || 'main',
    path: settings.path || ''
  });

  useEffect(() => {
    if (github && isAuthenticated()) {
      loadRepos();
    }
  }, [github]);

  const isAuthenticated = () => {
    return github && github.isAuthenticated();
  };

  const loadRepos = async () => {
    if (!github) return;
    
    setLoading(true);
    try {
      const allRepos = await github.getRepos();
      setRepos(allRepos);
    } catch (err) {
      console.error('Failed to load repos:', err);
    }
    setLoading(false);
  };

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectRepo = (repo) => {
    updateSettings({
      owner: repo.owner.login,
      repo: repo.name,
      branch: repo.default_branch || 'main',
      path: ''
    });
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    updateSettings(customForm);
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="setup-screen">
      <div className="setup-container">
        <div className="setup-header">
          <div className="user-info">
            {user?.avatar_url && (
              <img src={user.avatar_url} alt="" className="user-avatar" />
            )}
            <span>Logged in as <strong>{user?.login}</strong></span>
          </div>
          <h1>Select a Repository</h1>
          <p>Choose a repository to edit notes from</p>
        </div>

        {!showCustom ? (
          <>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner-large"></div>
                <p>Loading repositories...</p>
              </div>
            ) : (
              <div className="repo-list">
                {filteredRepos.length === 0 ? (
                  <div className="empty-state">
                    <p>No repositories found</p>
                    {searchTerm && <p className="hint">Try a different search term</p>}
                  </div>
                ) : (
                  filteredRepos.map(repo => (
                    <button
                      key={repo.id}
                      className={`repo-item ${settings.repo === repo.name && settings.owner === repo.owner.login ? 'selected' : ''}`}
                      onClick={() => selectRepo(repo)}
                    >
                      <div className="repo-icon">{repo.private ? '🔒' : '📁'}</div>
                      <div className="repo-info">
                        <div className="repo-name">{repo.name}</div>
                        <div className="repo-meta">
                          <span className="repo-owner">{repo.owner.login}</span>
                          {repo.language && <span className="repo-lang">{repo.language}</span>}
                        </div>
                      </div>
                      {repo.description && (
                        <div className="repo-description">{repo.description}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="setup-footer">
              <button 
                className="btn-link"
                onClick={() => setShowCustom(true)}
              >
                Enter repository manually
              </button>
            </div>
          </>
        ) : (
          <form className="custom-form" onSubmit={handleCustomSubmit}>
            <div className="form-group">
              <label htmlFor="owner">Repository Owner</label>
              <input
                type="text"
                id="owner"
                placeholder="username or organization"
                value={customForm.owner}
                onChange={(e) => setCustomForm(f => ({ ...f, owner: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="repo">Repository Name</label>
              <input
                type="text"
                id="repo"
                placeholder="my-notes"
                value={customForm.repo}
                onChange={(e) => setCustomForm(f => ({ ...f, repo: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="branch">Branch</label>
              <input
                type="text"
                id="branch"
                placeholder="main"
                value={customForm.branch}
                onChange={(e) => setCustomForm(f => ({ ...f, branch: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="path">Folder Path (optional)</label>
              <input
                type="text"
                id="path"
                placeholder="docs/notes"
                value={customForm.path}
                onChange={(e) => setCustomForm(f => ({ ...f, path: e.target.value }))}
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowCustom(false)}
              >
                Back to list
              </button>
              <button type="submit" className="btn-primary">
                Continue
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
