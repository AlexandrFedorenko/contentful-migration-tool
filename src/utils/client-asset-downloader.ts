import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { BackupData, BackupAsset } from '@/types/backup';

export interface DownloadProgress {
    total: number;
    current: number;
    stage: 'initializing' | 'downloading' | 'zipping' | 'completed' | 'error';
    fileName?: string;
}

export const downloadAssetsClientSide = async (
    backup: BackupData,
    onProgress?: (progress: DownloadProgress) => void
): Promise<number> => {
    if (!backup.assets || backup.assets.length === 0) {
        onProgress?.({ total: 0, current: 0, stage: 'completed' });
        return 0;
    }

    const zip = new JSZip();
    const assetsFolder = zip.folder("assets");

    // Filter assets that have a file url in the default locale
    // In a real scenario we might want to check all locales or a specific one.
    // typically imports expect assets in a structure like assets/ID/filename
    // The backup structure from Contentful CLI usually puts them in:
    // assets/<assetId>/<locale>/<filename> OR just flat if simple.
    // Let's mimic what the Contentful CLI export does locally:
    // It usually creates a folder structure: `images.ctfassets.net/<spaceId>/<assetId>/<token>/<filename>`
    // BUT for import, the CLI expects a simpler structure or just mapping.
    // Let's look at how we implemented server-side zipping in `backup.ts`:
    // It zips the `assets` folder. Contentful CLI download-assets creates files locally.

    // Simpler approach for Restore compatibility:
    // The restore API expects a zip with an "assets" folder.
    // Inside it likely expects the files. 

    // Let's try to match the structure: assets/<id>/<locale>/<filename> 
    // This is the most safe structure.

    const assetsToDownload: Array<{ url: string; path: string }> = [];

    backup.assets.forEach((asset: BackupAsset) => {
        if (!asset.fields || !asset.fields.file) return;

        // Contentful asset file field structure is localized: { [locale]: { url, fileName, ... } }
        const fileField = asset.fields.file as Record<string, { url?: string; fileName?: string }>;

        Object.keys(fileField).forEach(locale => {
            const fileData = fileField[locale];
            if (fileData && fileData.url) {
                // url is usually like: //images.ctfassets.net/...
                let url = fileData.url;
                if (url.startsWith('//')) {
                    url = 'https:' + url;
                }

                // Clean filename
                const filename = fileData.fileName || 'asset';

                // Path inside zip: assets/<id>/<locale>/<filename>
                // This ensures unique paths for localized assets
                const path = `${asset.sys.id}/${locale}/${filename}`;

                assetsToDownload.push({ url, path });
            }
        });
    });

    const total = assetsToDownload.length;
    let current = 0;

    onProgress?.({ total, current: 0, stage: 'downloading' });

    // Concurrency limit
    const CONCURRENCY_LIMIT = 5;
    const chunks = [];

    for (let i = 0; i < total; i += CONCURRENCY_LIMIT) {
        chunks.push(assetsToDownload.slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const chunk of chunks) {
        await Promise.all(chunk.map(async (item) => {
            try {
                const response = await fetch(item.url);
                if (!response.ok) throw new Error(`Failed to fetch ${item.url}`);
                const blob = await response.blob();

                if (assetsFolder) {
                    assetsFolder.file(item.path, blob);
                }

                current++;
                onProgress?.({
                    total,
                    current,
                    stage: 'downloading',
                    fileName: item.path
                });
            } catch (error) {
                console.warn(`Failed to download asset ${item.path}:`, error);
                // We continue even if one fails
            }
        }));
    }

    onProgress?.({ total, current, stage: 'zipping' });

    // Add the backup JSON itself to the root of the zip as well? 
    // Usually "Export with assets" creates a zip containing:
    // 1. content-file.json
    // 2. assets/ folder
    // Let's do that to be 100% compatible with "Restore from Zip" flows if they expect both.

    // Add the JSON backup file
    // We don't have the original filename here easily, so let's call it content-export.json
    // Or we rely on the implementation to handle just the assets folder.
    // The restore page 'Upload Asset Zip' specifically asks for an ASSET zip.
    // So just the assets folder is fine for that specific upload input.

    // Generate ZIP
    const content = await zip.generateAsync({ type: "blob" });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilename = `contentful-assets-${timestamp}.zip`;

    saveAs(content, zipFilename);

    onProgress?.({ total, current, stage: 'completed' });

    return current;
};
