import React from 'react';
import { Box, Typography, Link, Paper, Grid } from '@mui/material';

const ContentfulOverview: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        What is Contentful?
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Headless CMS Platform
        </Typography>
        <Typography paragraph>
          Contentful is a <strong>headless Content Management System (CMS)</strong> that provides 
          a flexible API-first approach to content management. Unlike traditional CMS platforms, 
          Contentful separates content from presentation, allowing you to deliver content to any 
          platform or device.
        </Typography>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Key Concepts
            </Typography>
            <Typography component="ul" sx={{ pl: 2 }}>
              <li><strong>Spaces:</strong> Top-level containers for your content</li>
              <li><strong>Environments:</strong> Isolated versions of your content (master, dev, staging, etc.)</li>
              <li><strong>Content Types:</strong> Data models that define the structure of your content</li>
              <li><strong>Entries:</strong> Individual content items based on Content Types</li>
              <li><strong>Assets:</strong> Media files (images, videos, documents)</li>
              <li><strong>Locales:</strong> Language and regional variations of content</li>
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Official Resources
            </Typography>
            <Box component="ul" sx={{ pl: 2, listStyle: 'none' }}>
              <li>
                <Link href="https://www.contentful.com/" target="_blank" rel="noopener noreferrer">
                  Contentful Website
                </Link>
              </li>
              <li>
                <Link href="https://www.contentful.com/developers/docs/" target="_blank" rel="noopener noreferrer">
                  Developer Documentation
                </Link>
              </li>
              <li>
                <Link href="https://www.contentful.com/developers/docs/references/content-management-api/" target="_blank" rel="noopener noreferrer">
                  Management API Reference
                </Link>
              </li>
              <li>
                <Link href="https://www.contentful.com/developers/docs/tutorials/cli/" target="_blank" rel="noopener noreferrer">
                  CLI Documentation
                </Link>
              </li>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          About This Application
        </Typography>
        <Typography paragraph>
          The <strong>Contentful Migration Tool</strong> is a web-based application designed to simplify 
          content management operations in Contentful. It provides an intuitive interface for:
        </Typography>
        <Typography component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>Creating backups of your Contentful environments</li>
          <li>Migrating content between environments</li>
          <li>Selectively migrating specific content types and entries</li>
          <li>Restoring content from backup files</li>
          <li>Analyzing differences between environments</li>
        </Typography>
        <Typography>
          This tool eliminates the need for complex command-line operations and provides a visual 
          interface for managing your Contentful content safely and efficiently.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ContentfulOverview;

