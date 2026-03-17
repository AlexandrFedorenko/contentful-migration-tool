const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.log("Usage: node scripts/set-admin.js <email>");
        console.log("--- Current Users ---");
        const users = await prisma.user.findMany();
        if (users.length === 0) {
            console.log("No users found in database yet. Please sign in via the app first.");
        } else {
            console.table(users.map(u => ({ id: u.id, email: u.email, role: u.role })));
        }
        return;
    }

    console.log(`Promoting ${email} to ADMIN...`);

    try {
        const user = await prisma.user.update({
            where: { email: email },
            data: { role: 'ADMIN' },
        });
        console.log(`Success! User ${user.email} is now an ADMIN.`);
    } catch (e) {
        if (e.code === 'P2025') {
            console.error(`Error: User with email '${email}' not found.`);
        } else {
            console.error(e);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
