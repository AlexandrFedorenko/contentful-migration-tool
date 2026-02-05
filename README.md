# Contentful Migration Tool (Web App)

A professional web application for creating backups, migrating content, and managing Contentful environments. Built with **Next.js**, this tool provides a robust and user-friendly interface for your Contentful operations.

## Features

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

To start the application in development mode:

```bash
npm run dev
```

*Access the app at http://localhost:3000*

This command will:
1. Start the Next.js local server on port 3000.
2. Enable Hot Module Replacement (HMR) for rapid development.

## Building for Production

To build the application for production deployment:

```bash
npm run build
npm start
```

## Project Structure

- **`src/`**: Next.js source code.
  - **`pages/`**: Application routes and API endpoints.
  - **`components/`**: React UI components.
  - **`utils/`**: Helper functions and Contentful SDK integration.
- **`backups/`**: Local directory where backups are stored.
- **`public/`**: Static assets.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **App doesn't open** | Ensure port 3000 is free. Run `npm run dev` and check the console. |
| **Login fails** | Check your internet connection. The tool requires access to Contentful's API. |

## License

MIT

## Contact

For issues or feature requests, please open an issue in the repository.
