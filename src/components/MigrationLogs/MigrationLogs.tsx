import React, { useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Paper
} from '@mui/material';
import { useGlobalContext } from '@/context/GlobalContext';

export default function MigrationLogs() {
    const { state, dispatch } = useGlobalContext();
    const logsEndRef = useRef<HTMLDivElement>(null);

    const isOpen = state.loading.loadingMigration || (state.logs.length > 0 && !state.loading.loadingMigration);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [state.logs]);

    const handleClose = () => {
        if (!state.loading.loadingMigration) {
            dispatch({ type: "CLEAR_LOGS" });
        }
    };

    if (!isOpen && state.logs.length === 0) return null;

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            disableEscapeKeyDown={state.loading.loadingMigration}
        >
            <DialogTitle>
                Migration Progress
                {state.loading.loadingMigration && (
                    <Typography variant="caption" display="block" color="text.secondary">
                        Please do not close this window until migration is complete.
                    </Typography>
                )}
            </DialogTitle>
            <DialogContent dividers>
                {state.loading.loadingMigration && (
                    <Box sx={{ mb: 2 }}>
                        <LinearProgress />
                    </Box>
                )}

                <Paper
                    variant="outlined"
                    sx={{
                        height: 400,
                        overflow: 'auto',
                        bgcolor: '#1e1e1e',
                        color: '#fff',
                        p: 2,
                        fontFamily: 'monospace'
                    }}
                >
                    <List dense>
                        {state.logs.map((log, index) => (
                            <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                <ListItemText
                                    primary={log}
                                    primaryTypographyProps={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        color: log.toLowerCase().includes('error') ? '#ff5252' :
                                            log.toLowerCase().includes('success') ? '#69f0ae' :
                                                log.toLowerCase().includes('warning') ? '#ffd740' : '#fff'
                                    }}
                                />
                            </ListItem>
                        ))}
                        <div ref={logsEndRef} />
                    </List>
                </Paper>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleClose}
                    disabled={state.loading.loadingMigration}
                    color="primary"
                    variant="contained"
                >
                    {state.loading.loadingMigration ? 'Migrating...' : 'Close'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
