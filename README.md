# GitNotes Web

A mobile-friendly web app for editing markdown notes directly in your GitHub repositories. Built with React, uses GitHub OAuth Device Flow for authentication, and deploys to GitHub Pages.

## Features

- **📁 Browse Repositories** - Navigate through your GitHub repo files and folders
- **✏️ Edit Markdown** - Full-featured markdown editor with toolbar
- **👁️ Live Preview** - Toggle between edit and preview modes with syntax highlighting
- **🔐 GitHub OAuth** - Secure authentication using GitHub's Device Flow (no backend needed)
- **📱 Mobile-First** - Responsive design optimized for mobile browsers
- **🌙 Dark/Light Mode** - Automatic theme based on system preference

## Quick Start

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - **Application Name**: GitNotes Web
   - **Homepage URL**: `https://ivo-toby.github.io/gitnotes-web`
   - **Authorization callback URL**: `https://ivo-toby.github.io/gitnotes-web` (or your custom domain)
4. Click **Register application**
5. Copy the **Client ID** from the registered app

### 2. Configure the App

Create a `.env` file in the root directory:

```bash
VITE_GITHUB_CLIENT_ID=your_client_id_here
```

Or set it as a GitHub Actions secret named `GITHUB_CLIENT_ID` for automatic deployment.

### 3. Run Locally

```bash
npm install
npm run dev
```

### 4. Deploy to GitHub Pages

The app automatically deploys to GitHub Pages when pushed to the `main` branch. Enable GitHub Pages in your repository settings:
- **Source**: GitHub Actions

## How It Works

### Authentication (Device Flow)

GitNotes uses GitHub's OAuth Device Flow, which works entirely in the browser without a backend:

1. User clicks "Login with GitHub"
2. App displays a user code and instructions
3. User visits github.com/activate and enters the code
4. App polls GitHub and receives the access token
5. Token is stored in sessionStorage

### File Operations

All operations use the GitHub REST API v3:
- `GET /repos/{owner}/{repo}/contents/{path}` - List directory contents
- `GET /repos/{owner}/{repo}/contents/{path}` (file) - Get file content
- `PUT /repos/{owner}/{repo}/contents/{path}` - Create/update files
- `DELETE /repos/{owner}/{repo}/contents/{path}` - Delete files

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Markdown** - Markdown rendering
- **react-syntax-highlighter** - Code syntax highlighting
- **GitHub Actions** - CI/CD and deployment
- **GitHub Pages** - Hosting

## License

MIT
