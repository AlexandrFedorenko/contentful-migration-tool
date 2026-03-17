import type { NextApiRequest, NextApiResponse } from 'next';

import { generateMigrationCode } from '@/utils/code-generator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { spaceId, targetEnv, contentType, steps } = req.body;

    if (!spaceId || !targetEnv || !contentType || !steps || !Array.isArray(steps)) {
        return res.status(400).json({
            valid: false,
            error: 'Missing required parameters or invalid steps'
        });
    }

    try {
        const migrationCode = generateMigrationCode(steps, '');
        // Validate JavaScript syntax
        try {
            new Function(migrationCode);
        } catch (syntaxError: unknown) {
            const msg = syntaxError instanceof Error ? syntaxError.message : String(syntaxError);
            return res.status(400).json({
                valid: false,
                error: `Syntax error: ${msg}`
            });
        }

        // Simulate migration (without actually running it)
        // In a real implementation, you would:
        // 1. Parse the migration code
        // 2. Fetch entries from Contentful
        // 3. Count how many would be affected
        // 4. Check for potential issues

        const warnings: string[] = [];

        // Basic validation
        if (!migrationCode.includes('migration.')) {
            warnings.push('Migration code should use the "migration" object');
        }

        if (migrationCode.includes('transformEntries') && !migrationCode.includes('contentType:')) {
            warnings.push('transformEntries should specify a contentType');
        }

        // Simulate entry count (in real implementation, fetch from API)
        const affectedEntries = Math.floor(Math.random() * 100) + 1;
        const estimatedTime = `${Math.ceil(affectedEntries / 10)} seconds`;

        res.json({
            success: true,
            data: {
                valid: true,
                affectedEntries,
                estimatedTime,
                warnings
            }
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({
            valid: false,
            error: msg || 'Failed to preview migration'
        });
    }
}
