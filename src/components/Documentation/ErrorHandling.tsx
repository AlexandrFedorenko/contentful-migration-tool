import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

const ErrorHandling: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Common Errors & Solutions
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Most errors in this application are automatically parsed and displayed with detailed instructions. 
        If you encounter an error, check the error modal for step-by-step solutions.
      </Alert>

      <TableContainer component={Paper} elevation={2} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Error</strong></TableCell>
              <TableCell><strong>Cause</strong></TableCell>
              <TableCell><strong>Solution</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorOutlineIcon color="error" />
                  Field cannot be deleted
                </Box>
              </TableCell>
              <TableCell>Contentful requires making a field optional before deleting it</TableCell>
              <TableCell>
                <Box component="ol" sx={{ pl: 2, m: 0, fontSize: '0.875rem' }}>
                  <li>Go to Contentful App → Content Model</li>
                  <li>Find the content type with the problematic field</li>
                  <li>Set the field as "optional" first</li>
                  <li>Save the content type</li>
                  <li>Then delete the field completely</li>
                  <li>Retry the operation</li>
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  Content type not found
                </Box>
              </TableCell>
              <TableCell>Content type exists in source but not in target environment</TableCell>
              <TableCell>
                <Box component="ol" sx={{ pl: 2, m: 0, fontSize: '0.875rem' }}>
                  <li>Manually create the content type in the target environment</li>
                  <li>Or use Custom Migration to migrate the content type first</li>
                  <li>Ensure the content type structure matches between environments</li>
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  Duplicate content detected
                </Box>
              </TableCell>
              <TableCell>Content already exists in target environment</TableCell>
              <TableCell>
                <Box component="ol" sx={{ pl: 2, m: 0, fontSize: '0.875rem' }}>
                  <li>Go to Contentful App → Content</li>
                  <li>Find and delete the duplicate item</li>
                  <li>Remove any references to the duplicate</li>
                  <li>Retry the migration</li>
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="info" />
                  Rate limit exceeded
                </Box>
              </TableCell>
              <TableCell>Too many API requests to Contentful</TableCell>
              <TableCell>
                <Box component="ol" sx={{ pl: 2, m: 0, fontSize: '0.875rem' }}>
                  <li>Wait a few minutes - the system will automatically retry</li>
                  <li>For large backups, the process may take longer</li>
                  <li>This is not a critical error - operation will continue</li>
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorOutlineIcon color="error" />
                  Locale configuration issue
                </Box>
              </TableCell>
              <TableCell>Missing or mismatched locales between environments</TableCell>
              <TableCell>
                <Box component="ol" sx={{ pl: 2, m: 0, fontSize: '0.875rem' }}>
                  <li>Go to Contentful App → Settings → Locales</li>
                  <li>Ensure required locales exist in target environment</li>
                  <li>Match default locale between environments</li>
                  <li>Add missing locales if needed</li>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Content Model Differences</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" gutterBottom>
            Problem:
          </Typography>
          <Typography paragraph>
            When restoring or migrating, if the content model (Content Type structure) differs between 
            source and target environments, the operation may fail.
          </Typography>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Solution:
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <li>
              <strong>Option 1: Update Content Type in Target</strong>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li>Go to Contentful App → Content Model</li>
                <li>Find the content type in the target environment</li>
                <li>Update its structure to match the source environment</li>
                <li>Save and publish the content type</li>
                <li>Retry the restore/migration</li>
              </Box>
            </li>
            <li>
              <strong>Option 2: Delete and Recreate</strong>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li>Delete all entries using the content type in target environment</li>
                <li>Delete the content type itself</li>
                <li>Run the restore/migration again (content type will be created from backup)</li>
              </Box>
            </li>
            <li>
              <strong>Option 3: Use Custom Migration</strong>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li>Use "Custom Migrate" to migrate the content type first</li>
                <li>Then migrate the entries</li>
              </Box>
            </li>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Authentication Issues</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" gutterBottom>
            Problem:
          </Typography>
          <Typography paragraph>
            Cannot authenticate or "Token not found" errors.
          </Typography>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Solution:
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <li>Click "Login to Contentful" and complete the OAuth flow</li>
            <li>If using Management Token, ensure it's set in <code>.env</code> file</li>
            <li>Check that the token has proper permissions (Content Management API access)</li>
            <li>Try "FORCE RESET" button to clear authentication cache</li>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Backup File Issues</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" gutterBottom>
            Problem:
          </Typography>
          <Typography paragraph>
            Backup file is corrupted, missing, or restore fails.
          </Typography>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Solution:
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <li>Verify the backup file exists in <code>backups/{'{space_id}'}/</code> directory</li>
            <li>Check file size - corrupted files are usually very small or empty</li>
            <li>Try creating a new backup and restore from that</li>
            <li>Ensure the backup file is valid JSON format</li>
            <li>Check file permissions - ensure the application can read the file</li>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Getting Help
        </Typography>
        <Typography paragraph>
          If you encounter an error not listed here:
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li>Check the error modal for detailed instructions</li>
          <li>Review the error message in the status bar</li>
          <li>Check Contentful documentation for API-specific errors</li>
          <li>Verify your Contentful account has proper permissions</li>
          <li>Ensure you have sufficient API rate limits</li>
        </Box>
      </Paper>
    </Box>
  );
};

export default ErrorHandling;

