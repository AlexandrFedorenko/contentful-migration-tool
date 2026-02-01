import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Paper,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useGlobalContext } from '@/context/GlobalContext';
import { useSpaces } from '@/hooks/useSpaces';
import { useEnvironments } from '@/hooks/useEnvironments';

interface ViewItem {
    id: string;
    title: string;
    displayedFieldIds?: string[];
}

interface ViewFolder {
    id: string;
    title: string;
    views: ViewItem[];
}

export default function ViewsMigration() {
    const { state, dispatch } = useGlobalContext();
    const { spaces } = useSpaces();
    const { loadEnvironments } = useEnvironments();

    const [sourceEnv, setSourceEnv] = useState('');
    const [targetEnv, setTargetEnv] = useState('');
    const [sourceFolders, setSourceFolders] = useState<ViewFolder[]>([]);
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [migrating, setMigrating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load environments when spaceId changes or on mount
    useEffect(() => {
        if (state.spaceId) {
            loadEnvironments(state.spaceId);
        }
    }, [state.spaceId, loadEnvironments]);

    const handleSpaceChange = (spaceId: string) => {
        dispatch({ type: "SET_SPACE_ID", payload: spaceId });
        loadEnvironments(spaceId);
        setSourceEnv('');
        setTargetEnv('');
        setSourceFolders([]);
        setSelectedFolders(new Set());
    };

    const handleScanViews = async () => {
        if (!state.spaceId || !sourceEnv) {
            setError('Please select space and source environment');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/get-views', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spaceId: state.spaceId,
                    environmentId: sourceEnv
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch views');
            }

            // Data should be in data.entryListViews
            setSourceFolders(data.entryListViews || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFolder = (folderId: string) => {
        const newSelected = new Set(selectedFolders);
        if (newSelected.has(folderId)) {
            newSelected.delete(folderId);
        } else {
            newSelected.add(folderId);
        }
        setSelectedFolders(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedFolders.size === sourceFolders.length) {
            setSelectedFolders(new Set());
        } else {
            setSelectedFolders(new Set(sourceFolders.map(f => f.id)));
        }
    };

    const handleMigrate = async () => {
        if (!state.spaceId || !sourceEnv || !targetEnv) {
            setError('Please select space, source and target environments');
            return;
        }

        if (selectedFolders.size === 0) {
            setError('Please select at least one folder to migrate');
            return;
        }

        if (sourceEnv === targetEnv) {
            setError('Source and target environments must be different');
            return;
        }

        setMigrating(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/migrate-views', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spaceId: state.spaceId,
                    sourceEnv,
                    targetEnv,
                    selectedViews: Array.from(selectedFolders) // sending folder IDs
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to migrate views');
            }

            setSuccess(`Successfully migrated ${data.migratedCount} view folders!`);
            setSelectedFolders(new Set());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setMigrating(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
            <Typography variant="h3" gutterBottom>
                Views Migration
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
                Migrate organizational folders and views between environments
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    <strong>How it works:</strong>
                </Typography>
                <Typography variant="body2">
                    Select folders (e.g. &quot;Status&quot;, &quot;Content Type&quot;) to migrate. The tool will:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                    <li>Create the folder if it doesn&apos;t exist in target</li>
                    <li>Copy all views inside the folder</li>
                    <li>If referenced Content Types are missing in target, the view will still be created (but may be empty)</li>
                </Box>
            </Alert>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Select Environments
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>Space</InputLabel>
                        <Select
                            value={state.spaceId || ''}
                            label="Space"
                            onChange={(e) => handleSpaceChange(e.target.value)}
                        >
                            {spaces.map((space) => (
                                <MenuItem key={space.id} value={space.id}>
                                    {space.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>Source Environment</InputLabel>
                        <Select
                            value={sourceEnv}
                            label="Source Environment"
                            onChange={(e) => setSourceEnv(e.target.value)}
                            disabled={!state.spaceId}
                        >
                            {state.donorEnvironments.map((env) => (
                                <MenuItem
                                    key={env.id}
                                    value={env.id}
                                    disabled={env.id === targetEnv}
                                >
                                    {env.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Target Environment</InputLabel>
                        <Select
                            value={targetEnv}
                            label="Target Environment"
                            onChange={(e) => setTargetEnv(e.target.value)}
                            disabled={!state.spaceId}
                        >
                            {state.donorEnvironments.map((env) => (
                                <MenuItem
                                    key={env.id}
                                    value={env.id}
                                    disabled={env.id === sourceEnv}
                                >
                                    {env.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Button
                    variant="contained"
                    onClick={handleScanViews}
                    disabled={!state.spaceId || !sourceEnv || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SyncIcon />}
                    fullWidth
                >
                    {loading ? 'Scanning Folders...' : 'Scan Source Folders'}
                </Button>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {sourceFolders.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Source Folders ({sourceFolders.length})
                        </Typography>
                        <Button
                            size="small"
                            onClick={handleSelectAll}
                        >
                            {selectedFolders.size === sourceFolders.length ? 'Deselect All' : 'Select All'}
                        </Button>
                    </Box>

                    {sourceFolders.map((folder) => (
                        <Accordion key={folder.id} variant="outlined" sx={{ mb: 1 }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    bgcolor: 'action.hover',
                                    '& .MuiFormControlLabel-root': { mr: 0 }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedFolders.has(folder.id)}
                                        onChange={() => handleToggleFolder(folder.id)}
                                        edge="start"
                                    />
                                    <FolderIcon color="primary" sx={{ mr: 2, ml: 1 }} />
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {folder.title || folder.id}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {folder.views?.length || 0} views inside
                                        </Typography>
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List dense>
                                    {folder.views?.map((view) => (
                                        <ListItem key={view.id}>
                                            <ListItemIcon>
                                                <ViewListIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={view.title || view.id}
                                                secondary={
                                                    view.displayedFieldIds && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Fields: {view.displayedFieldIds.slice(0, 3).join(', ')}
                                                            {view.displayedFieldIds.length > 3 && '...'}
                                                        </Typography>
                                                    )
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                    {(!folder.views || folder.views.length === 0) && (
                                        <ListItem>
                                            <ListItemText primary="Empty folder" sx={{ fontStyle: 'italic', color: 'text.secondary' }} />
                                        </ListItem>
                                    )}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    ))}

                    <Box sx={{ mt: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleMigrate}
                            disabled={selectedFolders.size === 0 || !targetEnv || migrating}
                            startIcon={migrating ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                            fullWidth
                            size="large"
                        >
                            {migrating ? 'Migrating...' : `Migrate Selected (${selectedFolders.size})`}
                        </Button>
                    </Box>
                </Paper>
            )}
        </Container>
    );
}
