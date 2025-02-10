import { createClient } from "contentful-management";

const client = createClient({
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { spaceId } = req.query;

    if (!spaceId) {
        return res.status(400).json({ error: "spaceId is mandatory" });
    }

    try {
        console.log(`🔍 Querying environments for spaceId: ${spaceId}`);

        const space = await client.getSpace(spaceId);
        if (!space) {
            return res.status(404).json({ error: "Space not found" });
        }

        const environments = await space.getEnvironments();
        const envList = environments.items.map(env => ({
            id: env.sys.id,
            name: env.name,
            createdAt: env.sys.createdAt
        }));

        if (envList.length === 0) {
            return res.status(200).json({ environments: [], message: "No environments available." });
        }

        console.log(`✅ Found ${envList.length} environments.`);
        return res.status(200).json({ environments: envList });

    } catch (error) {
        console.error("❌ Error loading environments:", error?.message || error);
        return res.status(500).json({ error: "Error receiving environments" });
    }
}
