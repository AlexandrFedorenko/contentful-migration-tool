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
    TableCell, TableBody
} from "@mui/material";
import BackupIcon from "@mui/icons-material/Backup";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import TerminalIcon from "@mui/icons-material/Terminal";

export default function Documentation() {
    const [tabIndex, setTabIndex] = useState(0);

    return (
        <Container maxWidth="lg" sx={{ mt: 5 }}>
            <Typography variant="h3" textAlign="center" gutterBottom>
                📖 Documentation on Contentful and data migration
            </Typography>

            <Paper elevation={3} sx={{ mb: 3 }}>
                <Tabs
                    value={tabIndex}
                    onChange={(e, newIndex) => setTabIndex(newIndex)}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab icon={<LibraryBooksIcon />} label="Contentful" />
                    <Tab icon={<TerminalIcon />} label="Installing Contentful-CLI" />
                    <Tab icon={<BackupIcon />} label="How it works" />
                    <Tab icon={<ErrorOutlineIcon />} label="Errors and Solutions" />
                    <Tab icon={<WarningIcon />} label="Transfer to production" />
                </Tabs>
            </Paper>

            <Box sx={{ p: 3 }}>
                {tabIndex === 0 && <ContentfulOverview />}
                {tabIndex === 1 && <InstallContentfulCLI />}
                {tabIndex === 2 && <BackupGuide />}
                {tabIndex === 3 && <ErrorHandling />}
                {tabIndex === 4 && <ProductionWarning />}
            </Box>
        </Container>
    );
}

function ContentfulOverview() {
    return (
        <Box sx={{ p: 3 }}>
            {/* Title */}
            <Typography variant="h4" gutterBottom>
                🚀 How Contentful Works
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Contentful is a <strong>headless CMS</strong> where content is organized into <strong>Content Types</strong> (data models) consisting of <strong>Entries</strong> (records).
                All data is stored in <strong>Environments</strong>, allowing you to work with different content versions.
            </Typography>

            {/* Main Entities */}
            <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>
                📌 Key Entities in Contentful:
            </Typography>
            <ul>
                <li><strong>Content Types</strong> – Define data structures (e.g., "Article", "Product").</li>
                <li><strong>Entries</strong> – Records within a Content Type.</li>
                <li><strong>Assets</strong> – Media files (images, videos).</li>
                <li><strong>Locales</strong> – Content localization.</li>
                <li><strong>Tags</strong> – Labels for content classification.</li>
                <li><strong>API Keys</strong> – Access keys.</li>
            </ul>

            {/* Migration Specifics */}
            <Typography variant="h5" sx={{ mt: 4, mb: 1 }}>
                🔹 Data Migration Specifics Between Environments
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Content migration in Contentful has several limitations. It’s important to understand that some entities can be **modified but not deleted**,
                and drafts and published entries are transferred differently.
            </Typography>

            <TableContainer component={Paper} sx={{ mt: 2, mb: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Entity</strong></TableCell>
                            <TableCell><strong>Can be migrated?</strong></TableCell>
                            <TableCell><strong>Limitations</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell><strong>Content Types</strong></TableCell>
                            <TableCell>✅ Yes</TableCell>
                            <TableCell>Cannot be deleted, only added/modified</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><strong>Entries (Records)</strong></TableCell>
                            <TableCell>✅ Yes</TableCell>
                            <TableCell>Deleted ones are not migrated, modified ones remain Unpublished</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><strong>Assets (Media)</strong></TableCell>
                            <TableCell>✅ Yes</TableCell>
                            <TableCell>Modified remain Unpublished, deleted ones are not migrated</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><strong>Locales (Localization)</strong></TableCell>
                            <TableCell>✅ Yes</TableCell>
                            <TableCell>Cannot be deleted via API</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><strong>Tags</strong></TableCell>
                            <TableCell>✅ Yes</TableCell>
                            <TableCell>Deleted ones remain</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><strong>Webhooks</strong></TableCell>
                            <TableCell>✅ Yes</TableCell>
                            <TableCell>Cannot be migrated to a non-master environment</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><strong>API Keys</strong></TableCell>
                            <TableCell>❌ No</TableCell>
                            <TableCell>Must be created manually</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Backup Before Production Migration */}
            <Typography variant="h5" sx={{ mt: 4, mb: 2, color: "red" }}>
                ❗ Important: Create a Backup Before Migrating to Production!
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Before making changes to production, **always** create a backup.
                You can use our functionality or do it via Contentful CLI.
            </Typography>

            <Typography variant="h6" sx={{ mt: 2 }}>
                🔹 Creating a Backup Using Our Functionality!
            </Typography>

            <Typography variant="h6" sx={{ mt: 3 }}>
                🔹 Creating a Backup via Contentful CLI:
            </Typography>
            <Box component="pre" sx={{ backgroundColor: "#f4f4f4", p: 2, borderRadius: 2 }}>
                contentful space export --space-id YOUR_SPACE_ID --environment-id master --management-token YOUR_TOKEN --content-file full-backup.json
            </Box>

            <Typography sx={{ mt: 2 }}>
                📌 Full Guide:{" "}
                <a href="https://rohitgupta.netlify.app/import-and-export-data-with-contentful-cli" target="_blank" rel="noopener noreferrer">
                    Import and Export Data with Contentful CLI
                </a>
            </Typography>
        </Box>

    );
}

function InstallContentfulCLI() {
    return (
        <Box>
            {/* Title */}
            <Typography variant="h4" gutterBottom>
                🛠 Installing Contentful-CLI from Scratch
            </Typography>

            {/* Step 1: Open Terminal */}
            <Typography variant="h5" sx={{ mt: 3 }}>
                1️⃣ Open the Terminal
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Before installing anything, you need to open the terminal (command line interface) on your operating system:
            </Typography>
            <ul>
                <li><strong>Windows:</strong> Press <code>Win + R</code>, type <code>cmd</code>, and press Enter.</li>
                <li><strong>macOS:</strong> Open "Terminal" from Applications → Utilities or press <code>Cmd + Space</code> and type "Terminal".</li>
                <li><strong>Linux:</strong> Open "Terminal" from your application menu or press <code>Ctrl + Alt + T</code>.</li>
            </ul>

            {/* Step 2: Install Node.js */}
            <Typography variant="h5" sx={{ mt: 3 }}>
                2️⃣ Install Node.js (If Not Installed)
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Contentful CLI requires Node.js to run. Check if it's already installed by running:
            </Typography>
            <pre>{`node -v`}</pre>
            <Typography sx={{ mb: 2 }}>
                If you see a version number (e.g., <code>v18.16.0</code>), Node.js is already installed. If not, install it:
            </Typography>
            <ul>
                <li><strong>Windows & macOS:</strong> Download and install Node.js from <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer">nodejs.org</a>.</li>
                <li><strong>Linux (Debian/Ubuntu):</strong> Run:
                    <pre>{`sudo apt update && sudo apt install -y nodejs npm`}</pre>
                </li>
                <li><strong>Linux (Arch):</strong> Run:
                    <pre>{`sudo pacman -S nodejs npm`}</pre>
                </li>
            </ul>

            {/* Step 3: Install Contentful CLI */}
            <Typography variant="h5" sx={{ mt: 3 }}>
                3️⃣ Install Contentful CLI
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Once Node.js is installed, install Contentful CLI globally:
            </Typography>
            <pre>{`npm install -g contentful-cli`}</pre>

            {/* Step 4: Verify Installation */}
            <Typography variant="h5" sx={{ mt: 3 }}>
                4️⃣ Verify Installation
            </Typography>
            <Typography sx={{ mb: 2 }}>
                After installation, check if the CLI is working correctly by running:
            </Typography>
            <pre>{`contentful --version`}</pre>

            {/* Step 5: Login to Contentful */}
            <Typography variant="h5" sx={{ mt: 3 }}>
                5️⃣ Log in to Your Contentful Account
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Finally, log in to your Contentful account using:
            </Typography>
            <pre>{`contentful login`}</pre>

            <Typography sx={{ mt: 2 }}>
                Once logged in, you are ready to start using Contentful CLI! 🚀
            </Typography>
        </Box>

    );
}

function BackupGuide() {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                🚀 How Our Functionality Works
            </Typography>

            <Typography variant="h5" sx={{ mt: 3 }}>
                🔹 Full Migration (Standard Mode)
            </Typography>
            <Typography sx={{ mb: 2 }}>
                A full migration transfers all content from the donor environment to the target environment. This includes all
                Content Types, Entries, Assets, Locales, Webhooks, Tags, and other entities. If an entry already exists, it is updated.
                Deleted records from the donor environment are not removed in the target.
            </Typography>

            <Typography variant="h5" sx={{ mt: 3 }}>
                🔹 Advanced Migration (DIFF Mode)
            </Typography>
            <Typography sx={{ mb: 2 }}>
                The advanced migration mode only transfers new and changed entries by comparing the donor and target environments.
                This optimizes migration by avoiding redundant imports. Any modified content is updated, but deleted records are not removed.
                If a Content Type has changed, it must already exist in the target environment to ensure successful migration.
            </Typography>

            <Typography variant="h5" sx={{ mt: 3 }}>
                🔹 Restoring a Backup
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Backups allow you to restore an environment to a previous state. The system reads a stored backup file and imports
                it into the specified environment. This process restores missing or modified content but does not remove existing
                entries from the environment.
            </Typography>

            <Typography variant="h5" sx={{ mt: 3 }}>
                🔹 Creating a Backup
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Before making changes, it is recommended to create a backup. This process saves a snapshot of all content,
                including Content Types, Entries, Assets, and other entities. Backups are stored in a dedicated folder
                and can be restored at any time.
            </Typography>

            <Typography variant="h5" sx={{ mt: 3 }}>
                🔹 Deleting a Backup
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Old backups can be permanently removed if they are no longer needed. Once deleted, a backup cannot be restored,
                so ensure it is no longer required before proceeding.
            </Typography>

            <Typography variant="h4" sx={{ mt: 5 }} color="error">
                ⚠️ Important: Always Backup Before Migrating to Production
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Before migrating content to a production environment, always create a backup. You can use our built-in backup
                functionality or manually export data using Contentful CLI. This ensures that in case of any issues, you can
                restore your content to its previous state.
            </Typography>

            <Typography>
                For more details on how to perform manual exports, refer to the official guide:
                <a href="https://rohitgupta.netlify.app/import-and-export-data-with-contentful-cli" target="_blank">
                    Import and Export Data with Contentful CLI
                </a>.
            </Typography>
        </Box>

    );
}

function ErrorHandling() {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                ⚠️ Errors and Solutions
            </Typography>

            <Typography sx={{ mb: 2 }}>
                During content migration in Contentful, various issues can arise due to system limitations and content dependencies.
                Below is a list of common errors, possible causes, and recommended solutions.
            </Typography>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>🔴 Error</strong></TableCell>
                            <TableCell><strong>⚡ Cause</strong></TableCell>
                            <TableCell><strong>🛠 Solution</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>The content type could not be found</TableCell>
                            <TableCell>The Content Type does not exist in the target environment</TableCell>
                            <TableCell>Manually create the Content Type before migration</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Cannot delete locale</TableCell>
                            <TableCell>Locales cannot be deleted from an environment once created</TableCell>
                            <TableCell>Keep the locale or disable it manually in Contentful</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Asset already exists</TableCell>
                            <TableCell>An asset with the same ID is already present in the target environment</TableCell>
                            <TableCell>Delete the existing asset and retry the import</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Entry references missing</TableCell>
                            <TableCell>The entry being imported contains references to content that does not exist</TableCell>
                            <TableCell>Ensure all referenced entries are also migrated</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Failed to publish entry</TableCell>
                            <TableCell>The Content Type was modified, making some fields incompatible</TableCell>
                            <TableCell>Update the Content Type in the target environment before importing</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Typography variant="h4" gutterBottom>
                ✅ Expected Behavior for Different Cases
            </Typography>

            <Typography sx={{ mb: 2 }}>
                Below is a set of test cases describing how different entities behave during migration.
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>📌 Scenario</strong></TableCell>
                            <TableCell><strong>🔄 Expected Behavior</strong></TableCell>
                            <TableCell><strong>⚠️ Possible Issues</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>Migration of a Published Entry</TableCell>
                            <TableCell>The entry is migrated and remains published</TableCell>
                            <TableCell>None</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Migration of a Draft Entry</TableCell>
                            <TableCell>The entry is migrated but remains in Draft status</TableCell>
                            <TableCell>None</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Updating an existing Published Entry</TableCell>
                            <TableCell>The entry is updated with new content but remains unpublished</TableCell>
                            <TableCell>Manually publish the entry in the target environment</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Deletion of an Entry in Source Environment</TableCell>
                            <TableCell>The entry remains in the target environment (deletion is not synced)</TableCell>
                            <TableCell>Delete the entry manually if needed</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Migration of a new Content Type</TableCell>
                            <TableCell>The Content Type is created and all entries are migrated</TableCell>
                            <TableCell>Ensure Content Type is properly structured before migration</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Modification of a Content Type</TableCell>
                            <TableCell>The updated structure is migrated, but old entries remain unchanged</TableCell>
                            <TableCell>Manually update old entries to match the new structure</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Migration of Locales</TableCell>
                            <TableCell>New locales are added, but existing ones cannot be removed</TableCell>
                            <TableCell>Disable unused locales manually</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Asset Migration</TableCell>
                            <TableCell>Assets are transferred along with references</TableCell>
                            <TableCell>Duplicate assets need to be handled manually</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>

    );
}

function ProductionWarning() {
    return (
        <Box>
            <Typography variant="h4" color="error" gutterBottom>
                ⚠️ Warning: Create a Backup Before Migrating to Production!
            </Typography>
            <Typography>
                Before migrating data to the production environment, make sure to back up all environments.
            </Typography>
            <Typography>Follow the instructions:</Typography>
            <a href="https://rohitgupta.netlify.app/import-and-export-data-with-contentful-cli" target="_blank">
                How to Perform a Full Export and Import with Contentful CLI
            </a>
            <Typography>
                After creating the backup, proceed with the migration using the standard instructions.
            </Typography>
        </Box>

    );
}
