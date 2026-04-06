import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useGitHub } from '../lib/GitHubContext';
import { useSettings } from '../lib/SettingsContext';
import { useTheme } from '../lib/ThemeContext';
import './Editor.css';

export default function Editor({ file, currentPath, onNavigate, onBack }) {
  const { github } = useGitHub();
  const { settings } = useSettings();
  const { theme } = useTheme();
  
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [sha, setSha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const textareaRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  const filePath = file ? file.path : `${currentPath}/${file?.name || 'new-file.md'}`.replace(/^\//, '');

  // Load file content
  useEffect(() => {
    const loadFile = async () => {
      if (!github || !file) return;

      setLoading(true);
      setError(null);

      try {
        const fileData = await github.getFile(settings.owner, settings.repo, file.path);
        if (fileData) {
          setContent(fileData.decodedContent || '');
          setOriginalContent(fileData.decodedContent || '');
          setSha(fileData.sha);
        } else {
          // New file
          setContent('# New Note\n\nStart writing here...\n');
          setOriginalContent('');
          setSha(null);
        }
        setHasChanges(false);
      } catch (err) {
        setError(err.message);
      }

      setLoading(false);
    };

    loadFile();
  }, [github, settings.owner, settings.repo, file]);

  // Track changes
  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  // Auto-save timer (debounced)
  useEffect(() => {
    if (hasChanges && content.trim()) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true);
      }, 30000); // Auto-save after 30 seconds of inactivity
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasChanges, content]);

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!github || !content.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const message = isAutoSave 
        ? `Auto-save: ${file?.name || 'new file'}`
        : commitMessage || `Update: ${file?.name || 'new file'}`;
      
      await github.createOrUpdateFile(
        settings.owner,
        settings.repo,
        filePath,
        content,
        message,
        sha
      );

      // Update sha for future updates
      if (!sha) {
        const updatedFile = await github.getFile(settings.owner, settings.repo, filePath);
        if (updatedFile) {
          setSha(updatedFile.sha);
        }
      }

      setOriginalContent(content);
      setHasChanges(false);
      setLastSaved(new Date());
      setShowCommitDialog(false);
      setCommitMessage('');
    } catch (err) {
      setError(err.message);
    }

    setSaving(false);
  }, [github, settings.owner, settings.repo, filePath, content, commitMessage, sha]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const insertText = (before, after = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end);
    
    setContent(newContent);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarActions = [
    { label: 'B', title: 'Bold', before: '**', after: '**', placeholder: 'bold text' },
    { label: 'I', title: 'Italic', before: '_', after: '_', placeholder: 'italic text' },
    { label: 'H', title: 'Heading', before: '## ', after: '', placeholder: 'Heading' },
    { label: '🔗', title: 'Link', before: '[', after: '](url)', placeholder: 'link text' },
    { label: '📷', title: 'Image', before: '![', after: '](url)', placeholder: 'alt text' },
    { label: '📋', title: 'Code', before: '`', after: '`', placeholder: 'code' },
    { label: '📝', title: 'Code Block', before: '```\n', after: '\n```', placeholder: 'code block' },
    { label: '•', title: 'List', before: '- ', after: '', placeholder: 'list item' },
    { label: '☑', title: 'Task', before: '- [ ] ', after: '', placeholder: 'task item' },
    { label: '💬', title: 'Quote', before: '> ', after: '', placeholder: 'quote' },
  ];

  if (loading) {
    return (
      <div className="editor-container loading">
        <div className="spinner"></div>
        <p>Loading file...</p>
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="editor-container error">
        <p className="error-icon">⚠️</p>
        <p className="error-message">{error}</p>
        <button onClick={onBack} className="btn-back">
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-title">
          <button onClick={onBack} className="btn-back" title="Back to files">
            ←
          </button>
          <span className="file-name">
            {file?.name || 'New File'}
          </span>
          {hasChanges && <span className="unsaved-indicator" title="Unsaved changes">●</span>}
        </div>
        
        <div className="editor-actions">
          <button 
            className={`btn-toggle ${showPreview ? 'active' : ''}`}
            onClick={() => setShowPreview(!showPreview)}
            title="Toggle preview"
          >
            {showPreview ? '✏️ Edit' : '👁️ Preview'}
          </button>
          
          {hasChanges && (
            <>
              <button 
                className="btn-discard"
                onClick={() => {
                  setContent(originalContent);
                  setHasChanges(false);
                }}
                title="Discard changes"
              >
                Discard
              </button>
              
              <button 
                className="btn-save"
                onClick={() => setShowCommitDialog(true)}
                disabled={saving}
                title="Save changes"
              >
                {saving ? 'Saving...' : '💾 Save'}
              </button>
            </>
          )}
          
          {lastSaved && !hasChanges && (
            <span className="last-saved">
              Saved {formatTime(lastSaved)}
            </span>
          )}
        </div>
      </div>

      {showPreview ? (
        <div className="preview-pane">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={theme === 'dark' ? oneDark : oneLight}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="editor-toolbar">
          {toolbarActions.map((action, i) => (
            <button
              key={i}
              className="toolbar-btn"
              onClick={() => insertText(action.before, action.after, action.placeholder)}
              title={action.title}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {!showPreview && (
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing..."
          spellCheck="false"
        />
      )}

      {showCommitDialog && (
        <div className="commit-dialog-overlay" onClick={() => setShowCommitDialog(false)}>
          <div className="commit-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Commit Changes</h3>
            <p className="file-path">{filePath}</p>
            <textarea
              className="commit-message"
              placeholder="Describe your changes..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              autoFocus
            />
            <div className="commit-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowCommitDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-commit"
                onClick={() => handleSave(false)}
                disabled={saving || !commitMessage.trim()}
              >
                {saving ? 'Committing...' : 'Commit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && content && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
    </div>
  );
}

function formatTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}
