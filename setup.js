#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Console colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}=== Contentful Migration Tool Setup ===${colors.reset}\n`);

try {
  // Step 1: Install project dependencies
  console.log(`${colors.yellow}Installing project dependencies...${colors.reset}`);
  execSync('npm install', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Dependencies installed successfully${colors.reset}\n`);

  // Step 2: Check for Contentful CLI
  console.log(`${colors.yellow}Checking for Contentful CLI...${colors.reset}`);
  try {
    execSync('contentful --version', { stdio: 'pipe' });
    console.log(`${colors.green}✓ Contentful CLI is already installed${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.yellow}Installing Contentful CLI globally...${colors.reset}`);
    execSync('npm install -g contentful-cli', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Contentful CLI installed successfully${colors.reset}\n`);
  }

  // Step 3: Create backups directory
  console.log(`${colors.yellow}Creating backups directory...${colors.reset}`);
  const backupsDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log(`${colors.green}✓ Backups directory created${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✓ Backups directory already exists${colors.reset}\n`);
  }

  // Step 4: Create .env file if it doesn't exist
  console.log(`${colors.yellow}Checking for .env file...${colors.reset}`);
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    const envContent = `# Contentful Management Token (optional)
# CONTENTFUL_MANAGEMENT_TOKEN=your_token_here
`;
    fs.writeFileSync(envPath, envContent);
    console.log(`${colors.green}✓ Created .env file template${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✓ .env file already exists${colors.reset}\n`);
  }

  console.log(`${colors.blue}=== Setup Complete ===${colors.reset}\n`);
  console.log(`${colors.green}You can now start the application with:${colors.reset}`);
  console.log(`${colors.yellow}npm run dev${colors.reset}\n`);
  console.log(`${colors.blue}Visit http://localhost:3000 in your browser${colors.reset}\n`);

} catch (error) {
  console.error(`${colors.red}Error during setup:${colors.reset}`, error);
  process.exit(1);
} 