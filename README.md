# Contentful Migration Tool

A professional web application for managing Contentful content across environments. Built with **Next.js 14**, **TypeScript**, **Prisma**, and **Clerk** authentication.

## Features

### Core Capabilities
- **🔐 Secure Authentication**: OAuth-based Contentful authentication via Clerk
- **📦 Smart Backups**: Create full content backups (entries, assets, content types) stored in PostgreSQL
- **🔄 Environment Migration**: Migrate content between environments with conflict resolution
- **🎯 Selective Restore**: Restore specific content types or locales from backups
- **📊 Visual Comparison**: Analyze differences between environments before migrating

### Advanced Features
- **⚡ Live Transfer**: Direct CMA-based content transfer between spaces (no file download)
- **🗺️ Locale Mapping**: Auto-suggest and manual mapping between different locale codes (e.g., "en" → "en-US")
- **📈 Activity Logging**: Track all backup, restore, and migration operations
- **🎨 Modern UI**: Built with shadcn/ui, Tailwind CSS, and dark/light theme support
- **🐳 Docker Support**: Ready for containerized deployment

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Clerk (with Contentful OAuth integration)
- **Styling**: Tailwind CSS + shadcn/ui
- **API**: Contentful Management API (CMA)

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Contentful account with Management API access

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/contentful-migration-tool.git
   cd contentful-migration-tool
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/contentful_tool"
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   
   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Setup database:**
   ```bash
   npx prisma migrate dev
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/        # React UI components
├── context/          # React contexts (Auth, Theme, Global state)
├── hooks/            # Custom React hooks
├── lib/              # Core utilities (db, encryption)
├── pages/            # Next.js pages & API routes
│   └── api/          # API endpoints
├── types/            # TypeScript type definitions
└── utils/            # Helper functions
    ├── backup-service.ts
    ├── contentful-management.ts
    ├── contentful-cli.ts
    └── locale-filter.ts
```

## Key Features Explained

### Smart Restore with Locale Filtering
When restoring content, the tool intelligently handles locale mismatches:
- Filters content to only selected locales
- Maps locale codes between source and target (e.g., "en" → "en-US")
- Preserves content structure without creating duplicate entries

### Live Transfer
Transfer content directly between spaces or environments without intermediate files:
- Recursive dependency resolution (auto-includes linked entries/assets)
- Rate-limited CMA operations to avoid API limits
- Cross-space migration support

### Backup Management
- Cloud backups stored in PostgreSQL (not local files)
- Optional asset archiving with ZIP download
- Backup limits and auto-cleanup policies

## API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/backup` | Create new backup |
| `/api/restore` | Restore from backup |
| `/api/selective-restore` | Restore selected content types/locales |
| `/api/smart-restore/live-transfer` | Direct CMA transfer |
| `/api/smart-migrate/cma-diff` | Compare environments |
| `/api/user/logs` | Activity logging |

## Development

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
npx prisma migrate dev
npx prisma generate
```

### Docker Deployment
```bash
docker-compose up -d
```

## License

MIT
