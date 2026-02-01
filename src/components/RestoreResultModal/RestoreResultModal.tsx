import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface RestoreResultModalProps {
    open: boolean;
    onClose: () => void;
    success: boolean;
    backupName?: string;
    targetEnvironment?: string;
    errorMessage?: string;
}

export default function RestoreResultModal({
    open,
    onClose,
    success,
    backupName,
    targetEnvironment,
    errorMessage
}: RestoreResultModalProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {success ? (
                        <>
                            <CheckCircleIcon color="success" />
                            <Typography variant="h6" component="span">
                                Restore Successful
                            </Typography>
                        </>
                    ) : (
                        <>
                            <ErrorIcon color="error" />
                            <Typography variant="h6" component="span">
                                Restore Failed
                            </Typography>
                        </>
                    )}
                </Box>
            </DialogTitle>

            <DialogContent>
                {success ? (
                    <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            The backup has been successfully restored!
                        </Alert>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Backup:</strong> {backupName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Target Environment:</strong> {targetEnvironment}
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Failed to restore the backup
                        </Alert>
                        {backupName && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Backup:</strong> {backupName}
                            </Typography>
                        )}
                        {targetEnvironment && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Target Environment:</strong> {targetEnvironment}
                            </Typography>
                        )}
                        {errorMessage && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                                <Typography variant="body2" color="error.contrastText">
                                    <strong>Error:</strong> {errorMessage}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
