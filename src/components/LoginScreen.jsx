import React, { useState } from 'react';
import { useGitHub } from '../lib/GitHubContext';
import './LoginScreen.css';

export default function LoginScreen() {
  const { authenticateWithToken, error: authError, loading } = useGitHub();
  const [step, setStep] = useState('initial'); // initial, success, error
  const [tokenInput, setTokenInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [showToken, setShowToken] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const token = tokenInput.trim();
    
    if (!token) {
      setStep('error');
      setStatusMessage('Please enter your Personal Access Token');
      return;
    }
    
    try {
      setStep('initial');
      setStatusMessage('Validating token...');
      await authenticateWithToken(token);
      setStep('success');
      setStatusMessage('Successfully authenticated!');
    } catch (err) {
      setStep('error');
      setStatusMessage(err.message);
    }
  };

  const handleReset = () => {
    setStep('initial');
    setTokenInput('');
    setStatusMessage('');
  };

  if (step === 'success') {
    return (
      <div className="login-screen">
        <div className="login-card success">
          <div className="success-icon">✓</div>
          <h2>Connected!</h2>
          <p>{statusMessage}</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="login-screen">
        <div className="login-card error">
          <div className="error-icon">!</div>
          <h2>Authentication Failed</h2>
          <p>{statusMessage || authError}</p>
          <button className="btn-primary" onClick={handleReset}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="logo">
          <span className="logo-icon">📝</span>
          <h1>GitNotes</h1>
        </div>
        <p className="tagline">Edit your GitHub repository notes from anywhere</p>
        
        <form onSubmit={handleLogin} className="token-form">
          <label htmlFor="token" className="token-label">
            Enter your GitHub Personal Access Token
          </label>
          <div className="token-input-wrapper">
            <input
              id="token"
              type={showToken ? 'text' : 'password'}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="token-input"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowToken(!showToken)}
              title={showToken ? 'Hide token' : 'Show token'}
            >
              {showToken ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <button 
            type="submit"
            className="btn-github" 
            disabled={loading || !tokenInput.trim()}
          >
            <svg viewBox="0 0 24 24" className="github-icon">
              <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </form>

        <div className="help-section">
          <details>
            <summary>How to get a Personal Access Token</summary>
            <div className="help-content">
              <ol>
                <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">GitHub Settings → Personal Access Tokens</a></li>
                <li>Click <strong>Generate new token (classic)</strong></li>
                <li>Give it a name (e.g., "GitNotes")</li>
                <li>Select scopes: <code>repo</code> (for private repos) and <code>read:user</code></li>
                <li>Click <strong>Generate token</strong></li>
                <li>Copy the token and paste it above</li>
              </ol>
              <p className="warning">⚠️ Save the token somewhere safe — you won't be able to see it again!</p>
            </div>
          </details>
        </div>

        <div className="features">
          <div className="feature">
            <span className="feature-icon">📁</span>
            <span>Browse files</span>
          </div>
          <div className="feature">
            <span className="feature-icon">✏️</span>
            <span>Edit markdown</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔄</span>
            <span>Auto-save</span>
          </div>
        </div>
      </div>
    </div>
  );
}
