import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'cross-spawn';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import crypto from 'crypto';
import { generateMigrationCode } from '@/utils/code-generator';
import { logger } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { spaceId, environmentId, steps } = req.body;

    if (!spaceId || !environmentId || !steps || !Array.isArray(steps)) {
        return res.status(400).json({ success: false, error: 'Missing or invalid parameters. Expected steps array.' });
    }


    // Set response headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
        res.write(`data: ${JSON.stringify({ message, type })}\n\n`);
    };

    try {
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user || !user.contentfulToken) {
            sendLog('Authentication required', 'error');
            res.end();
            return;
        }

        const token = decrypt(user.contentfulToken);

        // define temp dir
        const tempDir = os.tmpdir();
        const tempFileId = crypto.randomUUID();
        const tempFilePath = path.join(tempDir, `migration-${tempFileId}.js`);

        // Generate migration code from trusted JSON blocks
        sendLog('Generating secure migration script from visual blocks...', 'info');
        const code = generateMigrationCode(steps, '');

        // Write migration code to temp file
        fs.writeFileSync(tempFilePath, code);
        sendLog(`Script generated and saved to temp sandbox: ${tempFilePath}`, 'info');

        await logger.info('VISUAL_MIGRATE_START', `Starting visual migration to environment ${environmentId}`, { spaceId, environmentId, stepsCount: steps.length }, { id: user.id, email: user.email });


        // Run contentful migration CLI
        // contentful space migration --space-id <spaceId> --environment-id <environmentId> <filePath> --usage-token <token>
        const args = [
            'space', 'migration',
            '--space-id', spaceId,
            '--environment-id', environmentId,
            '--management-token', token,
            tempFilePath,
            '--yes' // Non-interactive mode
        ];

        sendLog(`Executing migration command...`, 'info');

        const migrationProcess = spawn('contentful', args, {
            env: { ...process.env, PATH: process.env.PATH, CONTENTFUL_MANAGEMENT_TOKEN: token } // Ensure PATH is passed
        });

        if (migrationProcess.stdout) {
            migrationProcess.stdout.on('data', (data) => {
                const text = data.toString().trim();
                if (text) sendLog(text, 'info');
            });
        }

        if (migrationProcess.stderr) {
            migrationProcess.stderr.on('data', (data) => {
                const text = data.toString().trim();
                if (text) sendLog(text, 'info'); // Many tools write info to stderr
            });
        }

        migrationProcess.on('error', (err) => {
            console.error('Failed to start migration process:', err);
            sendLog(`Process failed to start: ${err.message}`, 'error');
            // 'close' event might not fire if it fails to spawn
            try {
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            } catch { }
            res.end();
        });

        migrationProcess.on('close', async (code) => {
            // Clean up temp file
            try {
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            } catch (e) {
                console.error('Failed to cleanup temp file', e);
            }

            if (code === 0) {
                await logger.info('VISUAL_MIGRATE_SUCCESS', `Visual migration completed successfully to ${environmentId}`, { spaceId, environmentId }, { id: user.id, email: user.email });
                sendLog('Migration completed successfully!', 'success');
                res.end();
            } else {
                const cliErrorContent = await logger.captureCliError();
                await logger.error('VISUAL_MIGRATE_ERROR', `Visual migration failed with exit code ${code}`, { spaceId, environmentId, cliErrorLog: cliErrorContent ? JSON.parse(cliErrorContent) : undefined }, { id: user.id, email: user.email });
                sendLog(`Migration failed with exit code ${code}`, 'error');
                res.end();
            }
        });

    } catch (error) {
        sendLog(`Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        res.end();
    }
}
