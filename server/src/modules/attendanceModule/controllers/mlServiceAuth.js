// server/src/modules/attendanceModule/controllers/mlServiceAuth.js
//
// Attaches a shared-secret header to every outbound Node -> Python ML
// service request. Roughly 15 files build their own ML_SERVICE_URL constant
// independently (mlRoutes.js, instituteIdentificationRoutes.js, cameraController.js,
// etc. — some default to 'localhost:8500', others to '127.0.0.1:8500'), so
// rather than editing every call site this registers one axios interceptor,
// matched by host+port, on the shared axios module instance (require('axios')
// returns the same singleton everywhere in Node's module cache). The Python
// service checks the same header on every route except /health (see
// ml_service.py's require_shared_secret middleware) — without this, a
// request that skips Node entirely and hits the ML service's port directly
// would go unauthenticated.
const axios = require('axios');

const ML_SERVICE_SECRET = process.env.ML_SERVICE_SECRET || '';
const rawMlUrl = process.env.ML_SERVICE_URL || '';

let configuredHost = null;
let configuredPort = '8500';
if (rawMlUrl) {
    try {
        const parsed = new URL(rawMlUrl);
        configuredHost = parsed.hostname;
        configuredPort = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    } catch (_) {
        // malformed ML_SERVICE_URL — fall back to the localhost/127.0.0.1:8500 defaults below
    }
}
const ML_HOSTS = new Set(['localhost', '127.0.0.1', configuredHost].filter(Boolean));

if (!ML_SERVICE_SECRET) {
    console.warn('[MLServiceAuth] ML_SERVICE_SECRET is not set — requests to the Python ML service are unauthenticated.');
}

axios.interceptors.request.use((config) => {
    if (!ML_SERVICE_SECRET || !config.url) return config;
    try {
        const target = /^https?:\/\//i.test(config.url)
            ? new URL(config.url)
            : new URL(config.url, config.baseURL);
        if (ML_HOSTS.has(target.hostname) && target.port === configuredPort) {
            config.headers = { ...config.headers, 'X-ML-Service-Key': ML_SERVICE_SECRET };
        }
    } catch (_) {
        // not a parseable absolute URL (e.g. a relative path with no baseURL) — leave untouched
    }
    return config;
});

module.exports = { ML_SERVICE_SECRET };
