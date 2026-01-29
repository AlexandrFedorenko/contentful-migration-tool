import React, { useState, useEffect, useRef } from 'react';
import { create, DiffPatcher } from 'jsondiffpatch';
import * as htmlFormatter from 'jsondiffpatch/formatters/html';
import { Box, Paper, Typography, Tabs, Tab, Grid, Divider, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import ArticleIcon from '@mui/icons-material/Article';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FieldRenderer } from '@/components/ContentRenderer/ContentRenderer';

interface DiffViewerProps {
    oldValue: any;
    newValue: any;
    sourceAssets?: any[];
    targetAssets?: any[];
    sourceEntries?: any[];
    targetEntries?: any[];
}

const FieldDiffRenderer = ({ label, oldVal, newVal, sourceAssets, targetAssets, sourceEntries, targetEntries }: { label: string, oldVal: any, newVal: any, sourceAssets?: any[], targetAssets?: any[], sourceEntries?: any[], targetEntries?: any[] }) => {
    const isModified = oldVal !== undefined && newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal);
    const isAdded = oldVal === undefined && newVal !== undefined;
    const isDeleted = oldVal !== undefined && newVal === undefined;

    if (!isModified && !isAdded && !isDeleted) return null;

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                • {label}
                {isModified && <Chip label="MODIFIED" size="small" color="warning" variant="outlined" />}
                {isAdded && <Chip label="ADDED" size="small" color="success" variant="outlined" />}
                {isDeleted && <Chip label="DELETED" size="small" color="error" variant="outlined" />}
            </Typography>
            <Grid container spacing={2}>
                {(isModified || isDeleted) && (
                    <Grid item xs={12} md={isModified ? 6 : 12}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', borderColor: 'error.main', borderWidth: 1 }}>
                            <Typography variant="caption" color="error" display="block" gutterBottom sx={{ fontWeight: 'bold' }}>
                                OLD VALUE (TARGET)
                            </Typography>
                            <FieldRenderer value={oldVal} assets={targetAssets} entries={targetEntries} />
                        </Paper>
                    </Grid>
                )}
                {(isModified || isAdded) && (
                    <Grid item xs={12} md={isModified ? 6 : 12}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', borderColor: 'success.main', borderWidth: 1 }}>
                            <Typography variant="caption" color="success.main" display="block" gutterBottom sx={{ fontWeight: 'bold' }}>
                                NEW VALUE (SOURCE)
                            </Typography>
                            <FieldRenderer value={newVal} assets={sourceAssets} entries={sourceEntries} />
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

const RawJsonDiff = ({ oldValue, newValue }: { oldValue: any, newValue: any }) => {
    return (
        <Box>
            <Accordion defaultExpanded sx={{ mb: 2, border: '1px solid', borderColor: 'success.main' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography color="success.main" sx={{ fontWeight: 'bold' }}>Source Entry (New)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <pre style={{ margin: 0, overflow: 'auto', maxHeight: 400, fontSize: '0.8rem' }}>
                        {JSON.stringify(newValue, null, 2)}
                    </pre>
                </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded sx={{ mb: 2, border: '1px solid', borderColor: 'error.main' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography color="error" sx={{ fontWeight: 'bold' }}>Target Entry (Old)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <pre style={{ margin: 0, overflow: 'auto', maxHeight: 400, fontSize: '0.8rem' }}>
                        {JSON.stringify(oldValue, null, 2)}
                    </pre>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default function DiffViewer({ oldValue, newValue, sourceAssets, targetAssets, sourceEntries, targetEntries }: DiffViewerProps) {
    const [tabValue, setTabValue] = useState(0);

    // Collect all unique keys from both objects
    const allKeys = Array.from(new Set([
        ...Object.keys(oldValue || {}),
        ...Object.keys(newValue || {})
    ]));

    return (
        <Paper variant="outlined" sx={{ height: 600, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab icon={<ArticleIcon />} label="Field Differences" />
                    <Tab icon={<CodeIcon />} label="Raw JSON" />
                </Tabs>
            </Box>

            <Box sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
                {tabValue === 0 && (
                    <Box>
                        {allKeys.length === 0 ? (
                            <Typography color="text.secondary">No fields to compare</Typography>
                        ) : (
                            allKeys.map(key => (
                                <FieldDiffRenderer
                                    key={key}
                                    label={key}
                                    oldVal={oldValue?.[key]}
                                    newVal={newValue?.[key]}
                                    sourceAssets={sourceAssets}
                                    targetAssets={targetAssets}
                                    sourceEntries={sourceEntries}
                                    targetEntries={targetEntries}
                                />
                            ))
                        )}
                    </Box>
                )}

                {tabValue === 1 && (
                    <RawJsonDiff oldValue={oldValue} newValue={newValue} />
                )}
            </Box>
        </Paper>
    );
}
