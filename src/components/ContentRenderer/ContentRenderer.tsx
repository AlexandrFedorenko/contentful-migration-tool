import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import Image from 'next/image';

// Helper to get title from an entry
export const getEntryTitle = (entry: any) => {
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

export const RichTextRenderer = ({ node, assets, entries }: { node: any, assets?: any[], entries?: any[] }) => {
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
                    <Box sx={{ my: 2, position: 'relative', width: '100%', height: 300 }}>
                        <Image
                            src={fileData.url.startsWith('//') ? `https:${fileData.url}` : fileData.url}
                            alt={fileData.fileName}
                            fill
                            style={{ objectFit: 'contain', borderRadius: 4 }}
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

export const FieldRenderer = ({ value, assets, entries }: { value: any, assets?: any[], entries?: any[] }) => {
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
