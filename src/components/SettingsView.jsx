import React, { useState } from 'react';
import { useGitHub } from '../lib/GitHubContext';
import { useSettings } from '../lib/SettingsContext';
import { useTheme } from '../lib/ThemeContext';
import './SettingsView.css';

export default function SettingsView({ onClose }) {
  const { github, user, logout } = useGitHub();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testConnection = async () => {
    if (!github) return;
    
    setTesting(true);
    setTestResult(null);
    
    try {
      await github.getContents(settings.owner, settings.repo, settings.path);
      setTestResult({ success: true, message: 'Connection successful!' });
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    }
    
    setTesting(false);
  };

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const handleReset = () => {
    resetSettings();
    setShowResetConfirm(false);
    onClose?.();
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="btn-close" onClick={onClose}>×</button>
      </div>

      <div className="settings-content">
        {/* Account Section */}
        <section className="settings-section">
          <h3>Account</h3>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Connected as</span>
              <span className="setting-value">
                {user?.name || user?.login}
              </span>
            </div>
            {user?.avatar_url && (
              <img src={user.avatar_url} alt="" className="user-avatar-small" />
            )}
          </div>
          <button className="btn-danger" onClick={handleLogout}>
            Log out
          </button>
        </section>

        {/* Repository Section */}
        <section className="settings-section">
          <h3>Repository</h3>
          
          <div className="setting-item">
            <span className="setting-label">Owner</span>
            <input
              type="text"
              className="setting-input"
              value={settings.owner}
              onChange={(e) => updateSettings({ owner: e.target.value })}
              placeholder="username or org"
            />
          </div>

          <div className="setting-item">
            <span className="setting-label">Repository</span>
            <input
              type="text"
              className="setting-input"
              value={settings.repo}
              onChange={(e) => updateSettings({ repo: e.target.value })}
              placeholder="repo-name"
            />
          </div>

          <div className="setting-item">
            <span className="setting-label">Branch</span>
            <input
              type="text"
              className="setting-input"
              value={settings.branch}
              onChange={(e) => updateSettings({ branch: e.target.value })}
              placeholder="main"
            />
          </div>

          <div className="setting-item">
            <span className="setting-label">Path</span>
            <input
              type="text"
              className="setting-input"
              value={settings.path}
              onChange={(e) => updateSettings({ path: e.target.value })}
              placeholder="docs/notes (optional)"
            />
          </div>

          <button 
            className="btn-secondary" 
            onClick={testConnection}
            disabled={testing || !settings.owner || !settings.repo}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.success ? '✓' : '⚠️'} {testResult.message}
            </div>
          )}
        </section>

        {/* Appearance Section */}
        <section className="settings-section">
          <h3>Appearance</h3>
          
          <div className="setting-item">
            <span className="setting-label">Theme</span>
            <div className="theme-toggle">
              <button
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => toggleTheme()}
              >
                ☀️ Light
              </button>
              <button
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => toggleTheme()}
              >
                🌙 Dark
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="settings-section danger-zone">
          <h3>Danger Zone</h3>
          
          {!showResetConfirm ? (
            <button 
              className="btn-danger-outline"
              onClick={() => setShowResetConfirm(true)}
            >
              Reset All Settings
            </button>
          ) : (
            <div className="reset-confirm">
              <p>Are you sure? This will clear all settings including your repository configuration.</p>
              <div className="confirm-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-danger"
                  onClick={handleReset}
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          )}
        </section>

        {/* About */}
        <section className="settings-section about">
          <p>GitNotes Web v1.0.0</p>
          <p className="about-note">
            A simple, beautiful notes editor for your GitHub repositories.
          </p>
        </section>
      </div>
    </div>
  );
}
