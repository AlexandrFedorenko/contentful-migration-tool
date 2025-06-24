import React from "react";
import { useState } from "react";
import {
    Container,
    Typography,
    Box,
    Tabs,
    Tab,
    Paper,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";
import BackupIcon from "@mui/icons-material/Backup";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import TerminalIcon from "@mui/icons-material/Terminal";

// Импортируем наш кастомный хук
import { useDocumentationTabs, TabIndex } from "@/hooks/useDocumentationTabs";

// =============================
// Компонент Documentation
// =============================
const Documentation: React.FC = () => {
    // Вместо локального useState → кастомный хук
    const { tabIndex, handleTabChange } = useDocumentationTabs(TabIndex.CONTENTFUL);

    return (
        <Container maxWidth="lg" sx={{ mt: 5 }}>
            <Typography variant="h3" textAlign="center" gutterBottom>
                📖 Documentation on Contentful and Data Migration
            </Typography>

            <Paper elevation={3} sx={{ mb: 3 }}>
                <Tabs
                    value={tabIndex}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab icon={<LibraryBooksIcon />} label="Contentful" />
                    <Tab icon={<TerminalIcon />} label="Installing Contentful-CLI" />
                    <Tab icon={<BackupIcon />} label="How it works" />
                    <Tab icon={<ErrorOutlineIcon />} label="Errors and Solutions" />
                    <Tab icon={<WarningIcon />} label="Transfer to Production" />
                </Tabs>
            </Paper>

            <Box sx={{ p: 3 }}>
                {tabIndex === TabIndex.CONTENTFUL && <ContentfulOverview />}
                {tabIndex === TabIndex.CLI_INSTALLATION && <InstallContentfulCLI />}
                {tabIndex === TabIndex.HOW_IT_WORKS && <BackupGuide />}
                {tabIndex === TabIndex.ERRORS_SOLUTIONS && <ErrorHandling />}
                {tabIndex === TabIndex.PRODUCTION_TRANSFER && <ProductionWarning />}
            </Box>
        </Container>
    );
};

export default Documentation;

// =============================
// Описание отдельных компонентов
// =============================

// Контент по Contentful
const ContentfulOverview: React.FC = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                🚀 How Contentful Works
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Contentful is a <strong>headless CMS</strong> where content is organized into <strong>Content Types</strong> (data models) consisting of <strong>Entries</strong> (records).
                All data is stored in <strong>Environments</strong>, allowing you to work with different content versions.
            </Typography>
        </Box>
    );
};

// Инструкция по установке Contentful CLI
const InstallContentfulCLI: React.FC = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                🛠 Installing Contentful-CLI
            </Typography>
            <Typography>
                Run the following command to install Contentful CLI globally:
            </Typography>
            <Box component="pre" sx={{ backgroundColor: "#f4f4f4", p: 2, borderRadius: 2 }}>
                npm install -g contentful-cli
            </Box>
        </Box>
    );
};

// Гид по бэкапам
const BackupGuide: React.FC = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                🔄 How Our Backup System Works
            </Typography>
            <Typography>
                Our system allows you to create, restore, and delete backups for your Contentful spaces.
            </Typography>
        </Box>
    );
};

// Ошибки и их решения
const ErrorHandling: React.FC = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                ⚠️ Errors and Solutions
            </Typography>
            <Typography>
                Here are the most common migration errors and how to solve them.
            </Typography>
        </Box>
    );
};

// Предупреждение о переносе на продакшн
const ProductionWarning: React.FC = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" color="error" gutterBottom>
                ⚠️ Warning: Create a Backup Before Migrating to Production!
            </Typography>
            <Typography>
                Before migrating data to the production environment, make sure to back up all environments.
            </Typography>
        </Box>
    );
};
