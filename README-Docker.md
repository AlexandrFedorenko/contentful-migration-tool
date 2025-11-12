# Contentful Migration Tool - Docker Guide

## Quick Start

### Development Mode with Watch:
```bash
npm run docker:dev:watch
```

### Standard Development:
```bash
npm run docker:dev
```

### Production:
```bash
npm run docker:start
```

### Stop:
```bash
npm run docker:stop
```

## Available Commands

```bash
# Development with watch mode (recommended)
npm run docker:dev:watch

# Standard development
npm run docker:dev

# Build and start in development mode
npm run docker:dev:build

# Production start
npm run docker:start

# Stop containers
npm run docker:stop

# View logs
npm run docker:logs

# Clean containers and volumes
npm run docker:clean

# Restart containers
npm run docker:restart

# Build production image
npm run docker:build
```

## What Was Fixed

1. **Removed reference to non-existent pythonserver** in `next.config.mjs`
2. **Created separate Dockerfile.dev** for development mode
3. **Configured watch mode** with support for `WATCHPACK_POLLING` and `CHOKIDAR_USEPOLLING`
4. **Added volume mounts** for hot reload
5. **Removed all shell scripts** - now using only npm commands
6. **Added additional commands** for Docker management

## File Structure

- `Dockerfile` - for production build
- `Dockerfile.dev` - for development with watch mode
- `docker-compose.yml` - production configuration
- `docker-compose.dev.yml` - development configuration with watch
- `package.json` - all commands for Docker management

## Application Access

The application will be available at:
http://localhost:3000

## Watch Mode Features

- Automatic reload on file changes
- TypeScript support
- Hot reload for React components
- Mounting of all necessary directories
- Optimized build for development

## Recommended Workflow

1. Run: `npm run docker:dev:watch`
2. Open http://localhost:3000
3. Edit files in `src/` - changes will be automatically reflected
4. To stop, press `Ctrl+C` in the terminal
