import React from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Link, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AppleIcon from '@mui/icons-material/Apple';
import ComputerIcon from '@mui/icons-material/Computer';
import TerminalIcon from '@mui/icons-material/Terminal';

const CLIInstallation: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Contentful CLI Installation & Usage
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Installation
        </Typography>
        <Typography paragraph>
          The easiest way to install Contentful CLI is using npm:
        </Typography>
        <Box
          component="pre"
          sx={{
            bgcolor: 'action.hover',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            border: 1,
            borderColor: 'divider'
          }}
        >
          npm install -g contentful-cli
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Note: Our setup script automatically installs Contentful CLI. Run <code>npm run setup</code> after cloning the repository.
        </Typography>
      </Paper>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ComputerIcon />
            <Typography variant="h6">Windows Installation</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" gutterBottom>
            Prerequisites:
          </Typography>
          <Typography component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Node.js 18+ installed (<Link href="https://nodejs.org/" target="_blank">Download Node.js</Link>)</li>
            <li>npm (comes with Node.js)</li>
            <li>PowerShell or Command Prompt</li>
          </Typography>

          <Typography variant="subtitle2" gutterBottom>
            Installation Steps:
          </Typography>
          <Box component="ol" sx={{ pl: 2, mb: 2 }}>
            <li>Open PowerShell or Command Prompt as Administrator</li>
            <li>Run: <code>npm install -g contentful-cli</code></li>
            <li>Verify installation: <code>contentful --version</code></li>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Common Commands:
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: 'action.hover',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.875rem'
            }}
          >
            {`# Login to Contentful
contentful login

# List spaces
contentful space list

# Export environment
contentful space export --space-id YOUR_SPACE_ID --environment-id master

# Import environment
contentful space import --space-id YOUR_SPACE_ID --environment-id target`}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AppleIcon />
            <Typography variant="h6">macOS Installation</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" gutterBottom>
            Prerequisites:
          </Typography>
          <Typography component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Node.js 18+ installed (<Link href="https://nodejs.org/" target="_blank">Download Node.js</Link>)</li>
            <li>npm (comes with Node.js)</li>
            <li>Terminal application</li>
          </Typography>

          <Typography variant="subtitle2" gutterBottom>
            Installation Steps:
          </Typography>
          <Box component="ol" sx={{ pl: 2, mb: 2 }}>
            <li>Open Terminal</li>
            <li>Run: <code>npm install -g contentful-cli</code></li>
            <li>If you get permission errors, use: <code>sudo npm install -g contentful-cli</code></li>
            <li>Verify installation: <code>contentful --version</code></li>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Common Commands:
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: 'action.hover',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.875rem'
            }}
          >
            {`# Login to Contentful
contentful login

# List spaces
contentful space list

# Export environment
contentful space export \\
  --space-id YOUR_SPACE_ID \\
  --environment-id master \\
  --content-file backup.json

# Import environment
contentful space import \\
  --space-id YOUR_SPACE_ID \\
  --environment-id target \\
  --content-file backup.json`}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TerminalIcon />
            <Typography variant="h6">Linux Installation</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" gutterBottom>
            Prerequisites:
          </Typography>
          <Typography component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Node.js 18+ installed</li>
            <li>npm (comes with Node.js)</li>
            <li>Terminal/Shell access</li>
          </Typography>

          <Typography variant="subtitle2" gutterBottom>
            Installation Steps:
          </Typography>
          <Box component="ol" sx={{ pl: 2, mb: 2 }}>
            <li>Open Terminal</li>
            <li>Run: <code>npm install -g contentful-cli</code></li>
            <li>If you get permission errors, use: <code>sudo npm install -g contentful-cli</code></li>
            <li>Verify installation: <code>contentful --version</code></li>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Common Commands:
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: 'action.hover',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.875rem'
            }}
          >
            {`# Login to Contentful
contentful login

# List spaces
contentful space list

# Export environment
contentful space export \\
  --space-id YOUR_SPACE_ID \\
  --environment-id master \\
  --content-file backup.json

# Import environment
contentful space import \\
  --space-id YOUR_SPACE_ID \\
  --environment-id target \\
  --content-file backup.json`}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 3 }} />

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manual Environment Migration (Backup Method)
        </Typography>
        <Typography paragraph>
          If you need to migrate an entire environment manually using CLI, follow these steps:
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Step 1: Export Source Environment
        </Typography>
        <Box
          component="pre"
          sx={{
            bgcolor: 'action.hover',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.875rem',
            mb: 2
          }}
        >
          {`contentful space export \\
  --space-id YOUR_SPACE_ID \\
  --environment-id source-env \\
  --content-file backup-source.json \\
  --include-drafts \\
  --include-archived`}
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Step 2: Import to Target Environment
        </Typography>
        <Box
          component="pre"
          sx={{
            bgcolor: 'action.hover',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.875rem',
            mb: 2
          }}
        >
          {`contentful space import \\
  --space-id YOUR_SPACE_ID \\
  --environment-id target-env \\
  --content-file backup-source.json`}
        </Box>

        <Typography variant="body2" color="warning.main" sx={{ mt: 2, p: 2, bgcolor: '#fff3cd', borderRadius: 1 }}>
          ⚠️ <strong>Warning:</strong> Importing will overwrite existing content in the target environment.
          Always create a backup of the target environment before importing.
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Useful Links
        </Typography>
        <Box component="ul" sx={{ pl: 2, listStyle: 'none' }}>
          <li>
            <Link href="https://www.contentful.com/developers/docs/tutorials/cli/installation/" target="_blank" rel="noopener noreferrer">
              Official CLI Installation Guide
            </Link>
          </li>
          <li>
            <Link href="https://github.com/contentful/contentful-cli" target="_blank" rel="noopener noreferrer">
              Contentful CLI GitHub Repository
            </Link>
          </li>
          <li>
            <Link href="https://www.contentful.com/developers/docs/tutorials/cli/import-and-export/" target="_blank" rel="noopener noreferrer">
              CLI Import and Export
            </Link>
          </li>
        </Box>
      </Paper>
    </Box>
  );
};

export default CLIInstallation;

