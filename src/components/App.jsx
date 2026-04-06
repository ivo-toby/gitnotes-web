import React, { useState } from 'react';
import { useGitHub } from '../lib/GitHubContext';
import { useSettings } from '../lib/SettingsContext';
import LoginScreen from './LoginScreen';
import SetupScreen from './SetupScreen';
import FileBrowser from './FileBrowser';
import Editor from './Editor';
import SettingsView from './SettingsView';
import './App.css';

export default function App() {
  const { isAuthenticated, loading: authLoading, user, logout } = useGitHub();
  const { isConfigured, settings, resetSettings } = useSettings();
  
  const [currentView, setCurrentView] = useState('files'); // files, editor, settings
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPath, setCurrentPath] = useState('');

  const handleSelectFile = (file, path) => {
    setSelectedFile(file);
    setCurrentPath(path || '');
    if (file) {
      setCurrentView('editor');
    }
  };

  const handleBack = () => {
    setSelectedFile(null);
    setCurrentView('files');
  };

  const handleLogout = () => {
    logout();
    resetSettings();
    setCurrentView('files');
    setSelectedFile(null);
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show setup screen if not configured
  if (!isConfigured) {
    return <SetupScreen />;
  }

  // Show editor
  if (currentView === 'editor' && selectedFile) {
    return (
      <div className="app-container">
        <Editor
          file={selectedFile}
          currentPath={currentPath}
          onNavigate={handleSelectFile}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Show settings
  if (currentView === 'settings') {
    return (
      <div className="app-container">
        <SettingsView onClose={() => setCurrentView('files')} />
      </div>
    );
  }

  // Show file browser (default)
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <span className="app-logo">📝</span>
          <h1>GitNotes</h1>
        </div>
        
        <div className="header-center">
          <div className="repo-badge">
            <span className="repo-name">{settings.owner}/{settings.repo}</span>
            <span className="branch-name">{settings.branch}</span>
          </div>
        </div>

        <div className="header-right">
          {user?.avatar_url && (
            <img 
              src={user.avatar_url} 
              alt={user.login} 
              className="user-avatar"
              title={user.login}
            />
          )}
          <button 
            className="btn-settings"
            onClick={() => setCurrentView('settings')}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="app-main">
        <FileBrowser 
          onSelectFile={handleSelectFile}
          currentPath={currentPath}
        />
      </main>

      <footer className="app-footer">
        <span className="footer-hint">
          Tap a file to edit, tap a folder to navigate
        </span>
      </footer>
    </div>
  );
}
