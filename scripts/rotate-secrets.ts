/**
 * Re-encrypt stored Contentful tokens with the current ENCRYPTION_KEY.
 *
 * Use after rotating the key (set the old one as ENCRYPTION_KEY_PREVIOUS) or after
 * upgrading from the legacy scheme (set LEGACY_ENCRYPTION_SECRET to the old
 * CLERK_SECRET_KEY). Safe to run repeatedly.
 *
 *   npm run secrets:rotate
 */
import { prisma } from '@/lib/db';
import { decrypt, needsReencryption } from '@/lib/encryption';
import { encryptToken, tokenAad } from '@/server/contentful/credentials';

async function main() {
    const rows = await prisma.contentfulToken.findMany({ select: { id: true, userId: true, token: true } });
    let rotated = 0;
    let failed = 0;
    for (const row of rows) {
        if (!needsReencryption(row.token)) continue;
        try {
            // Legacy rows were written without AAD; v2 rows with it.
            const plain = row.token.startsWith('v2.') ? decrypt(row.token, tokenAad(row.userId)) : decrypt(row.token);
            await prisma.contentfulToken.update({ where: { id: row.id }, data: { token: encryptToken(row.userId, plain) } });
            rotated++;
        } catch (e) {
            failed++;
            console.error(`Token ${row.id}: ${(e as Error).message}`);
        }
    }
    console.log(`Checked ${rows.length} tokens: re-encrypted ${rotated}, failed ${failed}.`);
    if (failed > 0) process.exitCode = 1;
}

main().finally(() => prisma.$disconnect());
