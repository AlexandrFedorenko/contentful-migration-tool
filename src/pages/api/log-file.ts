import type { NextApiRequest, NextApiResponse } from "next";
import * as fs from 'fs';
import * as path from 'path';

interface LogFileResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<LogFileResponse>
) {
    if (req.method !== "GET") {
        return res.status(405).json({ 
            success: false,
            error: "Method not allowed" 
        });
    }

    try {
        const appDir = process.cwd();
        const files = fs.readdirSync(appDir);
        
        const logFile = files.find(file => 
            file.includes('contentful-import-error-log') && 
            file.endsWith('.json')
        );
        
        if (!logFile) {
            return res.status(404).json({ 
                success: false,
                error: "Log file not found" 
            });
        }
        
        const logFilePath = path.join(appDir, logFile);
        const content = fs.readFileSync(logFilePath, 'utf8');
        const jsonContent = JSON.parse(content);
        const formattedContent = JSON.stringify(jsonContent, null, 2);
        
        return res.status(200).json({ 
            success: true, 
            content: formattedContent 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to read log file'
        });
    }
} 