import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
    Container,
    Typography,
    Box,
    Paper,
    CircularProgress,
    Tabs,
    Tab,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
    InputAdornment,
    Chip,
    Checkbox,
    FormControlLabel,
    Button,
    AppBar,
    Toolbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import CodeIcon from '@mui/icons-material/Code';
import ArticleIcon from '@mui/icons-material/Article';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3, pb: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );

}



// Helper to get title from an entry
const getEntryTitle = (entry: any) => {
    if (!entry || !entry.fields) return entry?.sys?.id || 'Unknown';
    const fields = entry.fields;

    // 1. Try specific title fields
    const titleField = Object.keys(fields).find(key => {
        const k = key.toLowerCase();
        return k.includes('title') || k.includes('name') || k.includes('label') || k.includes('headline') || k.includes('slug') || k.includes('header');
    });

    if (titleField) {
        const val = fields[titleField];
        if (typeof val === 'object' && val !== null) {
            return Object.values(val)[0] as string;
        }
        return String(val);
    }

    // 2. Fallback: Try FIRST string field
    for (const key of Object.keys(fields)) {
        const val = fields[key];
        if (typeof val === 'string') return val;
        if (typeof val === 'object' && val !== null) {
            const firstVal = Object.values(val)[0];
            if (typeof firstVal === 'string') return firstVal;
        }
    }

    return entry.sys.id;
};

const RichTextRenderer = ({ node, assets, entries }: { node: any, assets: any[], entries: any[] }) => {
    if (node.nodeType === 'text') {
        return <span style={{ fontWeight: node.marks?.some((m: any) => m.type === 'bold') ? 'bold' : 'normal', fontStyle: node.marks?.some((m: any) => m.type === 'italic') ? 'italic' : 'normal', textDecoration: node.marks?.some((m: any) => m.type === 'underline') ? 'underline' : 'none' }}>{node.value}</span>;
    }

    if (node.nodeType === 'paragraph') {
        return (
            <Typography variant="body2" paragraph>
                {node.content.map((child: any, i: number) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}
            </Typography>
        );
    }

    if (node.nodeType === 'heading-1') return <Typography variant="h4" gutterBottom>{node.content.map((child: any, i: number) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}</Typography>;
    if (node.nodeType === 'heading-2') return <Typography variant="h5" gutterBottom>{node.content.map((child: any, i: number) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}</Typography>;
    if (node.nodeType === 'heading-3') return <Typography variant="h6" gutterBottom>{node.content.map((child: any, i: number) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}</Typography>;

    if (node.nodeType === 'embedded-asset-block') {
        const assetId = node.data?.target?.sys?.id;
        const asset = assets?.find(a => a.sys.id === assetId);
        if (asset) {
            const fileData = Object.values(asset.fields?.file || {})[0] as any;
            if (fileData?.url && fileData.contentType?.startsWith('image/')) {
                return (
                    <Box sx={{ my: 2 }}>
                        <img
                            src={fileData.url.startsWith('//') ? `https:${fileData.url}` : fileData.url}
                            alt={fileData.fileName}
                            style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4 }}
                        />
                    </Box>
                );
            }
        }
        return <Chip label={`Asset: ${assetId}`} size="small" sx={{ my: 1 }} />;
    }

    if (node.nodeType === 'embedded-entry-block' || node.nodeType === 'embedded-entry-inline') {
        const entryId = node.data?.target?.sys?.id;
        const entry = entries?.find(e => e.sys.id === entryId);
        const title = entry ? getEntryTitle(entry) : entryId;
        // Ensure Name first then ID
        const label = title === entryId ? `ID: ${entryId}` : `${title} (ID: ${entryId})`;
        return <Chip label={label} size="small" variant="outlined" sx={{ my: 0.5, mr: 0.5 }} />;
    }

    if (node.nodeType === 'unordered-list') {
        return <ul>{node.content.map((child: any, i: number) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}</ul>;
    }
    if (node.nodeType === 'ordered-list') {
        return <ol>{node.content.map((child: any, i: number) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}</ol>;
    }
    if (node.nodeType === 'list-item') {
        return <li>{node.content.map((child: any, i: number) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}</li>;
    }

    // Fallback for other nodes
    return (
        <Box sx={{ pl: 1 }}>
            {node.content?.map((child: any, i: number) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}
        </Box>
    );
};

const FieldRenderer = ({ value, assets, entries }: { value: any, assets: any[], entries: any[] }) => {
    if (!value || typeof value !== 'object') return null;

    return (
        <Box>
            {Object.entries(value).map(([locale, content]: [string, any]) => {
                // Handle Asset Link
                if (content?.sys?.type === 'Link' && content?.sys?.linkType === 'Asset') {
                    const asset = assets?.find(a => a.sys.id === content.sys.id);
                    if (asset) {
                        // Try to get file url from the same locale, or fallback to first available
                        const fileData = asset.fields?.file?.[locale] || Object.values(asset.fields?.file || {})[0];
                        if (fileData?.url) {
                            const isImage = fileData.contentType?.startsWith('image/');
                            return (
                                <Box key={locale} sx={{ mb: 1 }}>
                                    <Typography variant="caption" color="textSecondary" display="block">
                                        {locale}
                                    </Typography>
                                    {isImage ? (
                                        <Box
                                            component="img"
                                            src={fileData.url.startsWith('//') ? `https:${fileData.url}` : fileData.url}
                                            alt={fileData.fileName}
                                            sx={{ maxWidth: '100%', maxHeight: 200, borderRadius: 1, border: '1px solid #eee' }}
                                        />
                                    ) : (
                                        <Typography variant="body2">
                                            File: {fileData.fileName} ({fileData.contentType})
                                        </Typography>
                                    )}
                                </Box>
                            );
                        }
                    }
                    return (
                        <Box key={locale} sx={{ mb: 1 }}>
                            <Typography variant="caption" color="textSecondary" display="block">
                                {locale}
                            </Typography>
                            <Typography variant="body2" color="error">
                                Asset not found (ID: {content.sys.id})
                            </Typography>
                        </Box>
                    );
                }

                // Handle Entry Link
                if (content?.sys?.type === 'Link' && content?.sys?.linkType === 'Entry') {
                    const entry = entries?.find(e => e.sys.id === content.sys.id);
                    const title = entry ? getEntryTitle(entry) : content.sys.id;
                    // Ensure Name first then ID
                    const label = title === content.sys.id ? `ID: ${content.sys.id}` : `${title} (ID: ${content.sys.id})`;
                    return (
                        <Box key={locale} sx={{ mb: 1 }}>
                            <Typography variant="caption" color="textSecondary" display="block">
                                {locale}
                            </Typography>
                            <Chip label={label} size="small" variant="outlined" />
                        </Box>
                    );
                }

                // Handle Rich Text
                if (content?.nodeType === 'document') {
                    return (
                        <Box key={locale} sx={{ mb: 1 }}>
                            <Typography variant="caption" color="textSecondary" display="block">
                                {locale}
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                                <RichTextRenderer node={content} assets={assets} entries={entries} />
                            </Paper>
                        </Box>
                    );
                }

                // Handle Array of Links (e.g. Gallery)
                if (Array.isArray(content)) {
                    return (
                        <Box key={locale} sx={{ mb: 1 }}>
                            <Typography variant="caption" color="textSecondary" display="block">
                                {locale}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {content.map((item: any, idx: number) => {
                                    if (item?.sys?.type === 'Link' && item?.sys?.linkType === 'Asset') {
                                        const asset = assets?.find(a => a.sys.id === item.sys.id);
                                        const fileData = asset?.fields?.file?.[locale] || Object.values(asset?.fields?.file || {})[0];
                                        if (fileData?.url && fileData.contentType?.startsWith('image/')) {
                                            return (
                                                <Box
                                                    key={idx}
                                                    component="img"
                                                    src={fileData.url.startsWith('//') ? `https:${fileData.url}` : fileData.url}
                                                    alt={fileData.fileName}
                                                    sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
                                                />
                                            );
                                        }
                                    }
                                    if (item?.sys?.type === 'Link' && item?.sys?.linkType === 'Entry') {
                                        const entry = entries?.find(e => e.sys.id === item.sys.id);
                                        const title = entry ? getEntryTitle(entry) : item.sys.id;
                                        // Ensure Name first then ID
                                        const label = title === item.sys.id ? `ID: ${item.sys.id}` : `${title} (ID: ${item.sys.id})`;
                                        return <Chip key={idx} label={label} size="small" variant="outlined" />;
                                    }
                                    return (
                                        <Box key={idx} sx={{ p: 0.5, border: '1px solid #eee', borderRadius: 1 }}>
                                            <Typography variant="caption">{JSON.stringify(item)}</Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    );
                }

                // Handle Text/Primitives/Objects
                let displayValue = String(content);
                let isObject = false;
                if (typeof content === 'object' && content !== null) {
                    displayValue = JSON.stringify(content, null, 2);
                    isObject = true;
                }

                return (
                    <Box key={locale} sx={{ mb: 1 }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                            {locale}
                        </Typography>
                        {isObject ? (
                            <pre style={{ margin: 0, fontSize: '0.8rem', overflow: 'auto', maxHeight: 200, background: 'rgba(0,0,0,0.05)', padding: '8px', borderRadius: '4px', color: 'text.primary' }}>
                                {displayValue}
                            </pre>
                        ) : (
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                                {displayValue}
                            </Typography>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
};

export default function BackupPreview() {
    const router = useRouter();
    const { filename } = router.query;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [backupData, setBackupData] = useState<any>(null);
    const [tabValue, setTabValue] = useState(0);
    const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Selective Restore State
    const [selectedLocales, setSelectedLocales] = useState<Set<string>>(new Set());
    const [selectedContentTypes, setSelectedContentTypes] = useState<Set<string>>(new Set());
    const [isRestoring, setIsRestoring] = useState(false);

    // Restore Dialog State
    const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
    const [clearEnvironment, setClearEnvironment] = useState(false);
    const [restoreError, setRestoreError] = useState<string | null>(null);
    const [restoreSuccess, setRestoreSuccess] = useState(false);

    useEffect(() => {
        if (!router.isReady) return;

        const fetchBackupContent = async () => {
            try {
                const spaceId = new URLSearchParams(window.location.search).get('spaceId');
                if (!spaceId || !filename) {
                    throw new Error('Missing spaceId or filename');
                }

                let data;

                // Check if this is a temporary preview file
                if (typeof filename === 'string' && filename.startsWith('temp-preview-')) {
                    const storageKey = `temp-backup-${spaceId}-${filename}`;
                    const { getTempBackup } = await import('@/utils/largeFileStorage');
                    const fileContent = await getTempBackup(storageKey);

                    if (!fileContent) {
                        throw new Error('Temporary backup file not found or expired');
                    }
                    data = JSON.parse(fileContent);
                } else {
                    // Normal API fetch
                    const response = await fetch(`/api/backup-content?spaceId=${spaceId}&filename=${filename}`);
                    if (!response.ok) {
                        throw new Error('Failed to load backup content');
                    }
                    data = await response.json();
                }

                setBackupData(data);

                // Set initial selected content type if available
                if (data.contentTypes && data.contentTypes.length > 0) {
                    setSelectedContentType(data.contentTypes[0].sys.id);
                }

                // Initialize selections from localStorage or default to all
                const storageKey = `backup-selection-${spaceId}-${filename}`;
                const savedSelection = localStorage.getItem(storageKey);

                if (savedSelection) {
                    try {
                        const parsed = JSON.parse(savedSelection);
                        setSelectedLocales(new Set(parsed.locales || []));
                        setSelectedContentTypes(new Set(parsed.contentTypes || []));
                    } catch {
                        // If parsing fails, default to all
                        setSelectedLocales(new Set(data.locales?.map((l: any) => l.code) || []));
                        setSelectedContentTypes(new Set(data.contentTypes?.map((ct: any) => ct.sys.id) || []));
                    }
                } else {
                    // Default to all selected
                    setSelectedLocales(new Set(data.locales?.map((l: any) => l.code) || []));
                    setSelectedContentTypes(new Set(data.contentTypes?.map((ct: any) => ct.sys.id) || []));
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchBackupContent();
    }, [router.isReady, filename]);

    const stats = useMemo(() => {
        if (!backupData) return null;
        return {
            contentTypes: backupData.contentTypes?.length || 0,
            entries: backupData.entries?.length || 0,
            assets: backupData.assets?.length || 0,
            locales: backupData.locales?.length || 0,
        };
    }, [backupData]);

    const entriesByContentType = useMemo(() => {
        if (!backupData?.entries) return {};
        const grouped: Record<string, any[]> = {};

        backupData.entries.forEach((entry: any) => {
            const ctId = entry.sys.contentType.sys.id;
            if (!grouped[ctId]) grouped[ctId] = [];
            grouped[ctId].push(entry);
        });

        return grouped;
    }, [backupData]);

    const filteredEntries = useMemo(() => {
        if (!selectedContentType || !entriesByContentType[selectedContentType]) return [];
        return entriesByContentType[selectedContentType];
    }, [selectedContentType, entriesByContentType]);

    const filteredContentTypes = useMemo(() => {
        if (!backupData?.contentTypes) return [];
        if (!searchTerm) return backupData.contentTypes;

        const lowerSearch = searchTerm.toLowerCase();
        return backupData.contentTypes.filter((ct: any) =>
            ct.name.toLowerCase().includes(lowerSearch) ||
            ct.sys.id.toLowerCase().includes(lowerSearch)
        );
    }, [backupData, searchTerm]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };


    // Selective Restore Handlers
    const handleLocaleToggle = (localeCode: string) => {
        setSelectedLocales(prev => {
            const newSet = new Set(prev);
            if (newSet.has(localeCode)) {
                newSet.delete(localeCode);
            } else {
                newSet.add(localeCode);
            }
            return newSet;
        });
    };

    const handleContentTypeToggle = (contentTypeId: string) => {
        setSelectedContentTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(contentTypeId)) {
                newSet.delete(contentTypeId);
            } else {
                newSet.add(contentTypeId);
            }
            return newSet;
        });
    };

    const handleSelectAllLocales = (checked: boolean) => {
        if (checked) {
            setSelectedLocales(new Set(backupData?.locales?.map((l: any) => l.code) || []));
        } else {
            setSelectedLocales(new Set());
        }
    };

    const handleSelectAllContentTypes = (checked: boolean) => {
        if (checked) {
            setSelectedContentTypes(new Set(backupData?.contentTypes?.map((ct: any) => ct.sys.id) || []));
        } else {
            setSelectedContentTypes(new Set());
        }
    };

    const handleSaveSelection = () => {
        const spaceId = new URLSearchParams(window.location.search).get('spaceId');
        if (!spaceId || !filename) return;

        const storageKey = `backup-selection-${spaceId}-${filename}`;
        const selection = {
            locales: Array.from(selectedLocales),
            contentTypes: Array.from(selectedContentTypes)
        };

        localStorage.setItem(storageKey, JSON.stringify(selection));
        alert('Selection saved!');
    };

    const handleRestoreClick = () => {
        if (selectedLocales.size === 0 || selectedContentTypes.size === 0) {
            alert('Please select at least one locale and one content type');
            return;
        }
        setRestoreError(null);
        setOpenRestoreDialog(true);
    };

    const handleExecuteRestore = async () => {
        const spaceId = new URLSearchParams(window.location.search).get('spaceId');
        const targetEnv = new URLSearchParams(window.location.search).get('targetEnv') || 'master';

        if (!spaceId || !filename) return;

        setIsRestoring(true);
        setRestoreError(null);

        try {
            let fileContent = null;

            // If it's a temporary file, read content from IndexedDB
            if (typeof filename === 'string' && filename.startsWith('temp-preview-')) {
                const storageKey = `temp-backup-${spaceId}-${filename}`;
                const { getTempBackup } = await import('@/utils/largeFileStorage');
                const storedContent = await getTempBackup(storageKey);

                if (storedContent) {
                    fileContent = JSON.parse(storedContent);
                }
            }

            const response = await fetch('/api/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    spaceId,
                    fileName: filename,
                    targetEnvironment: targetEnv,
                    fileContent, // Send content if available (fixes "File not found")
                    clearEnvironment, // Send clear flag
                    options: {
                        locales: Array.from(selectedLocales),
                        contentTypes: Array.from(selectedContentTypes)
                    }
                }),
            });

            const data = await response.json();

            if (data.success) {
                setOpenRestoreDialog(false);
                setRestoreSuccess(true);
            } else {
                throw new Error(data.error || 'Restore failed');
            }
        } catch (error) {
            setRestoreError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsRestoring(false);
        }
    };

    const handleCloseSuccess = () => {
        setRestoreSuccess(false);
        // Optional: reload page or redirect
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography color="error" variant="h5">Error: {error}</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.back()}
                    variant="outlined"
                    sx={{ mr: 2 }}
                >
                    Back
                </Button>
                <Typography variant="h4" component="h1">
                    Backup Preview: {filename}
                </Typography>
            </Box>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="backup preview tabs">
                    <Tab icon={<DashboardIcon />} label="Overview" />
                    <Tab icon={<ArticleIcon />} label="Content Browser" />
                    <Tab icon={<CodeIcon />} label="Raw JSON" />
                </Tabs>
            </Paper>

            <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>Content Types</Typography>
                                <Typography variant="h3">{stats?.contentTypes}</Typography>
                                <Typography variant="caption" color="primary">
                                    {selectedContentTypes.size} selected
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>Entries</Typography>
                                <Typography variant="h3">{stats?.entries}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>Assets</Typography>
                                <Typography variant="h3">{stats?.assets}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>Locales</Typography>
                                <Typography variant="h3">{stats?.locales}</Typography>
                                <Typography variant="caption" color="primary">
                                    {selectedLocales.size} selected
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Locales Selection - Only for Custom Backups */}
                    {router.query.targetEnv && (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Select Locales to Restore
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={backupData?.locales?.length > 0 && selectedLocales.size === backupData?.locales?.length}
                                                indeterminate={selectedLocales.size > 0 && selectedLocales.size < (backupData?.locales?.length || 0)}
                                                onChange={(e) => handleSelectAllLocales(e.target.checked)}
                                                color="primary"
                                            />
                                        }
                                        label="Select All Locales"
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {backupData?.locales?.map((locale: any) => (
                                        <FormControlLabel
                                            key={locale.code}
                                            control={
                                                <Checkbox
                                                    checked={selectedLocales.has(locale.code)}
                                                    onChange={() => handleLocaleToggle(locale.code)}
                                                    color="primary"
                                                />
                                            }
                                            label={`${locale.name} (${locale.code})`}
                                        />
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>
                            <List component="nav">
                                {router.query.targetEnv && (
                                    <>
                                        <Box sx={{ p: 1, pb: 0 }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                placeholder="Search types..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SearchIcon fontSize="small" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{ mb: 1 }}
                                            />
                                        </Box>
                                        <ListItem>
                                            <Checkbox
                                                checked={backupData?.contentTypes?.length > 0 && selectedContentTypes.size === backupData?.contentTypes?.length}
                                                indeterminate={selectedContentTypes.size > 0 && selectedContentTypes.size < (backupData?.contentTypes?.length || 0)}
                                                onChange={(e) => handleSelectAllContentTypes(e.target.checked)}
                                                color="primary"
                                                size="small"
                                                sx={{ mr: 1 }}
                                            />
                                            <ListItemText primary="Select All" />
                                        </ListItem>
                                        <Divider />
                                    </>
                                )}
                                {filteredContentTypes.map((ct: any) => (
                                    <React.Fragment key={ct.sys.id}>
                                        <ListItem
                                            button
                                            selected={selectedContentType === ct.sys.id}
                                            onClick={() => setSelectedContentType(ct.sys.id)}
                                        >
                                            {router.query.targetEnv && (
                                                <Checkbox
                                                    checked={selectedContentTypes.has(ct.sys.id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleContentTypeToggle(ct.sys.id);
                                                    }}
                                                    color="primary"
                                                    size="small"
                                                    sx={{ mr: 1 }}
                                                />
                                            )}
                                            <ListItemText
                                                primary={ct.name}
                                                secondary={`${entriesByContentType[ct.sys.id]?.length || 0} entries`}
                                            />
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={9}>

                        <Paper sx={{ height: 'calc(100vh - 300px)', overflow: 'auto', p: 2 }}>
                            {filteredEntries.map((entry: any) => (
                                <Accordion key={entry.sys.id}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography sx={{ width: '60%', flexShrink: 0, fontWeight: 'medium' }}>
                                            {getEntryTitle(entry)}
                                        </Typography>
                                        <Typography sx={{ color: 'text.secondary' }}>
                                            ID: {entry.sys.id}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2}>
                                            {Object.entries(entry.fields).map(([fieldName, fieldValue]: [string, any]) => (
                                                <Grid item xs={12} key={fieldName}>
                                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                                        <Typography variant="subtitle2" color="primary" gutterBottom>
                                                            {fieldName}
                                                        </Typography>
                                                        <FieldRenderer
                                                            value={fieldValue}
                                                            assets={backupData?.assets || []}
                                                            entries={backupData?.entries || []}
                                                        />
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                            {filteredEntries.length === 0 && (
                                <Typography variant="body1" color="textSecondary" align="center" sx={{ mt: 4 }}>
                                    No entries found
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <Paper sx={{ p: 2, maxHeight: '80vh', overflow: 'auto' }}>
                    <pre>{JSON.stringify(backupData, null, 2)}</pre>
                </Paper>
            </TabPanel>

            {/* Action Bar - Only for Custom Backups */}
            {router.query.targetEnv && (
                <AppBar position="fixed" color="inherit" sx={{ top: 'auto', bottom: 0, boxShadow: 3, bgcolor: 'background.paper' }}>
                    <Toolbar>
                        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Target Environment: <strong>{new URLSearchParams(window.location.search).get('targetEnv') || 'Unknown'}</strong>
                            </Typography>
                            <Divider orientation="vertical" flexItem />
                            <Typography variant="body2" color="text.secondary">
                                Selected: {selectedLocales.size} locale(s), {selectedContentTypes.size} content type(s)
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleRestoreClick}
                                disabled={isRestoring || selectedLocales.size === 0 || selectedContentTypes.size === 0}
                                startIcon={isRestoring ? <CircularProgress size={20} color="inherit" /> : null}
                            >
                                {isRestoring ? 'Restoring...' : 'Restore Selected'}
                            </Button>
                        </Box>
                    </Toolbar>
                </AppBar>
            )}

            {/* Add padding to bottom to prevent content from being hidden by fixed AppBar */}
            <Box sx={{ pb: 10 }} />

            {/* Restore Confirmation Dialog */}
            <Dialog
                open={openRestoreDialog}
                onClose={() => setOpenRestoreDialog(false)}
                aria-labelledby="restore-dialog-title"
                aria-describedby="restore-dialog-description"
            >
                <DialogTitle id="restore-dialog-title">
                    Confirm Restore
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="restore-dialog-description" sx={{ mb: 2 }}>
                        You are about to restore <strong>{selectedLocales.size} locale(s)</strong> and <strong>{selectedContentTypes.size} content type(s)</strong> to environment:
                        <br />
                        <strong>{new URLSearchParams(window.location.search).get('targetEnv') || 'Unknown'}</strong>
                    </DialogContentText>

                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={clearEnvironment}
                                    onChange={(e) => setClearEnvironment(e.target.checked)}
                                    color="error"
                                />
                            }
                            label={
                                <Typography variant="body2" color="error">
                                    Clear target environment before restore
                                </Typography>
                            }
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
                            ⚠️ This will delete ALL entries, assets, and content types in the target environment before restoring.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRestoreDialog(false)} color="inherit" disabled={isRestoring}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExecuteRestore}
                        color={clearEnvironment ? "error" : "primary"}
                        variant="contained"
                        autoFocus
                        disabled={isRestoring}
                        startIcon={isRestoring ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isRestoring ? 'Restoring...' : (clearEnvironment ? 'Clear & Restore' : 'Restore')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Dialog */}
            <Dialog
                open={restoreSuccess}
                onClose={handleCloseSuccess}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
                    <Box sx={{ color: 'success.main', mb: 2 }}>
                        <svg style={{ width: 64, height: 64 }} viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    </Box>
                    Restore Successful!
                </DialogTitle>
                <DialogContent>
                    <DialogContentText align="center">
                        The content has been successfully restored to the <strong>{new URLSearchParams(window.location.search).get('targetEnv')}</strong> environment.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 4 }}>
                    <Button onClick={handleCloseSuccess} variant="contained" color="primary" size="large">
                        Awesome!
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
