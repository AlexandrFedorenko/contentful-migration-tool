import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    InputAdornment,
    Checkbox,
    ListItemText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useSpaces } from '@/hooks/useSpaces';
import { useEnvironments } from '@/hooks/useEnvironments';
import ScanResultsList from '@/components/SmartMigration/ScanResultsList';
import DiffViewer from '@/components/SmartMigration/DiffViewer';
import { useGlobalContext } from '@/context/GlobalContext';
import { useAuth } from '@/context/AuthContext';

export default function SmartMigrationPage() {
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const { state } = useGlobalContext();
    const { spaces, loading: spacesLoading } = useSpaces();
    const [selectedSpace, setSelectedSpace] = useState('');
    const [sourceEnv, setSourceEnv] = useState('');
    const [targetEnv, setTargetEnv] = useState('');

    const { loadEnvironments } = useEnvironments();
    const environments = state.donorEnvironments;
    const envsLoading = state.loading.loadingEnvironments;

    // Scan Results State
    const [scanResults, setScanResults] = useState<any[]>([]);
    const [filteredResults, setFilteredResults] = useState<any[]>([]);
    const [sourceBackupFile, setSourceBackupFile] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>(['NEW', 'MODIFIED', 'DELETED']);
    const [contentTypeFilter, setContentTypeFilter] = useState<string[]>([]);
    const [localeFilter, setLocaleFilter] = useState<string[]>([]);
    const [availableLocales, setAvailableLocales] = useState<string[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Process States
    const [isScanning, setIsScanning] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [hasScanned, setHasScanned] = useState(false);

    // Diff Viewer State
    const [diffData, setDiffData] = useState<{ oldValue: any, newValue: any } | null>(null);
    const [selectedDiffItem, setSelectedDiffItem] = useState<any>(null);
    const [sourceAssets, setSourceAssets] = useState<any[]>([]);
    const [targetAssets, setTargetAssets] = useState<any[]>([]);
    const [sourceEntries, setSourceEntries] = useState<any[]>([]);
    const [targetEntries, setTargetEntries] = useState<any[]>([]);

    // Dialogs
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [successData, setSuccessData] = useState<{ deltaBackup: string } | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorDialogMessage, setErrorDialogMessage] = useState('');

    // Check authentication and redirect if not logged in
    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/');
        }
    }, [isLoggedIn, router]);

    // Load environments when space is selected
    useEffect(() => {
        if (selectedSpace) {
            loadEnvironments(selectedSpace);
        }
    }, [selectedSpace, loadEnvironments]);

    // Filter Logic
    useEffect(() => {
        let res = scanResults;

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            res = res.filter(item =>
                item.title.toLowerCase().includes(lower) ||
                item.id.toLowerCase().includes(lower) ||
                item.contentTypeId.toLowerCase().includes(lower)
            );
        }

        if (statusFilter.length > 0) {
            res = res.filter(item => statusFilter.includes(item.status));
        }

        if (contentTypeFilter.length > 0) {
            res = res.filter(item => contentTypeFilter.includes(item.contentTypeId));
        }

        setFilteredResults(res);
    }, [scanResults, searchTerm, statusFilter, contentTypeFilter]);

    const handleToggleSelect = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const handleItemClick = (item: any) => {
        setSelectedDiffItem(item);
        setDiffData({
            oldValue: item.oldValue,
            newValue: item.newValue
        });
    };

    const handleScan = async () => {
        setIsScanning(true);
        setError(null);
        setHasScanned(false);
        setStatusMessage('Backing up environments...');
        setScanResults([]);

        try {
            // 1. Trigger Smart Scan (Backups)
            const scanResponse = await fetch('/api/smart-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spaceId: selectedSpace,
                    sourceEnv,
                    targetEnv
                })
            });
            const scanData = await scanResponse.json();

            if (!scanData.success) {
                throw new Error(scanData.error || 'Scan failed');
            }

            setSourceBackupFile(scanData.sourceBackup);
            setStatusMessage('Comparing backups...');

            // 2. Compare Backups
            const compareResponse = await fetch('/api/compare-backups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spaceId: selectedSpace,
                    sourceBackup: scanData.sourceBackup,
                    targetBackup: scanData.targetBackup
                })
            });
            const compareData = await compareResponse.json();

            if (compareData.success) {
                const results = compareData.diffs || [];
                setScanResults(results);
                setFilteredResults(results);

                // Extract content types for filter
                const types = Array.from(new Set(results.map((r: any) => r.contentTypeId))) as string[];
                setContentTypeFilter(types);

                // Extract locales from source backup
                const locales = compareData.sourceLocales || [];
                setAvailableLocales(locales);
                setLocaleFilter(locales); // Select all by default

                setSourceAssets(compareData.sourceAssets || []);
                setTargetAssets(compareData.targetAssets || []);
                setSourceEntries(compareData.sourceEntries || []);
                setTargetEntries(compareData.targetEntries || []);

                setHasScanned(true);
                setStatusMessage('');
            } else {
                throw new Error(compareData.error || 'Comparison failed');
            }

        } catch (error) {
            console.error('Scan failed', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsScanning(false);
        }
    };

    const handleMigrate = async () => {
        if (selectedItems.size === 0) {
            alert('Please select items to migrate.');
            return;
        }
        if (!sourceBackupFile) {
            alert('Source backup file is missing. Please scan again.');
            return;
        }

        setIsMigrating(true);
        setStatusMessage('Migrating selected items...');

        try {
            const response = await fetch('/api/smart-migrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spaceId: selectedSpace,
                    targetEnv,
                    sourceBackup: sourceBackupFile,
                    selectedItems: Array.from(selectedItems),
                    selectedLocales: localeFilter
                })
            });

            const data = await response.json();

            if (data.success) {
                setStatusMessage('Migration successful!');
                setSuccessData({ deltaBackup: data.deltaBackup || 'Migration Complete' });
                setSuccessDialogOpen(true);

                // Refresh scan to reflect changes
                // handleScan(); // Optional: might be better to let user decide
            } else {
                throw new Error(data.error || 'Migration failed');
            }
        } catch (error) {
            console.error('Migration failed', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            setStatusMessage(`Migration failed: ${errorMsg}`);
            setErrorDialogMessage(errorMsg);
            setErrorDialogOpen(true);
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <>
            <Head>
                <title>Smart Migration | Contentful Tool</title>
            </Head>

            {!isLoggedIn ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                    <Container maxWidth="xl" sx={{ py: 4 }}>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
                            Smart Migration
                        </Typography>

                        <Paper sx={{ p: 3, mb: 4 }}>
                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Space</InputLabel>
                                        <Select
                                            value={selectedSpace}
                                            label="Space"
                                            onChange={(e) => setSelectedSpace(e.target.value)}
                                            disabled={spacesLoading}
                                        >
                                            {spaces?.map((space) => (
                                                <MenuItem key={space.id} value={space.id}>
                                                    {space.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Source Environment</InputLabel>
                                        <Select
                                            value={sourceEnv}
                                            label="Source Environment"
                                            onChange={(e) => setSourceEnv(e.target.value)}
                                            disabled={!selectedSpace || envsLoading}
                                        >
                                            {environments?.map((env: any) => (
                                                <MenuItem key={env.id} value={env.id}>
                                                    {env.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Target Environment</InputLabel>
                                        <Select
                                            value={targetEnv}
                                            label="Target Environment"
                                            onChange={(e) => setTargetEnv(e.target.value)}
                                            disabled={!selectedSpace || envsLoading}
                                        >
                                            {environments?.map((env) => (
                                                <MenuItem key={env.id} value={env.id}>
                                                    {env.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={12}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        onClick={handleScan}
                                        disabled={!selectedSpace || !sourceEnv || !targetEnv || isScanning}
                                    >
                                        {isScanning ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <CircularProgress size={24} color="inherit" />
                                                <Typography>{statusMessage}</Typography>
                                            </Box>
                                        ) : 'Scan Differences'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>

                        {error && (
                            <Alert severity="error" sx={{ mb: 4 }}>
                                {error}
                            </Alert>
                        )}

                        <Paper sx={{ p: 4, minHeight: 400 }}>
                            {scanResults.length > 0 ? (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Scan Results ({filteredResults.length} / {scanResults.length} items)
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', minHeight: 800, maxHeight: 900 }}>
                                        {/* Left Panel */}
                                        <Box sx={{ flex: '0 0 41.666%', display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="Search..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <SearchIcon color="action" />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <FormControl size="small" fullWidth>
                                                        <InputLabel>Status</InputLabel>
                                                        <Select
                                                            multiple
                                                            value={statusFilter}
                                                            label="Status"
                                                            onChange={(e) => setStatusFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                                            renderValue={(selected) => selected.join(', ')}
                                                        >
                                                            {['NEW', 'MODIFIED', 'DELETED'].map((status) => (
                                                                <MenuItem key={status} value={status}>
                                                                    <Checkbox checked={statusFilter.indexOf(status) > -1} />
                                                                    <ListItemText primary={status} />
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                    <FormControl size="small" fullWidth>
                                                        <InputLabel>Content Type</InputLabel>
                                                        <Select
                                                            multiple
                                                            value={contentTypeFilter}
                                                            label="Content Type"
                                                            onChange={(e) => setContentTypeFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                                            renderValue={(selected) => `${selected.length} selected`}
                                                        >
                                                            {Array.from(new Set(scanResults.map(r => r.contentTypeId))).map((type: any) => (
                                                                <MenuItem key={type} value={type}>
                                                                    <Checkbox checked={contentTypeFilter.indexOf(type) > -1} />
                                                                    <ListItemText primary={type} />
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                                {availableLocales.length > 0 && (
                                                    <FormControl size="small" fullWidth>
                                                        <InputLabel>Locales to Migrate</InputLabel>
                                                        <Select
                                                            multiple
                                                            value={localeFilter}
                                                            label="Locales to Migrate"
                                                            onChange={(e) => setLocaleFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                                            renderValue={(selected) => `${selected.length} selected`}
                                                        >
                                                            {availableLocales.map((locale: string) => (
                                                                <MenuItem key={locale} value={locale}>
                                                                    <Checkbox checked={localeFilter.indexOf(locale) > -1} />
                                                                    <ListItemText primary={locale} />
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            </Box>

                                            <Box sx={{ flex: 1, minHeight: 0 }}>
                                                <ScanResultsList
                                                    items={filteredResults}
                                                    selectedIds={Array.from(selectedItems)}
                                                    onToggleSelect={handleToggleSelect}
                                                    onItemClick={handleItemClick}
                                                    height="100%"
                                                />
                                            </Box>
                                            <Box sx={{ mt: 2 }}>
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    fullWidth
                                                    onClick={handleMigrate}
                                                    disabled={selectedItems.size === 0 || isMigrating || !sourceBackupFile}
                                                >
                                                    {isMigrating ? <CircularProgress size={24} color="inherit" /> : `Migrate Selected (${selectedItems.size})`}
                                                </Button>
                                            </Box>
                                        </Box>

                                        {/* Right Panel */}
                                        <Box sx={{ flex: '0 0 58.333%', display: 'flex', flexDirection: 'column' }}>
                                            {diffData ? (
                                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                                    <DiffViewer
                                                        oldValue={diffData.oldValue}
                                                        newValue={diffData.newValue}
                                                        sourceAssets={sourceAssets}
                                                        targetAssets={targetAssets}
                                                        sourceEntries={sourceEntries}
                                                        targetEntries={targetEntries}
                                                    />
                                                </Box>
                                            ) : (
                                                <Paper variant="outlined" sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper' }}>
                                                    <Typography color="text.secondary">
                                                        Select an item to view details
                                                    </Typography>
                                                </Paper>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 10 }}>
                                    <Typography variant="h6">
                                        {hasScanned
                                            ? 'No differences found between the selected environments.'
                                            : 'Select environments and click Scan to see differences'}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Container>
                </Box>
            )}

            <Dialog
                open={successDialogOpen}
                onClose={() => setSuccessDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ textAlign: 'center', color: 'success.main', fontWeight: 'bold' }}>
                    Migration Successful!
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body1" paragraph>
                            Selected items have been successfully migrated to the target environment.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button variant="contained" onClick={() => setSuccessDialogOpen(false)} color="success" size="large">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={errorDialogOpen}
                onClose={() => setErrorDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ textAlign: 'center', color: 'error.main', fontWeight: 'bold' }}>
                    Migration Failed
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body1" paragraph>
                            An error occurred during migration.
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff5f5', borderColor: '#ffcdd2', display: 'inline-block', maxWidth: '100%', overflow: 'auto' }}>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'error.main' }}>
                                {errorDialogMessage}
                            </Typography>
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button variant="contained" onClick={() => setErrorDialogOpen(false)} color="error" size="large">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
