import React from 'react';
import { Box, Typography, Paper, Grid, Chip, Divider, Alert } from '@mui/material';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const OperationModes: React.FC = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Operation Modes Guide
            </Typography>

            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <AutoModeIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h5">
                        Smart Migration (Recommended)
                    </Typography>
                </Box>
                <Typography paragraph>
                    Smart Migration is the most powerful feature of this tool. It allows you to selectively migrate content
                    by comparing two environments and identifying differences.
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    How it works:
                </Typography>
                <Box component="ol" sx={{ pl: 2 }}>
                    <li>
                        <Typography paragraph>
                            <strong>Scan:</strong> The tool scans both Source and Target environments to build a content tree.
                        </Typography>
                    </li>
                    <li>
                        <Typography paragraph>
                            <strong>Compare:</strong> It compares entries by ID and content version to detect changes.
                        </Typography>
                    </li>
                    <li>
                        <Typography paragraph>
                            <strong>Visualize:</strong> Differences are shown with color-coded indicators:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Chip label="NEW (Green)" color="success" size="small" />
                            <Typography variant="body2" sx={{ alignSelf: 'center' }}>Entry exists in Source but not in Target.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Chip label="MODIFIED (Yellow)" color="warning" size="small" />
                            <Typography variant="body2" sx={{ alignSelf: 'center' }}>Entry exists in both but content differs.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Chip label="DELETED (Red)" color="error" size="small" />
                            <Typography variant="body2" sx={{ alignSelf: 'center' }}>Entry exists in Target but not in Source (optional).</Typography>
                        </Box>
                    </li>
                    <li>
                        <Typography paragraph>
                            <strong>Filter:</strong> Use filters to narrow down results:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                            <li><strong>Status Filter:</strong> Show only NEW, MODIFIED, or DELETED entries</li>
                            <li><strong>Content Type Filter:</strong> Filter by specific content types</li>
                            <li><strong>Locale Filter:</strong> Select which locales to migrate (e.g., only en-US)</li>
                        </Box>
                    </li>
                    <li>
                        <Typography paragraph>
                            <strong>Select & Migrate:</strong> You select exactly which items to migrate.
                        </Typography>
                    </li>
                    <li>
                        <Typography paragraph>
                            <strong>Auto-Dependencies:</strong> The tool automatically:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                            <li>Detects required content types for selected entries</li>
                            <li>Finds all dependent content types (recursively)</li>
                            <li>Creates missing content types in the target environment</li>
                            <li>Migrates only the selected locales' data</li>
                        </Box>
                    </li>
                </Box>

                <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        <strong>New Features:</strong>
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                        <li><strong>Locale Selection:</strong> Choose specific locales to migrate instead of all locales</li>
                        <li><strong>Smart Content Types:</strong> Automatically creates missing content types and their dependencies</li>
                    </Box>
                </Alert>
            </Paper>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <BackupIcon color="secondary" sx={{ fontSize: 28 }} />
                            <Typography variant="h6">
                                Create Backup
                            </Typography>
                        </Box>
                        <Typography paragraph>
                            Creates a full snapshot of an environment.
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                            What is saved:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2 }}>
                            <li>All Content Types</li>
                            <li>All Entries (Draft & Published)</li>
                            <li>All Assets</li>
                            <li>Locales & Webhooks</li>
                        </Box>
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Backups are stored locally in the <code>backups/</code> directory as JSON files.
                        </Alert>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <RestoreIcon color="error" sx={{ fontSize: 28 }} />
                            <Typography variant="h6">
                                Restore Mode
                            </Typography>
                        </Box>
                        <Typography paragraph>
                            Restores content from a local backup file to a target environment.
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                            Safety Features:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2 }}>
                            <li>Automatic pre-restore backup of target</li>
                            <li>Validation of content types</li>
                        </Box>
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            <strong>Warning:</strong> Restore can overwrite existing data. Always check the target environment first.
                        </Alert>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, mt: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <CompareArrowsIcon color="action" sx={{ fontSize: 28 }} />
                            <Typography variant="h6">
                                Standard Migration (Full Sync)
                            </Typography>
                        </Box>
                        <Typography paragraph>
                            Copies <strong>everything</strong> from Source to Target. Useful for initial setup or cloning environments.
                        </Typography>
                        <Typography paragraph>
                            This process uses the Contentful CLI export/import under the hood to ensure a complete transfer of all data structures.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default OperationModes;
