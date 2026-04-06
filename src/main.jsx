import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import { GitHubProvider } from './lib/GitHubContext';
import { SettingsProvider } from './lib/SettingsContext';
import { ThemeProvider } from './lib/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <GitHubProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </GitHubProvider>
    </ThemeProvider>
  </React.StrictMode>
);
