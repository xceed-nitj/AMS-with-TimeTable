const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';

async function healthCheck() {
    const res = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    return res.data;
}

async function waitForService(maxWaitSec = 60) {
    const start = Date.now();
    while (Date.now() - start < maxWaitSec * 1000) {
        try {
            const h = await healthCheck();
            console.log(`[ML] Service ready - ${h.students_enrolled} students`);
            return h;
        } catch { await new Promise(r => setTimeout(r, 3000)); }
    }
    throw new Error(`ML service unavailable after ${maxWaitSec}s`);
}

async function reloadEmbeddings() {
    const res = await axios.post(`${ML_SERVICE_URL}/reload-embeddings`);
    return res.data;
}

module.exports = { healthCheck, waitForService, reloadEmbeddings };