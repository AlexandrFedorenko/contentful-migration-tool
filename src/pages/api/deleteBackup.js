import fs from "fs";
import path from "path";

export default function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { spaceId, backupName } = req.body;

    if (!spaceId || !backupName) {
        return res.status(400).json({ error: "spaceId and backupName are mandatory" });
    }

    try {
        const backupPath = path.join(process.cwd(), "backups", spaceId, backupName);

        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({ error: "Backup not found" });
        }

        fs.unlinkSync(backupPath);
        console.log(`🗑️ Backup deleted: ${backupPath}`);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ Error deleting backup:", error);
        return res.status(500).json({ error: "File deletion error" });
    }
}
