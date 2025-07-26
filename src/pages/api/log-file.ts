import type { NextApiRequest, NextApiResponse } from "next";
import * as fs from 'fs';
import * as path from 'path';

interface LogFileResponse {
  success?: boolean;
  content?: string;
  error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<LogFileResponse>
) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { fileName } = req.query;

    if (!fileName || typeof fileName !== 'string') {
        return res.status(400).json({ error: "File name is required" });
    }

    try {
        console.log("🔍 DEBUG: Requesting log file:", fileName);
        
        // Ищем файл в /app/ с указанным именем
        const appDir = '/app';
        const files = fs.readdirSync(appDir);
        console.log("🔍 DEBUG: Available files in /app/:", files);
        
        // Ищем файл лога, который содержит имя бэкапа
        const logFile = files.find(file => 
            file.includes('contentful-import-error-log') && 
            file.endsWith('.json')
        );
        
        if (!logFile) {
            console.log("🔍 DEBUG: No log file found");
            return res.status(404).json({ error: "Log file not found" });
        }
        
        const logFilePath = path.join(appDir, logFile);
        console.log("🔍 DEBUG: Reading log file:", logFilePath);
        
        const content = fs.readFileSync(logFilePath, 'utf8');
        const jsonContent = JSON.parse(content);
        
        // Форматируем JSON для читаемого отображения
        const formattedContent = JSON.stringify(jsonContent, null, 2);
        
        return res.status(200).json({ 
            success: true, 
            content: formattedContent 
        });
    } catch (error) {
        console.error("❌ Error reading log file:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to read log file';
        
        return res.status(500).json({ 
            success: false, 
            error: errorMessage
        });
    }
} 