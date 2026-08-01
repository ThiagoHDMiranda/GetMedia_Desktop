# GetMedia Desktop

A desktop application for downloading videos and audio from YouTube and other platforms. Built with Electron, React, TypeScript, and Vite.

## Features

- 🎬 Download videos (MP4, WebM) and audio (MP3, M4A)
- 🌍 Multi-language support (English, Portuguese)
- 🌓 Dark and light theme
- 📋 Download history with status tracking
- ⚙️ Configurable download destination
- 🔄 Auto-update (checks for new versions on startup and via Settings)

## Download

Download the latest version from the [Releases page](https://github.com/ThiagoHDMiranda/GetMedia_Desktop/releases/latest):

1. Go to [Releases](https://github.com/ThiagoHDMiranda/GetMedia_Desktop/releases/latest)
2. Download the `.exe` file from the latest release
3. Run it — no installation required (portable)

The app will automatically check for updates on startup. You can also manually check via **Settings → Update checker**.

## Development

### Prerequisites

- Node.js 22+
- npm

### Getting started

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production (local, no publish)
npm run build

# Build and publish a release (creates GitHub Release)
npm run release
```

### Releasing a new version

1. Bump the `version` in `package.json`
2. Commit and push your changes
3. Tag and push:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
4. GitHub Actions will automatically build the `.exe` and publish a Release

## Tech Stack

- **Electron** — cross-platform desktop runtime
- **React + TypeScript** — UI framework
- **Vite** — build tool and dev server
- **electron-builder** — packaging and distribution
- **electron-updater** — auto-update via GitHub Releases
- **i18next** — internationalization
- **Lucide React** — icons

## License

MIT © [ThiagoHDMiranda](https://github.com/ThiagoHDMiranda)
