import fs from "fs";
import path from "path";

export default function handler(req, res) {
    const { spaceId } = req.query;

    if (!spaceId) {
        return res.status(400).json({ error: "spaceId is mandatory" });
    }

    try {
        const backupDir = path.join(process.cwd(), "backups", spaceId);

        if (!fs.existsSync(backupDir)) {
            console.log(`📂 Backup directory ${backupDir} not found.`);
            return res.status(200).json({ backups: [] });
        }

        const backups = fs.readdirSync(backupDir)
            .filter(file => file.endsWith(".json"))
            .map(file => {
                const filePath = path.join(backupDir, file);
                try {
                    return {
                        name: file,
                        time: fs.statSync(filePath).mtime.getTime()
                    };
                } catch (err) {
                    console.warn(`⚠️ File read error ${file}:`, err);
                    return null;
                }
            })
            .filter(Boolean) // Exclude files with errors
            .sort((a, b) => b.time - a.time); // Sorted by date (new above)

        console.log(`✅ Found ${backups.length} backups for spaceId: ${spaceId}`);

        return res.status(200).json({ backups });
    } catch (error) {
        console.error("❌ Error loading backups:", error);
        return res.status(500).json({ error: "Error reading backups" });
    }
}
