# Contentful Migration Tool (Desktop App)

A professional desktop application for creating backups, migrating content, and managing Contentful environments. Built with **Electron** and **Next.js**, this tool provides a robust and user-friendly interface for your Contentful operations.

## Features

- **Desktop Experience**: Native application window with system integration.
- **Secure Authentication**: Browser-based Contentful authentication flow.
- **Environment Management**: Easy selection of Spaces and Environments.
- **Smart Backups**: Create full content backups including entries, assets, and content types.
- **Seamless Migration**: Migrate content between environments (e.g., Dev to Master) with conflict resolution.
- **Custom Restore**: Restore specific data from local backup files.
- **Selective Migration**: Choose specific content types to migrate.
- **Visual Comparison**: Analyze differences between environments before migrating.

## Prerequisites

- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **npm 7+** (comes with Node.js)

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/contentful-migration-tool.git
   cd contentful-migration-tool
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (Optional):**
   Create a `.env` file in the root directory if you wish to pre-configure tokens (though you can log in via the UI):
   ```env
   CONTENTFUL_MANAGEMENT_TOKEN=your_token_here
   ```

## Development

### Desktop App (Electron + Next.js)

To start the full desktop application in development mode:

```bash
npm run dev
```

This command will:
1. Start the Next.js local server on port 3000.
2. Launch the Electron application window pointing to the local server.
3. Enable Hot Module Replacement (HMR).

### Web Version Only (Next.js)

If you only want to work on the UI/logic without the Electron wrapper:

```bash
npm run next:dev
```
*Access the app at http://localhost:3000*

This command will:
1. Start the Next.js local server on port 3000.
2. Enable Hot Module Replacement (HMR) for rapid development.

## Building for Production

To build the desktop application for your specific platform:

### Windows
```bash
npm run build:win
```
*Output: `dist/Contentful Migration Tool Setup <version>.exe`*

### macOS
```bash
npm run build:mac
```
*Output: `dist/Contentful Migration Tool-<version>.dmg`*

### Linux
```bash
npm run build:linux
```
*Output: `dist/Contentful Migration Tool-<version>.AppImage`*

## Project Structure

- **`electron/`**: Main process code for Electron (`main.js`, `preload.js`).
- **`src/`**: Next.js source code (Renderer process).
  - **`pages/`**: Application routes and API endpoints.
  - **`components/`**: React UI components.
  - **`utils/`**: Helper functions and Contentful SDK integration.
- **`backups/`**: Local directory where backups are stored.
- **`public/`**: Static assets.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Window doesn't open** | Ensure port 3000 is free. Run `npm run dev` and wait for "Ready" message. |
| **Login fails** | Check your internet connection. The tool requires access to Contentful's API. |
| **Build fails** | Ensure you have the necessary build tools for your OS installed (e.g., Visual Studio Build Tools for Windows). |

## License

MIT

## Contact

For issues or feature requests, please open an issue in the repository.
