const cron = require('node-cron');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const ML_DATA_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data');
const UNKNOWN_FACES_DIR = path.join(ML_DATA_DIR, 'unknown_faces');
const SETTINGS_FILE = path.join(UNKNOWN_FACES_DIR, 'settings.json');

const DEFAULT_SETTINGS = {
    retentionDays: 90,
    autoCleanupEnabled: true,
    preserveReviewed: true
};

async function getSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = await fsPromises.readFile(SETTINGS_FILE, 'utf8');
            return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
        }
    } catch (err) {
        console.error('Error reading unknown faces settings:', err);
    }
    return DEFAULT_SETTINGS;
}

async function saveSettings(settings) {
    if (!fs.existsSync(UNKNOWN_FACES_DIR)) {
        fs.mkdirSync(UNKNOWN_FACES_DIR, { recursive: true });
    }
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await fsPromises.writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2));
    return updated;
}

// Helper to recursively find all metadata.json files
async function findClusters(dir, results = []) {
    if (!fs.existsSync(dir)) return results;
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name.startsWith('cluster_')) {
                results.push(fullPath);
            } else {
                await findClusters(fullPath, results);
            }
        }
    }
    return results;
}

async function runCleanup() {
    const settings = await getSettings();
    if (!settings.autoCleanupEnabled) return;

    console.log('[UnknownFaceCleanup] Starting cleanup job...');
    const now = Date.now();
    const cutoffDate = now - (settings.retentionDays * 24 * 60 * 60 * 1000);

    const clusterPaths = await findClusters(UNKNOWN_FACES_DIR);

    for (const cPath of clusterPaths) {
        try {
            const metaPath = path.join(cPath, 'metadata.json');
            if (!fs.existsSync(metaPath)) continue;

            const meta = JSON.parse(await fsPromises.readFile(metaPath, 'utf8'));
            const created = new Date(meta.createdAt).getTime();

            if (created < cutoffDate) {
                if (settings.preserveReviewed && meta.status === 'REVIEWED') {
                    continue;
                }
                await fsPromises.rm(cPath, { recursive: true, force: true });
                console.log(`[UnknownFaceCleanup] Deleted expired cluster: ${meta.clusterId}`);
            }
        } catch (err) {
            console.error(`[UnknownFaceCleanup] Error processing ${cPath}:`, err.message);
        }
    }
    console.log('[UnknownFaceCleanup] Cleanup job finished.');
}

function startUnknownFaceCleanupScheduler() {
    // Run once a month on the 1st at 2:00 AM
    cron.schedule('0 2 1 * *', runCleanup);
}

module.exports = {
    startUnknownFaceCleanupScheduler,
    getSettings,
    saveSettings,
    runCleanup
};
