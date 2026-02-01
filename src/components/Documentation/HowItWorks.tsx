import React from 'react';
import { Box, Typography, Paper, Stepper, Step, StepLabel, StepContent, Divider, Alert } from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteIcon from '@mui/icons-material/Delete';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const HowItWorks: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        How to Use This Application
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Getting Started
        </Typography>
        <Typography paragraph>
          This application provides a user-friendly interface for managing Contentful content.
          All operations are performed through the web UI, eliminating the need for command-line tools.
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BackupIcon />
          Creating a Backup
        </Typography>
        <Stepper orientation="vertical">
          <Step active>
            <StepLabel>Authenticate</StepLabel>
            <StepContent>
              <Typography>Click &quot;Login to Contentful&quot; and authenticate using your Contentful account.</Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Select Space</StepLabel>
            <StepContent>
              <Typography>Choose the Contentful space you want to work with from the dropdown.</Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Select Environment</StepLabel>
            <StepContent>
              <Typography>Choose the source environment (e.g., &quot;master&quot;, &quot;dev&quot;) from the &quot;Source Environment&quot; dropdown.</Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Create Backup</StepLabel>
            <StepContent>
              <Typography>
                Click &quot;Backup Source&quot; button. The backup will be created and saved in the <code>backups/{'{space_id}'}/</code> directory.
                You&apos;ll see a success message when the backup is complete.
              </Typography>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon />
          Deleting a Backup
        </Typography>
        <Typography paragraph>
          To delete a backup:
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <li>Scroll to the &quot;Backups&quot; section</li>
          <li>Find the backup you want to delete in the list</li>
          <li>Click the &quot;Delete&quot; button next to the backup</li>
          <li>Confirm the deletion when prompted</li>
        </Box>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Deleted backups cannot be recovered. Make sure you don&apos;t need the backup before deleting it.
        </Alert>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestoreIcon />
          Restoring from Backup
        </Typography>
        <Stepper orientation="vertical">
          <Step active>
            <StepLabel>Select Target Environment</StepLabel>
            <StepContent>
              <Typography>Choose the target environment where you want to restore the backup.</Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Choose Backup</StepLabel>
            <StepContent>
              <Typography>Select a backup from the list in the &quot;Backups&quot; section.</Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Restore</StepLabel>
            <StepContent>
              <Typography>
                Click &quot;Restore&quot; button. The application will restore all content from the backup file to the selected environment.
              </Typography>
            </StepContent>
          </Step>
        </Stepper>
        <Alert severity="info" sx={{ mt: 2 }}>
          The restore process will overwrite existing content in the target environment. A backup of the target environment
          is automatically created before restoration.
        </Alert>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareArrowsIcon />
          Standard Migration
        </Typography>
        <Typography paragraph>
          Standard migration copies all content from one environment to another:
        </Typography>
        <Stepper orientation="vertical">
          <Step active>
            <StepLabel>Select Environments</StepLabel>
            <StepContent>
              <Typography>
                Choose the source environment (where content comes from) and target environment (where content goes to).
              </Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Create Backups</StepLabel>
            <StepContent>
              <Typography>
                The application automatically creates backups of both source and target environments before migration.
              </Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Migrate</StepLabel>
            <StepContent>
              <Typography>
                Click &quot;Migrate Content&quot; button. All content types, entries, and assets will be copied from source to target.
              </Typography>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsIcon />
          Smart Migration (Selective)
        </Typography>
        <Typography paragraph>
          Smart migration allows you to selectively migrate specific content types and entries:
        </Typography>
        <Stepper orientation="vertical">
          <Step active>
            <StepLabel>Select Environments</StepLabel>
            <StepContent>
              <Typography>Choose source and target environments from the dropdowns.</Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Scan Differences</StepLabel>
            <StepContent>
              <Typography>
                Click &quot;SCAN DIFFERENCES&quot; button to compare environments. The scan will show:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li><strong>NEW:</strong> Entries that exist in source but not in target</li>
                <li><strong>MODIFIED:</strong> Entries that exist in both but have different content</li>
                <li><strong>DELETED:</strong> Entries that exist in target but not in source</li>
              </Box>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Filter Results</StepLabel>
            <StepContent>
              <Typography>Use filters to narrow down what you want to migrate:</Typography>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li><strong>Search:</strong> Filter by entry title or ID</li>
                <li><strong>Status Filter:</strong> Show only NEW, MODIFIED, or DELETED entries</li>
                <li><strong>Content Type Filter:</strong> Select specific content types</li>
                <li><strong>Locales to Migrate:</strong> Choose which locales to migrate (e.g., only en-US, de-DE)</li>
              </Box>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Select Entries</StepLabel>
            <StepContent>
              <Typography>
                Check the boxes next to entries you want to migrate. Click on an entry to preview the differences
                between source and target versions.
              </Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Migrate Selected</StepLabel>
            <StepContent>
              <Typography>
                Click &quot;MIGRATE SELECTED&quot; button. The tool will automatically:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li>Detect all required content types for selected entries</li>
                <li>Find dependent content types recursively</li>
                <li>Create missing content types in target environment</li>
                <li>Migrate only the selected locales&apos; data</li>
                <li>Create or update entries in the target environment</li>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            <strong>Smart Features:</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
            <li>Automatically creates missing content types and dependencies</li>
            <li>Migrates only selected locales to save time and reduce data transfer</li>
            <li>Shows field-level differences for easy comparison</li>
          </Box>
        </Alert>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Custom Restore from File
        </Typography>
        <Typography paragraph>
          You can restore from a backup file that you have locally:
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <li>Toggle &quot;Custom Restore&quot; switch</li>
          <li>Click &quot;Choose File&quot; and select your backup JSON file</li>
          <li>Select the target environment</li>
          <li>Click &quot;Restore&quot; button</li>
        </Box>
        <Alert severity="warning" sx={{ mt: 2 }}>
          This operation will replace the entire target environment with content from the backup file.
          A backup of the target environment is created automatically before restoration.
        </Alert>
      </Paper>
    </Box>
  );
};

export default HowItWorks;

