import { exec } from "child_process";
import util from "util";
import fs from "fs";
import path from "path";
import { createClient } from "contentful-management";

const execPromise = util.promisify(exec);
const client = createClient({
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("📥 Backup restore request received:", req.body);
    const { spaceId, backupFile, targetEnvId } = req.body;

    if (!spaceId || !targetEnvId || !backupFile) {
        console.error("❌ Error: missing parameters");
        return res.status(400).json({ error: "No recovery parameters specified" });
    }

    try {
        console.log(`🔍 Connecting to space: ${spaceId}`);
        const space = await client.getSpace(spaceId);

        let targetEnv;
        try {
            targetEnv = await space.getEnvironment(targetEnvId);
            console.log(`✅ Environment '${targetEnvId}' found.`);
        } catch (error) {
            if (error.status === 404) {
                console.log(`⚠️ Environment '${targetEnvId}' not found. Create a new one...`);
                targetEnv = await space.createEnvironmentWithId(targetEnvId, { name: `Restored from backup` });
                console.log(`✅ Environment '${targetEnvId}' created!`);

                console.log(`⏳ Waiting for the environment '${targetEnvId}' become available...`);
                await new Promise(resolve => setTimeout(resolve, 20000));
            } else {
                throw error;
            }
        }

        const backupFilePath = path.join(process.cwd(), "backups", spaceId, backupFile);
        if (!fs.existsSync(backupFilePath)) {
            console.error(`❌ Error: Backup file ${backupFile} not found!`);
            return res.status(404).json({ error: `Backup file ${backupFile} not found!` });
        }

        console.log(`📥 Importing data from a file: ${backupFilePath} encircled: ${targetEnvId}...`);

        const importCommand = `contentful space import --space-id ${spaceId} --environment-id ${targetEnvId} --management-token ${process.env.NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN} --content-file ${backupFilePath}`;
        console.log(`🚀 Execute the command: ${importCommand}`);

        await execPromise(importCommand);
        console.log("✅ Import completed!");

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("❌ Recovery error:", error);
        return res.status(500).json({ error: error.message });
    }
}
