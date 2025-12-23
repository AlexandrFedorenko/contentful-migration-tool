# Contentful Migration Tool

A professional tool for creating backups and migrating content between Contentful environments.

## Features

- Browser-based Contentful authentication
- Space and environment selection
- Content backup creation
- Content migration between environments
- Backup history viewing
- Custom restore from backup files
- Selective content type migration
- Content analysis and comparison

## Quick Start

### For First-Time Users

**Fastest way (with Docker):**
```bash
git clone https://github.com/your-username/contentful-migration-tool.git
cd contentful-migration-tool
docker-compose up -d
# Open http://localhost:3000
```

**Local installation:**
```bash
git clone https://github.com/your-username/contentful-migration-tool.git
cd contentful-migration-tool
npm run setup
npm run dev
# Open http://localhost:3000
```

---

## Installation & Setup

Choose one of the installation methods below. **Docker is recommended** for easier setup and consistent environment.

### Option 1: Docker (Recommended)

#### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

#### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/contentful-migration-tool.git
   cd contentful-migration-tool
   ```

2. Create `.env` file (optional):
   ```bash
   # Contentful Management Token (optional)
   CONTENTFUL_MANAGEMENT_TOKEN=your_token_here
   ```

3. Start the application:
   ```bash
   docker-compose up -d
   ```

4. Open http://localhost:3000 in your browser

#### Using npm scripts

```bash
# Build Docker image
npm run docker:build

# Start containers
npm run docker:start

# Stop containers
npm run docker:stop

# Development mode with watch
npm run docker:dev
```

### Option 2: Local Installation (Without Docker)

#### Prerequisites
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **npm 7+** (comes with Node.js)
- **Git** - [Download Git](https://git-scm.com/)

#### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/contentful-migration-tool.git
   cd contentful-migration-tool
   ```

2. **Run the setup script** (automatically installs dependencies and configures the project):
   ```bash
   npm run setup
   ```
   
   This script will:
   - ✅ Install all project dependencies (`npm install`)
   - ✅ Check and install Contentful CLI globally (if not already installed)
   - ✅ Create the `backups/` directory for storing backups
   - ✅ Create a `.env` file template (if it doesn't exist)

3. **Configure environment variables** (optional):
   
   Edit the `.env` file and add your Contentful Management Token:
   ```bash
   # Contentful Management Token (optional)
   CONTENTFUL_MANAGEMENT_TOKEN=your_token_here
   ```
   
   > **Note:** You can also authenticate through the browser UI after starting the application.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   
   Navigate to: **http://localhost:3000**

#### Manual Setup (Alternative)

If you prefer to set up manually without the setup script:

```bash
# 1. Install dependencies
npm install

# 2. Install Contentful CLI globally
npm install -g contentful-cli

# 3. Create backups directory
mkdir -p backups

# 4. Create .env file (optional)
echo "# Contentful Management Token (optional)
# CONTENTFUL_MANAGEMENT_TOKEN=your_token_here" > .env

# 5. Start the application
npm run dev
```

## Application Management

### Stop Application

```bash
# Using npm script
npm run docker:stop

# Or directly
docker-compose down
```

### View Logs

```bash
docker-compose logs -f
```

## Configuration

To use Contentful Management API token, add it to `.env` file:

```
CONTENTFUL_MANAGEMENT_TOKEN=your_token_here
```

## Requirements

- Docker and Docker Compose (for Docker setup)
- Or Node.js 18+ and npm 7+ (for local installation)

## Usage

1. Authenticate with Contentful by clicking "Login to Contentful"
2. Select a space from the dropdown
3. Select source and target environments
4. Click "Backup Source" to create a backup
5. Click "Migrate Content" to migrate content between environments
6. Use "Custom Restore" to restore from a backup file
7. Use "Custom Migrate" to selectively migrate specific content types

## Backups

Backups are saved in `backups/{space_id}/` directory in JSON format.

## Features Details

### Full Content Backup
Backup all Contentful data including:
- Entries
- Content Types
- Assets
- Locales
- Webhooks

### Migration Between Environments
Migrate content from one environment (e.g., `master`) to another (e.g., `dev`).
- **Standard Migration**: Copies all content
- **Custom Migration**: Selectively migrate specific content types and entries

### Restore Content from Backup
Restore Contentful content from a previous backup file.

### Delete Backups
Remove old backups directly from the UI.

## Important: Backup Before Production Migration

Before migrating content to production, always create a full backup using this guide:
[Contentful CLI Backup Guide](https://rohitgupta.netlify.app/import-and-export-data-with-contentful-cli)

## Troubleshooting & Common Issues

| Error | Cause | Solution |
|----------------------|--------------------------------------------------|--------------------------------------------------|
| The content type could not be found | Content Type is missing in the target environment | Manually transfer Content Types first |
| Cannot delete locale | Locales cannot be removed via API | Manually disable or leave them |
| Asset already exists | Duplicate asset during import | Delete the existing asset and retry |
| Some entries failed to import | Content Type structure changed | Ensure the Content Type exists and is unchanged |

## For Developers

### Development Mode with Docker

```bash
# Start with automatic reload on changes
npm run docker:dev

# Or with image rebuild
npm run docker:dev:build
```

### Local Development without Docker

```bash
npm install
npm run dev
```

### Project Structure

- `src/pages/api/` - Next.js API routes
- `src/utils/` - Contentful utilities
- `src/components/` - React components
- `src/hooks/` - React hooks
- `src/context/` - Application context
- `backups/` - Backup storage directory

## License

MIT

## Contact

For issues or feature requests, open an issue in the repository or contact the maintainer.
