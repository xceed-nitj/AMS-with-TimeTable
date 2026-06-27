const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

const ROOT_DIR = path.join(__dirname,"../../../../ml-data");

async function getFolderTree(folderPath) {
    const entries = await fsp.readdir(folderPath, { withFileTypes: true });

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
            const stats = await fsp.stat(fullPath);
            files += 1;
            totalSize += stats.size;
        }
    }

    return {
        name: path.basename(folderPath),
        size: totalSize,
        relativePath: path.relative(ROOT_DIR, folderPath).replace(/\\/g,"/"),
        subfolders,
        files,
    };
}

function resolveSafePath(relativePath = "") {
    const resolvedPath = path.resolve(ROOT_DIR, relativePath);

    if (!resolvedPath.startsWith(ROOT_DIR)) {
        throw new Error("Invalid path");
    }

    return resolvedPath;
}

async function getFilesWithPagination(req, res) {
    try {
        const {
            folder = "",
            page = 1,
            limit = 50,
        } = req.query;

        const folderPath = resolveSafePath(folder);

        const entries = await fsp.readdir(folderPath, {
            withFileTypes: true,
        });

        const files = entries.filter(entry => entry.isFile());

        const totalFiles = files.length;

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        const start = (pageNumber - 1) * pageSize;
        const end = start + pageSize;

        const paginatedFiles = files.slice(start, end);

        const result = await Promise.all(
            paginatedFiles.map(async (file) => {
                const fullPath = path.join(folderPath, file.name);
                const stats = await fsp.stat(fullPath);

                return {
                    filename: file.name,
                    size: stats.size,
                    modified: stats.mtime,
                    relativePath: path
                        .relative(ROOT_DIR, fullPath)
                        .replace(/\\/g, "/"),
                };
            })
        );

        res.json({
            totalFiles,
            page: pageNumber,
            pageSize,
            hasMore: end < totalFiles,
            files: result,
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Unable to fetch files",
        });
    }
}
async function streamFile(req, res) {
    try {
        const relativePath = req.query.path;

        if (!relativePath) {
            return res.status(400).json({
                message: "File path is required",
            });
        }

        const filePath = resolveSafePath(relativePath);

        const stats = await fsp.stat(filePath);

        if (!stats.isFile()) {
            return res.status(404).json({
                message: "File not found",
            });
        }
        res.type(path.extname(filePath));
        res.setHeader("Content-Length", stats.size);

        const stream = fs.createReadStream(filePath);

        stream.on("error", (err) => {
            console.error(err);

            if (!res.headersSent) {
                res.status(500).end();
            }
        });

        stream.pipe(res);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Unable to stream file",
        });
    }
}

module.exports = {
    getFolderTree,
    getFilesWithPagination,
    streamFile,
};