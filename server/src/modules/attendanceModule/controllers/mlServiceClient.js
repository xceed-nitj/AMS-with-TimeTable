const axios = require('axios');

const configuredMlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const ML_SERVICE_URL = /^https?:\/\//i.test(configuredMlUrl)
    ? configuredMlUrl
    : `http://${configuredMlUrl}`;

function getTargetInfo() {
    try {
        const parsed = new URL(ML_SERVICE_URL);
        const host = parsed.hostname;
        const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
        const normalizedHost = host.toLowerCase();
        const isLocal = ['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(normalizedHost);
        const isH100 = /^10\.10\./.test(normalizedHost);

        return {
            kind: isH100 ? 'h100' : (isLocal ? 'local' : 'remote'),
            label: isH100 ? 'H100' : (isLocal ? 'Local ML service' : 'Remote ML service'),
            host,
            port,
            display: `${host}:${port}`,
        };
    } catch (_) {
        return {
            kind: 'unknown',
            label: 'ML service',
            host: 'unknown',
            port: '',
            display: ML_SERVICE_URL,
        };
    }
}

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

module.exports = { healthCheck, waitForService, reloadEmbeddings, getTargetInfo };
