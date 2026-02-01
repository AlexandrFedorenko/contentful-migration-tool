import React from 'react';
import {
    Container,
    Typography,
    Box,
    Tabs,
    Tab,
    Paper,
} from '@mui/material';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import BackupIcon from '@mui/icons-material/Backup';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import TerminalIcon from '@mui/icons-material/Terminal';
import { useDocumentationTabs, TabIndex } from '@/hooks/useDocumentationTabs';
import ContentfulOverview from './ContentfulOverview';
import CLIInstallation from './CLIInstallation';
import HowItWorks from './HowItWorks';
import OperationModes from './OperationModes';
import ErrorHandling from './ErrorHandling';
import ProductionWarning from './ProductionWarning';

const Documentation: React.FC = () => {
    const { tabIndex, handleTabChange } = useDocumentationTabs(TabIndex.CONTENTFUL);

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
            <Typography variant="h3" textAlign="center" gutterBottom>
                Documentation
            </Typography>
            <Typography variant="subtitle1" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
                Complete guide to using Contentful Migration Tool
            </Typography>

            <Paper elevation={3} sx={{ mb: 3 }}>
                <Tabs
                    value={tabIndex}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab icon={<LibraryBooksIcon />} iconPosition="start" label="Contentful Overview" />
                    <Tab icon={<TerminalIcon />} iconPosition="start" label="CLI Installation" />
                    <Tab icon={<BackupIcon />} iconPosition="start" label="How It Works" />
                    <Tab icon={<AutoModeIcon />} iconPosition="start" label="Operation Modes" />
                    <Tab icon={<ErrorOutlineIcon />} iconPosition="start" label="Errors & Solutions" />
                    <Tab icon={<WarningIcon />} iconPosition="start" label="Production Safety" />
                </Tabs>
            </Paper>

            <Box>
                {tabIndex === TabIndex.CONTENTFUL && <ContentfulOverview />}
                {tabIndex === TabIndex.CLI_INSTALLATION && <CLIInstallation />}
                {tabIndex === TabIndex.HOW_IT_WORKS && <HowItWorks />}
                {tabIndex === TabIndex.OPERATION_MODES && <OperationModes />}
                {tabIndex === TabIndex.ERRORS_SOLUTIONS && <ErrorHandling />}
                {tabIndex === TabIndex.PRODUCTION_TRANSFER && <ProductionWarning />}
            </Box>
        </Container>
    );
};

export default Documentation;
