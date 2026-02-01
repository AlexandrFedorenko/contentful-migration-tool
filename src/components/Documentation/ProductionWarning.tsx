import React from 'react';
import { Box, Typography, Paper, Alert, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import BackupIcon from '@mui/icons-material/Backup';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

const ProductionWarning: React.FC = () => {
  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Beta Testing Notice
        </Typography>
        <Typography>
          This application is currently in <strong>beta testing</strong>. While we strive for reliability,
          please exercise caution when performing operations, especially on production environments.
        </Typography>
      </Alert>

      <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'warning.main', color: 'warning.contrastText' }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon />
          Critical: Backup Before Production Operations
        </Typography>
        <Typography paragraph sx={{ mt: 2 }}>
          Before performing <strong>any</strong> migration, restore, or content modification operations on
          production environments, you <strong>must</strong> create a backup.
        </Typography>
        <Typography paragraph>
          Production data is critical and cannot be easily recovered. Always verify that backups exist
          and are accessible before proceeding with any operations.
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BackupIcon />
          Pre-Production Checklist
        </Typography>
        <Stepper orientation="vertical">
          <Step active>
            <StepLabel>Verify Backup Directory</StepLabel>
            <StepContent>
              <Typography>
                Check that the <code>backups/{'{space_id}'}/</code> directory exists and contains recent backup files.
              </Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Create Fresh Backup</StepLabel>
            <StepContent>
              <Typography>
                Create a new backup of the production environment before making any changes.
                This ensures you have a recent recovery point.
              </Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Verify Backup File</StepLabel>
            <StepContent>
              <Typography>
                Confirm the backup file was created successfully:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li>Check file size (should not be empty or very small)</li>
                <li>Verify file timestamp is recent</li>
                <li>Ensure file is in JSON format</li>
              </Box>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Test in Non-Production First</StepLabel>
            <StepContent>
              <Typography>
                If possible, test your migration/restore operations in a development or staging
                environment first to identify any potential issues.
              </Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Document Your Actions</StepLabel>
            <StepContent>
              <Typography>
                Keep a record of:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li>Which environments you&apos;re working with</li>
                <li>What operations you&apos;re performing</li>
                <li>Backup file names and locations</li>
                <li>Any errors encountered</li>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedUserIcon />
          Best Practices
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li>
            <strong>Always backup before restore:</strong> Even when restoring from a backup,
            create a backup of the current state first
          </li>
          <li>
            <strong>Use staging environments:</strong> Test migrations in non-production environments first
          </li>
          <li>
            <strong>Verify backups regularly:</strong> Periodically check that your backup files are valid and accessible
          </li>
          <li>
            <strong>Keep multiple backups:</strong> Don&apos;t rely on a single backup - keep multiple versions
          </li>
          <li>
            <strong>Monitor operations:</strong> Watch the status messages and error logs during operations
          </li>
          <li>
            <strong>Have a rollback plan:</strong> Know how to restore from backup if something goes wrong
          </li>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          What to Do If Something Goes Wrong
        </Typography>
        <Typography paragraph>
          If an operation fails or produces unexpected results:
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <li>
            <strong>Stop immediately:</strong> Don&apos;t continue with additional operations
          </li>
          <li>
            <strong>Check the error message:</strong> Review the error modal for detailed instructions
          </li>
          <li>
            <strong>Verify backup exists:</strong> Ensure you have a recent backup to restore from
          </li>
          <li>
            <strong>Restore from backup:</strong> If needed, restore the environment from the most recent backup
          </li>
          <li>
            <strong>Review logs:</strong> Check the application logs and Contentful import logs for details
          </li>
          <li>
            <strong>Contact support:</strong> If the issue persists, contact the maintainer or open an issue
          </li>
        </Box>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Remember:</strong> It&apos;s always better to be cautious and create multiple backups
          than to risk losing production data. When in doubt, create a backup first.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ProductionWarning;

