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
              <Typography>Click "Login to Contentful" and authenticate using your Contentful account.</Typography>
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
              <Typography>Choose the source environment (e.g., "master", "dev") from the "Source Environment" dropdown.</Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Create Backup</StepLabel>
            <StepContent>
              <Typography>
                Click "Backup Source" button. The backup will be created and saved in the <code>backups/{'{space_id}'}/</code> directory.
                You'll see a success message when the backup is complete.
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
          <li>Scroll to the "Backups" section</li>
          <li>Find the backup you want to delete in the list</li>
          <li>Click the "Delete" button next to the backup</li>
          <li>Confirm the deletion when prompted</li>
        </Box>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Deleted backups cannot be recovered. Make sure you don't need the backup before deleting it.
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
              <Typography>Select a backup from the list in the "Backups" section.</Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Restore</StepLabel>
            <StepContent>
              <Typography>
                Click "Restore" button. The application will restore all content from the backup file to the selected environment.
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
                Click "Migrate Content" button. All content types, entries, and assets will be copied from source to target.
              </Typography>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsIcon />
          Custom Migration (Selective)
        </Typography>
        <Typography paragraph>
          Custom migration allows you to selectively migrate specific content types and entries:
        </Typography>
        <Stepper orientation="vertical">
          <Step active>
            <StepLabel>Enable Custom Migrate Mode</StepLabel>
            <StepContent>
              <Typography>Toggle "Custom Migrate" switch to enable selective migration.</Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Analyze Differences</StepLabel>
            <StepContent>
              <Typography>
                Click "Analyze" button to compare source and target environments. The analysis will show:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li>New content types in source</li>
                <li>Modified content types</li>
                <li>New entries</li>
                <li>Modified entries</li>
              </Box>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Select Content to Migrate</StepLabel>
            <StepContent>
              <Typography>
                Expand content types in the accordion view and select:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li>Entire content types (check the content type checkbox)</li>
                <li>Individual entries (check specific entry checkboxes)</li>
              </Box>
              <Typography sx={{ mt: 1 }}>
                Selecting an entry automatically selects its parent content type.
              </Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Migrate Selected</StepLabel>
            <StepContent>
              <Typography>
                Click "Migrate Selected" to migrate only the selected content types and entries.
              </Typography>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Custom Restore from File
        </Typography>
        <Typography paragraph>
          You can restore from a backup file that you have locally:
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <li>Toggle "Custom Restore" switch</li>
          <li>Click "Choose File" and select your backup JSON file</li>
          <li>Select the target environment</li>
          <li>Click "Restore" button</li>
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

