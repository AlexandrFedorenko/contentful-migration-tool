import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import CategoryIcon from '@mui/icons-material/Category';
import LanguageIcon from '@mui/icons-material/Language';

interface PreviewData {
    entriesCount: number;
    assetsCount: number;
    contentTypesCount: number;
    localesCount: number;
    selectiveBackupFile: string;
}

interface MigrationPreviewDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    previewData: PreviewData | null;
    loading: boolean;
}

export default function MigrationPreviewDialog({
    open,
    onClose,
    onConfirm,
    previewData,
    loading
}: MigrationPreviewDialogProps) {
    if (!previewData) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Confirm Migration</DialogTitle>
            <DialogContent>
                <Typography variant="body1" gutterBottom>
                    You are about to migrate the following content. This action will overwrite existing content in the target environment.
                </Typography>

                <Box sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                    <List dense>
                        <ListItem>
                            <ListItemIcon>
                                <CategoryIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary={`${previewData.contentTypesCount} Content Types`}
                                secondary="Models to be migrated"
                            />
                        </ListItem>
                        <Divider component="li" />
                        <ListItem>
                            <ListItemIcon>
                                <DescriptionIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary={`${previewData.entriesCount} Entries`}
                                secondary="Content entries to be migrated"
                            />
                        </ListItem>
                        <Divider component="li" />
                        <ListItem>
                            <ListItemIcon>
                                <ImageIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary={`${previewData.assetsCount} Assets`}
                                secondary="Media files to be migrated"
                            />
                        </ListItem>
                        <Divider component="li" />
                        <ListItem>
                            <ListItemIcon>
                                <LanguageIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary={`${previewData.localesCount} Locales`}
                                secondary="Languages included"
                            />
                        </ListItem>
                    </List>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Preview File: {previewData.selectiveBackupFile}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                >
                    {loading ? 'Migrating...' : 'Confirm & Migrate'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
