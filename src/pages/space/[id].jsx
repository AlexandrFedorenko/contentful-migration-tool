import {useCallback, useEffect, useState} from "react";
import { useRouter } from "next/router";
import {
    Container, Typography, Box, Paper, Grid, FormLabel,
    RadioGroup, FormControlLabel, Radio, Button, Switch, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider,
    Alert, IconButton, Tooltip, Dialog, DialogTitle, DialogActions
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function SpacePage() {
    const router = useRouter();
    const { id: spaceId } = router.query;

    const [donorEnvironments, setDonorEnvironments] = useState([]);
    const [targetEnvironments, setTargetEnvironments] = useState([]);
    const [backups, setBackups] = useState([]);
    const [selectedDonor, setSelectedDonor] = useState("");
    const [selectedTarget, setSelectedTarget] = useState("");
    const [selectedBackup, setSelectedBackup] = useState("");
    const [selectedRestoreTarget, setSelectedRestoreTarget] = useState("");
    const [selectedBackupEnv, setSelectedBackupEnv] = useState("");
    const [useAdvanced, setUseAdvanced] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [loadingBackup, setLoadingBackup] = useState(false);
    const [loadingRestore, setLoadingRestore] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [loadingMigration, setLoadingMigration] = useState(false);
    const [migrationDetails, setMigrationDetails] = useState(null);
    const [confirmMigrationOpen, setConfirmMigrationOpen] = useState(false);
    const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!spaceId) return;
        try {
            const envResponse = await fetch(`/api/environments?spaceId=${spaceId}`);
            const backupResponse = await fetch(`/api/backups?spaceId=${spaceId}`);

            if (!envResponse.ok || !backupResponse.ok) throw new Error("Data loading error");

            const envData = await envResponse.json();
            const backupData = await backupResponse.json();

            setDonorEnvironments(envData.environments || []);
            setTargetEnvironments(envData.environments || []);
            setBackups(backupData.backups || []);
        } catch (error) {
            console.error("❌ Download error:", error);
        }
    }, [spaceId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    async function handleDeleteBackup(backupName) {
        try {
            const response = await fetch("/api/deleteBackup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ spaceId, backupName })
            });

            if (response.ok) {
                setBackups((prev) => prev.filter(b => b.name !== backupName));
                setStatusMessage(`🗑️ Backup "${backupName}" successfully deleted!`);
                setAlertOpen(true);
            } else {
                throw new Error("Deletion error");
            }
        } catch (error) {
            setStatusMessage("❌ Error deleting backup");
            setAlertOpen(true);
        }
    }

    async function handleBackup() {
        if (!selectedBackupEnv) return alert("Select the environment to create the backup");

        setStatusMessage("");
        setLoadingBackup(true);

        try {
            const response = await fetch("/api/backup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ spaceId, env: selectedBackupEnv })
            });

            const result = await response.json();
            console.log("📤 API Response:", result);

            if (response.ok && result.success) {
                setStatusMessage("✅ The backup was successfully created!");
                setAlertOpen(true);
                fetchData();
            } else {
                throw new Error(result.error || "Backup creation error");
            }
        } catch (error) {
            console.error("❌ Error when creating a backup:", error);
            setStatusMessage("❌ Backup creation error");
            setAlertOpen(true);
        }

        setLoadingBackup(false);
    }

    async function handleRestore() {
        if (!selectedBackup || !selectedRestoreTarget) {
            alert("Choose a backup and an environment to restore to!");
            return;
        }

        setStatusMessage("");
        setLoadingRestore(true);

        try {
            const response = await fetch("/api/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ spaceId, backupFile: selectedBackup, targetEnvId: selectedRestoreTarget })
            });

            const result = await response.json();
            console.log("📥 API Restore Response:", result);

            if (response.ok && result.success) {
                setStatusMessage("✅ Recovery is complete!");
                setAlertOpen(true);
                fetchData();
            } else {
                throw new Error(result.error || "Recovery error");
            }
        } catch (error) {
            console.error("❌ Recovery error:", error);
            setStatusMessage("❌ Recovery error");
            setAlertOpen(true);
        }

        setLoadingRestore(false);
    }

    async function handleMigration() {
        if (!selectedDonor || !selectedTarget) {
            alert("Choose a donor and targeting environment!");
            return;
        }

        setStatusMessage("");
        setLoadingMigration(true);

        try {
            const response = await fetch("/api/migrate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    spaceId,
                    donorEnv: selectedDonor,
                    targetEnv: selectedTarget,
                    useAdvanced
                })
            });

            const result = await response.json();
            console.log("🚀 API Migration Response:", result);

            if (response.ok && result.success) {
                setStatusMessage("✅ Migration is complete!");
                setMigrationDetails(result);
                setAlertOpen(true);
                fetchData();
            } else {
                throw new Error(result.error || "Migration error");
            }
        } catch (error) {
            console.error("❌ Migration error:", error);
            setStatusMessage("❌ Migration error");
            setAlertOpen(true);
        }

        setLoadingMigration(false);
    }

    return (
        <Container sx={{ mt: 5 }}>
            <Typography variant="h4" textAlign="center">Space management</Typography>
            <Typography textAlign="center" sx={{ mt: 1 }}>Space ID: <strong>{spaceId}</strong></Typography>

            <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid item xs={6}>
                    <Paper sx={{ p: 3 }}>
                        <FormLabel>Choose a donor environment</FormLabel>
                        <RadioGroup value={selectedDonor} onChange={(e) => setSelectedDonor(e.target.value)}>
                            {donorEnvironments.map((env) => (
                                <FormControlLabel key={env.id} value={env.id} control={<Radio />} label={env.name} />
                            ))}
                        </RadioGroup>
                    </Paper>
                </Grid>

                <Grid item xs={6}>
                    <Paper sx={{ p: 3 }}>
                        <FormLabel>Select the target environment</FormLabel>
                        <RadioGroup value={selectedTarget} onChange={(e) => setSelectedTarget(e.target.value)}>
                            {targetEnvironments.map((env) => (
                                <FormControlLabel key={env.id} value={env.id} control={<Radio />} label={env.name} />
                            ))}
                        </RadioGroup>
                    </Paper>
                </Grid>
            </Grid>

            <Box textAlign="center" sx={{ mt: 2 }}>
                <FormControlLabel control={<Switch checked={useAdvanced} onChange={() => setUseAdvanced(!useAdvanced)} />} label="Use advanced mode" />
            </Box>

            <Box textAlign="center" sx={{ mt: 2 }}>
                <Button
                    variant="contained"
                    onClick={handleMigration}
                    disabled={!selectedDonor || !selectedTarget || loadingMigration}
                >
                    {loadingMigration ? "Migration..." : "Start migration"}
                </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box textAlign="center">
                <FormLabel>Select the environment to create the backup</FormLabel>
                <RadioGroup value={selectedBackupEnv} onChange={(e) => setSelectedBackupEnv(e.target.value)}>
                    {targetEnvironments.map((env) => (
                        <FormControlLabel key={env.id} value={env.id} control={<Radio />} label={env.name} />
                    ))}
                </RadioGroup>
            </Box>

            <Box textAlign="center" sx={{ mt: 2 }}>
                <Button
                    variant="contained"
                    onClick={handleBackup}
                    disabled={!selectedBackupEnv || loadingBackup}
                >
                    {loadingBackup ? "Creates..." : "Backup"}
                </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: "25px", mt: 2 }}>
                <FormLabel sx={{ whiteSpace: "nowrap" }}>Select a backup</FormLabel>
                <Select
                    value={selectedBackup}
                    onChange={(e) => setSelectedBackup(e.target.value)}
                    displayEmpty
                    sx={{ flexGrow: 1 }}
                >
                    <MenuItem value="" disabled>Select a backup</MenuItem>
                    {backups.length > 0 ? (
                        backups.map((backup) => (
                            <MenuItem key={backup.name} value={backup.name}>
                                {backup.name.replace(".json", "")}
                            </MenuItem>
                        ))
                    ) : (
                        <MenuItem disabled>No backups available</MenuItem>
                    )}
                </Select>
            </Box>

            <Box textAlign="center" sx={{ mt: 2 }}>
                <FormLabel>Select the environment to restore</FormLabel>
                <RadioGroup value={selectedRestoreTarget} onChange={(e) => setSelectedRestoreTarget(e.target.value)}>
                    {targetEnvironments.map((env) => (
                        <FormControlLabel key={env.id} value={env.id} control={<Radio />} label={env.name} />
                    ))}
                </RadioGroup>
            </Box>

            <Box textAlign="center" sx={{ mt: 2 }}>
                <Button
                    variant="contained"
                    onClick={handleRestore}
                    disabled={!selectedBackup || !selectedRestoreTarget || loadingRestore}
                >
                    {loadingRestore ? "Recovering..." : "Restore"}
                </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Delete</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {backups.length > 0 ? (
                            backups.map((backup) => (
                                <TableRow key={backup.name}>
                                    <TableCell>{backup.name.replace(".json", "")}</TableCell>
                                    <TableCell>{new Date(backup.time).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Tooltip title="Delete backup">
                                            <IconButton color="error" onClick={() => handleDeleteBackup(backup.name)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} align="center">No backups available</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={confirmMigrationOpen} onClose={() => setConfirmMigrationOpen(false)} disableRestoreFocus>
                <DialogTitle>Confirm migration?</DialogTitle>
                <DialogActions>
                    <Button onClick={() => setConfirmMigrationOpen(false)}>Cancel</Button>
                    <Button onClick={() => setConfirmMigrationOpen(false)}>OK</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={confirmRestoreOpen} onClose={() => setConfirmRestoreOpen(false)} disableRestoreFocus>
                <DialogTitle>Confirm recovery?</DialogTitle>
                <DialogActions>
                    <Button onClick={() => setConfirmRestoreOpen(false)}>Cancel</Button>
                    <Button onClick={() => setConfirmRestoreOpen(false)}>OK</Button>
                </DialogActions>
            </Dialog>

            {alertOpen && statusMessage && (
                <Alert
                    severity={statusMessage.includes("✅") ? "success" : "error"}
                    onClose={() => setAlertOpen(false)}
                    sx={{ position: "fixed", bottom: 20, right: 20 }}
                >
                    {statusMessage}
                </Alert>
            )}

            {migrationDetails && (
                <Box sx={{ mt: 4, p: 3, bgcolor: "#f3f3f3", borderRadius: 2 }}>
                    <Typography variant="h6">📊 Migration details</Typography>
                    <Typography>
                        {useAdvanced
                            ? `New entries added: ${migrationDetails.diffSize}`
                            : `Total records transferred: ${migrationDetails.diffSize}`
                        }
                    </Typography>
                </Box>
            )}
        </Container>
    );
}
