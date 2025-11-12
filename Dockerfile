# Dockerfile (Next.js) - Production
FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install project dependencies
COPY package*.json ./
RUN npm install

# Install Contentful CLI globally
RUN npm install -g contentful-cli

# Copy source code
COPY . .

# Create backups directory with proper permissions
RUN mkdir -p /app/backups && \
    chmod -R 777 /app/backups

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"] 