import fs from "fs";
import path from "path";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("📢 Migration request received:", req.body);
    const { spaceId, donorEnv, targetEnv, useAdvanced } = req.body;

    if (!spaceId || !donorEnv || !targetEnv) {
        console.error("❌ Error: missing parameters");
        return res.status(400).json({ error: "Migration parameters are not specified" });
    }

    try {
        console.log(`🔍 Connecting to space: ${spaceId}`);

        const backupDir = path.join(process.cwd(), "backups", spaceId);
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[-T:]/g, "_").split(".")[0];

        const donorBackupFile = `${spaceId}-${donorEnv}-${timestamp}.json`;
        const targetBackupFile = `${spaceId}-${targetEnv}-${timestamp}.json`;
        const diffBackupFile = `${spaceId}-DIFF-${donorEnv}-to-${targetEnv}-${timestamp}.json`;

        const donorBackupPath = path.join(backupDir, donorBackupFile);
        const targetBackupPath = path.join(backupDir, targetBackupFile);
        const diffBackupPath = path.join(backupDir, diffBackupFile);

        // 🔹 1️⃣ **Create a backup of the donor (including everything)**
        console.log(`📤 Create a backup of the environment: ${donorEnv}`);
        const donorExportCmd = `contentful space export --space-id ${spaceId} --environment-id ${donorEnv} --management-token ${process.env.NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN} --content-file "${donorBackupPath}" --include-drafts --include-content-types --include-assets --include-webhooks --include-locales`;
        await execPromise(donorExportCmd);
        console.log(`✅ The donor's backup is intact: ${donorBackupPath}`);

        // 🔹 2️⃣ **Create a backup of the target environment (including everything)**
        console.log(`📤 Create a backup of the environment: ${targetEnv}`);
        const targetExportCmd = `contentful space export --space-id ${spaceId} --environment-id ${targetEnv} --management-token ${process.env.NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN} --content-file "${targetBackupPath}" --include-drafts --include-content-types --include-assets --include-webhooks --include-locales`;
        await execPromise(targetExportCmd);
        console.log(`✅ The backup of the target environment has been saved: ${targetBackupPath}`);

        let diffData = {};

        // 🔹 3️⃣ **Create DIFF automatically**
        if (useAdvanced) {
            console.log("🔍 Analyzing data to create a DIFF...");

            // Reading JSON files
            const donorData = JSON.parse(fs.readFileSync(donorBackupPath, "utf-8"));
            const targetData = JSON.parse(fs.readFileSync(targetBackupPath, "utf-8"));

            // **Identify all possible keys in the data**
            const allKeys = new Set([...Object.keys(donorData), ...Object.keys(targetData)]);

            allKeys.forEach((key) => {
                if (Array.isArray(donorData[key])) {
                    // Get IDs of objects that exist in the donor
                    const donorIds = new Set(donorData[key].map((item) => item.sys?.id || item.code));
                    const targetIds = new Set((targetData[key] || []).map((item) => item.sys?.id || item.code));

                    // Filter only new items
                    diffData[key] = donorData[key].filter((item) => !targetIds.has(item.sys?.id || item.code));
                }
            });

            fs.writeFileSync(diffBackupPath, JSON.stringify(diffData, null, 2));
            console.log(`✅ DIFF file created: ${diffBackupPath}`);
        }

        // 🔹 4️⃣ **Importing Content Types before records**
        console.log(`📥 Importing Content Types into the environment: ${targetEnv}...`);
        const importCTCommand = `contentful space import --space-id ${spaceId} --environment-id ${targetEnv} --management-token ${process.env.NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN} --content-file "${donorBackupPath}" --content-only --skip-content --include-content-types`;
        await execPromise(importCTCommand);
        console.log("✅ Content Types have been imported!");

        // 🔹 5️⃣ **Import DIFF into target environment and parse statistics**
        console.log(`📥 Importing data from a file: ${diffBackupPath} encircled: ${targetEnv}...`);
        const { stdout } = await execPromise(`contentful space import --space-id ${spaceId} --environment-id ${targetEnv} --management-token ${process.env.NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN} --content-file "${diffBackupPath}"`);

        console.log("✅ DIFF import is complete!");

        // 🔥 **Parsing statistics**
        const statistics = parseImportStatistics(stdout);
        console.log("📊 Import statistics:", statistics);

        return res.status(200).json({
            success: true,
            message: "Migration complete!",
            diffSize: Object.entries(diffData).reduce((sum, [key, arr]) => sum + arr.length, 0),
            statistics
        });

    } catch (error) {
        console.error("❌ Migration error:", error);
        return res.status(500).json({ error: "Migration error", details: error.message });
    }
}

// ✅ **Statistics parsing function**
function parseImportStatistics(logs) {
    const stats = {};
    const regex = /│ ([A-Za-z\s]+)\s+│\s+(\d+)\s+│/g;
    let match;
    while ((match = regex.exec(logs)) !== null) {
        stats[match[1].trim()] = parseInt(match[2], 10);
    }
    return stats;
}
