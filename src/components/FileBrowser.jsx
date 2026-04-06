import React, { useState, useEffect, useCallback } from 'react';
import { useGitHub } from '../lib/GitHubContext';
import { useSettings } from '../lib/SettingsContext';
import './FileBrowser.css';

export default function FileBrowser({ onSelectFile, currentPath }) {
  const { github } = useGitHub();
  const { settings } = useSettings();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [path, setPath] = useState(currentPath || '');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const loadContents = useCallback(async () => {
    if (!github || !settings.owner || !settings.repo) return;

    setLoading(true);
    setError(null);

    try {
      const data = await github.getContents(settings.owner, settings.repo, path);
      setContents(data || []);
    } catch (err) {
      setError(err.message);
      setContents([]);
    }

    setLoading(false);
  }, [github, settings.owner, settings.repo, path]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  const navigateToFolder = (folderName) => {
    const newPath = path ? `${path}/${folderName}` : folderName;
    setPath(newPath);
    onSelectFile(null, newPath);
  };

  const navigateUp = () => {
    const parts = path.split('/');
    parts.pop();
    const newPath = parts.join('/');
    setPath(newPath);
    onSelectFile(null, newPath);
  };

  const navigateToRoot = () => {
    setPath('');
    onSelectFile(null, '');
  };

  const selectFile = (file) => {
    onSelectFile(file, path);
  };

  const createFile = async () => {
    if (!newFileName.trim()) {
      setCreateError('Please enter a file name');
      return;
    }

    // Ensure .md extension
    let fileName = newFileName.trim();
    if (!fileName.endsWith('.md')) {
      fileName += '.md';
    }

    // Check for invalid characters
    if (/[~^:?*[]/.test(fileName)) {
      setCreateError('File name contains invalid characters');
      return;
    }

    const filePath = path ? `${path}/${fileName}` : fileName;

    setCreating(true);
    setCreateError(null);

    try {
      await github.createOrUpdateFile(
        settings.owner,
        settings.repo,
        filePath,
        newFileContent || `# ${fileName.replace('.md', '')}\n\n`,
        `Create ${fileName}`,
        null // no sha = create new file
      );

      // Reset form and close modal
      setNewFileName('');
      setNewFileContent('');
      setShowNewFileModal(false);

      // Refresh file list
      loadContents();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const closeNewFileModal = () => {
    setShowNewFileModal(false);
    setNewFileName('');
    setNewFileContent('');
    setCreateError(null);
  };

  // Filter out hidden files (dotfiles) from the listing
  const visibleContents = contents.filter(item => !item.name.startsWith('.'));

  // Sort: folders first, then files, both alphabetically
  const sortedContents = [...visibleContents].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  const pathParts = path ? path.split('/') : [];

  return (
    <div className="file-browser">
      <div className="browser-header">
        <div className="breadcrumb">
          <button 
            className="breadcrumb-item root" 
            onClick={navigateToRoot}
            title="Go to root"
          >
            📁 {settings.repo}
          </button>
          {pathParts.map((part, index) => (
            <React.Fragment key={index}>
              <span className="breadcrumb-sep">/</span>
              <button 
                className="breadcrumb-item"
                onClick={() => {
                  const newPath = pathParts.slice(0, index + 1).join('/');
                  setPath(newPath);
                  onSelectFile(null, newPath);
                }}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="path-info">
          <span className="path-label">Branch:</span>
          <span className="path-value">{settings.branch}</span>
        </div>
      </div>

      {path && (
        <button className="nav-up" onClick={navigateUp}>
          <span className="nav-icon">⬆️</span>
          <span>Go up</span>
        </button>
      )}

      <button className="btn-new-file" onClick={() => setShowNewFileModal(true)}>
        <span>➕</span>
        <span>New File</span>
      </button>

      {loading ? (
        <div className="browser-loading">
          <div className="spinner"></div>
          <p>Loading files...</p>
        </div>
      ) : error ? (
        <div className="browser-error">
          <p className="error-icon">⚠️</p>
          <p className="error-message">{error}</p>
          <button onClick={loadContents} className="btn-retry">
            Try Again
          </button>
        </div>
      ) : sortedContents.length === 0 ? (
        <div className="browser-empty">
          <p>📂</p>
          <p>This folder is empty</p>
        </div>
      ) : (
        <div className="file-list">
          {sortedContents.map((item) => (
            <button
              key={item.path}
              className={`file-item ${item.type === 'dir' ? 'folder' : 'file'}`}
              onClick={() => item.type === 'dir' ? navigateToFolder(item.name) : selectFile(item)}
            >
              <span className="file-icon">
                {item.type === 'dir' ? '📁' : getFileIcon(item.name)}
              </span>
              <span className="file-name">{item.name}</span>
              {item.type === 'file' && (
                <span className="file-size">{formatFileSize(item.size)}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="modal-overlay" onClick={closeNewFileModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New File</h3>
              <button className="modal-close" onClick={closeNewFileModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="newFileName">File Name</label>
                <input
                  id="newFileName"
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="my-note"
                  disabled={creating}
                />
                <small>.md will be added automatically</small>
              </div>
              <div className="form-group">
                <label htmlFor="newFileContent">Initial Content (optional)</label>
                <textarea
                  id="newFileContent"
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="Start writing..."
                  rows={6}
                  disabled={creating}
                />
              </div>
              {createError && (
                <div className="form-error">{createError}</div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={closeNewFileModal}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={createFile}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const icons = {
    md: '📝',
    markdown: '📝',
    txt: '📄',
    js: '📜',
    jsx: '⚛️',
    ts: '📜',
    tsx: '⚛️',
    json: '📋',
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    py: '🐍',
    rb: '💎',
    go: '🔵',
    rs: '🦀',
    java: '☕',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    pdf: '📕',
    zip: '📦',
    gitignore: '👁️',
    lock: '🔒',
    env: '🔐'
  };
  return icons[ext] || '📄';
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}
