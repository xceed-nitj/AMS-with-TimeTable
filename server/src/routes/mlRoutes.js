const express = require('express');
const router = express.Router();
const mlClient = require('../ml/mlServiceClient');
const { processVideoFile } = require('../ml/videoWatcher');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const upload = multer({ dest: path.join(__dirname, '../../../temp_uploads/') });

router.get('/health', async (req, res) => {
    try { res.json(await mlClient.healthCheck()); }
    catch (e) { res.status(503).json({ status: 'unreachable' }); }
});

router.post('/process-video', async (req, res) => {
    const { videoPath } = req.body;
    if (!videoPath) return res.status(400).json({ error: 'videoPath required' });
    try { res.json(await processVideoFile(videoPath)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/reload-embeddings', async (req, res) => {
    try { res.json(await mlClient.reloadEmbeddings()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/live-video', upload.single('video'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });
    try {
        const videoPath = req.file.path;
        console.log(`[ML Live] Processing live chunk: ${videoPath}`);
        // Send to ML service. We use minDetections: 1 because it's a short 7-second chunk.
        const result = await mlClient.processVideo(videoPath, {
            threshold: 0.45,
            frameSkip: 10,
            minDetections: 1 
        });
        
        // Clean up temp file
        fs.unlink(videoPath, (err) => {
            if (err) console.error(`[ML Live] Failed to delete temp file: ${videoPath}`);
        });

        res.json(result);
    } catch (e) {
        if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
        res.status(500).json({ error: e.message });
    }
});

router.post('/enroll', upload.single('photo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No photo provided' });
    try {
        const studentDir = path.join(__dirname, '../../../client/public/ground-truth/9999_Test_User');
        if (!fs.existsSync(studentDir)) {
            fs.mkdirSync(studentDir, { recursive: true });
        }
        const destPath = path.join(studentDir, `photo_${Date.now()}.jpg`);
        fs.renameSync(req.file.path, destPath);
        
        console.log(`[ML Enroll] Saved photo to ${destPath}`);
        console.log(`[ML Enroll] Rebuilding embeddings database...`);
        
        const cmd = 'bash -c "cd ../python-ml-service && source venv/bin/activate && python build_embeddings_db.py --photos-dir ../client/public/ground-truth --output ./embeddings_db.pkl"';
        exec(cmd, async (error, stdout, stderr) => {
            if (error) {
                console.error(`[ML Enroll] DB Build Error: ${error.message}`);
                return res.status(500).json({ error: 'Failed to build embeddings database' });
            }
            console.log(`[ML Enroll] Build output: ${stdout}`);
            try {
                await mlClient.reloadEmbeddings();
                console.log(`[ML Enroll] Embeddings reloaded successfully.`);
                res.json({ success: true, message: 'Enrollment complete!' });
            } catch (err) {
                res.status(500).json({ error: 'Failed to hot reload python service' });
            }
        });
    } catch (e) {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
