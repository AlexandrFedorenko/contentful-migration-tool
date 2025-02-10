import { createClient } from "contentful-management";

const client = createClient({
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        console.log("🔍 Space list request...");

        const spaces = await client.getSpaces();
        const spaceList = spaces.items.map(space => ({
            id: space.sys.id,
            name: space.name,
        }));

        if (spaceList.length === 0) {
            return res.status(200).json({ spaces: [], message: "There are no spays available." });
        }

        console.log(`✅ Found ${spaceList.length} spaces.`);
        return res.status(200).json({ spaces: spaceList });

    } catch (error) {
        console.error("❌ Spaces loading error:", error?.message || error);
        return res.status(500).json({ error: "Error getting the list of spacers" });
    }
}
