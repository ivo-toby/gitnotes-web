import React, { useState, useEffect, useRef } from 'react';
import { useGitHub } from '../lib/GitHubContext';
import './LoginScreen.css';

export default function LoginScreen() {
  const { login, pollForToken, error: authError, loading } = useGitHub();
  const [step, setStep] = useState('initial'); // initial, code, polling, success
  const [userCode, setUserCode] = useState('');
  const [polling, setPolling] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearTimeout(pollRef.current);
      }
    };
  }, []);

  const handleLogin = async () => {
    try {
      setStep('code');
      setPolling(true);
      setStatusMessage('Starting authorization...');
      
      const flowData = await login();
      setUserCode(flowData.userCode);
      setStatusMessage('Waiting for authorization...');

      // Poll for the token
      pollRef.current = setTimeout(async () => {
        try {
          await pollForToken(flowData.deviceCode, flowData.interval);
          setStep('success');
          setPolling(false);
          setStatusMessage('Successfully authenticated!');
        } catch (err) {
          if (err.message !== 'authorization_pending') {
            setStep('error');
            setStatusMessage(err.message);
            setPolling(false);
          }
          // Otherwise continue polling
        }
      }, flowData.interval * 1000);
    } catch (err) {
      setStep('error');
      setStatusMessage(err.message);
    }
  };

  const handleReset = () => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
    }
    setStep('initial');
    setUserCode('');
    setPolling(false);
    setStatusMessage('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(userCode);
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
          <h2>Authorization Failed</h2>
          <p>{statusMessage || authError}</p>
          <button className="btn-primary" onClick={handleReset}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <div className="login-screen">
        <div className="login-card code-display">
          <h2>Authorize GitNotes</h2>
          <p className="instruction">Visit this URL:</p>
          <a 
            href="https://github.com/login/device" 
            target="_blank" 
            rel="noopener noreferrer"
            className="verification-url"
          >
            github.com/login/device
          </a>
          
          <p className="instruction">Enter this code:</p>
          <div className="code-box" onClick={copyToClipboard} title="Click to copy">
            <span className="code">{userCode}</span>
            <span className="copy-hint">📋</span>
          </div>
          
          <p className="status">
            {polling && <span className="spinner"></span>}
            {statusMessage}
          </p>

          <button className="btn-secondary" onClick={handleReset}>
            Cancel
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
        
        <button 
          className="btn-github" 
          onClick={handleLogin}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" className="github-icon">
            <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          {loading ? 'Connecting...' : 'Login with GitHub'}
        </button>

        {authError && (
          <p className="error-message">{authError}</p>
        )}

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
