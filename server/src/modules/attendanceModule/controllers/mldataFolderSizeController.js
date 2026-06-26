const fs = require("fs").promises;
const path = require("path");

async function getFolderTree(folderPath) {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });

    let totalSize = 0;
    const subfolders = [];
    let files = 0;

    for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);

        if (entry.isDirectory()) {
            const child = await getFolderTree(fullPath);
            subfolders.push(child);
            totalSize += child.size;
        } else {
            const stats = await fs.stat(fullPath);
            files += 1;
            totalSize += stats.size;
        }
    }

    return {
        name: path.basename(folderPath),
        size: totalSize,
        subfolders,
        files,
    };
}

module.exports = { getFolderTree }