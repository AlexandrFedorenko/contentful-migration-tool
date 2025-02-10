import fs from "fs";
import path from "path";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { spaceId, env } = req.body;

    if (!spaceId || !env) {
        return res.status(400).json({ error: "spaceId and env are mandatory" });
    }

    try {
        console.log(`📤 Start exporting the environment: ${env}...`);

        const timestamp = new Date().toISOString().replace(/[-T:]/g, "_").split(".")[0]; // yyyy_MM_dd_HH_mm
        const fileName = `${spaceId}-${env}-${timestamp}.json`;

        const backupDir = path.join(process.cwd(), "backups", spaceId);
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const filePath = path.join(backupDir, fileName);

        const exportCommand = `contentful space export --space-id ${spaceId} --environment-id ${env} --management-token ${process.env.NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN} --content-file ${filePath}`;

        console.log(`🚀 Execute the command: ${exportCommand}`);
        await execPromise(exportCommand);

        console.log(`✅ The backup was successfully created: ${filePath}`);

        return res.status(200).json({
            success: true,
            backupFile: `${spaceId}/${fileName}`
        });

    } catch (error) {
        console.error("❌ Data export error:", error.message || error);
        return res.status(500).json({ error: "Data export error", details: error.message });
    }
}
