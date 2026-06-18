const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const JSZip = require('jszip');
const AttendanceReport = require('../../../models/attendanceReport');

const ML_DATA_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data');
const UNKNOWN_FACES_DIR = path.join(ML_DATA_DIR, 'unknown_faces');
const GROUND_TRUTH_DIR = path.join(ML_DATA_DIR, 'ground_truth');

async function saveToGroundTruth(meta, fullClusterPath, rollNo) {
    if (!meta.degree || !meta.department || !meta.year || !rollNo) return;
    const batchFolder = `${meta.degree}_${meta.department}_${meta.year}`.toUpperCase();
    const gtStudentDir = path.join(GROUND_TRUTH_DIR, batchFolder, rollNo);
    if (!fs.existsSync(gtStudentDir)) {
        await fsPromises.mkdir(gtStudentDir, { recursive: true });
    }
    const clusterFiles = await fsPromises.readdir(fullClusterPath);
    const jpgFiles = clusterFiles.filter(f => f.endsWith('.jpg'));
    
    for (const jpg of jpgFiles) {
        const srcPath = path.join(fullClusterPath, jpg);
        const destName = `unk_${meta.clusterId || 'unknown'}_${jpg}`;
        const destPath = path.join(gtStudentDir, destName);
        if (!fs.existsSync(destPath)) {
            await fsPromises.copyFile(srcPath, destPath);
        }
    }
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

const unknownFaceController = {
    // GET /api/attendance/unknown-faces
    async getAll(req, res) {
        try {
            const clusterPaths = await findClusters(UNKNOWN_FACES_DIR);
            let clusters = [];

            for (const cPath of clusterPaths) {
                const metaPath = path.join(cPath, 'metadata.json');
                if (fs.existsSync(metaPath)) {
                    try {
                        const meta = JSON.parse(await fsPromises.readFile(metaPath, 'utf8'));
                        // Attach the directory path relative to UNKNOWN_FACES_DIR so the frontend can reference it
                        meta.clusterPath = path.relative(UNKNOWN_FACES_DIR, cPath).replace(/\\/g, '/');
                        
                        const files = await fsPromises.readdir(cPath);
                        meta.images = files.filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
                        
                        clusters.push(meta);
                    } catch (e) {
                        console.error('Error parsing metadata:', e.message);
                    }
                }
            }

            // Apply Filters (Date, Degree, Department, Year, Subject, Room, Camera, Slot, Status)
            const { date, degree, department, year, subjectCode, room, cameraId, slot, status } = req.query;
            
            if (date) clusters = clusters.filter(c => (c.date && c.date === date) || (c.createdAt && c.createdAt.startsWith(date)));
            if (degree) clusters = clusters.filter(c => c.degree && c.degree.toUpperCase() === degree.toUpperCase());
            if (department) clusters = clusters.filter(c => c.department && c.department.toUpperCase() === department.toUpperCase());
            if (year) clusters = clusters.filter(c => c.year === year);
            if (subjectCode) clusters = clusters.filter(c => c.subjectCode && c.subjectCode.toUpperCase() === subjectCode.toUpperCase());
            if (room) clusters = clusters.filter(c => c.room && c.room.toUpperCase() === room.toUpperCase());
            if (cameraId) clusters = clusters.filter(c => c.cameraId === cameraId);
            if (slot) clusters = clusters.filter(c => c.slot === slot);
            if (status) clusters = clusters.filter(c => c.status && c.status.toUpperCase() === status.toUpperCase());

            // Calculate Statistics
            let totalClusters = clusters.length;
            let newToday = clusters.filter(c => c.status === 'NEW' && c.createdAt.startsWith(new Date().toISOString().split('T')[0])).length;
            let reviewedCount = clusters.filter(c => c.status === 'REVIEWED').length;
            let archivedCount = clusters.filter(c => c.status === 'ARCHIVED').length;
            let avgConfidence = clusters.length > 0 ? (clusters.reduce((acc, c) => acc + (c.bestSimilarity || 0), 0) / clusters.length).toFixed(2) : 0;

            // Sort by newest first
            clusters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            res.json({
                success: true,
                clusters,
                stats: {
                    totalClusters,
                    newToday,
                    reviewedCount,
                    archivedCount,
                    avgConfidence: parseFloat(avgConfidence)
                }
            });

        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // GET /api/attendance/unknown-faces/image/:path(*)/:imageName
    async getImage(req, res) {
        try {
            const imagePath = req.params[0];
            const fullPath = path.join(UNKNOWN_FACES_DIR, imagePath);
            
            if (!fs.existsSync(fullPath)) {
                return res.status(404).send('Image not found');
            }
            res.sendFile(fullPath);
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // PUT /api/attendance/unknown-faces/cluster/:path(*)/status
    async updateStatus(req, res) {
        try {
            const clusterPath = req.params[0];
            const { status } = req.body;
            
            if (!['NEW', 'REVIEWED', 'ARCHIVED'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }

            const fullPath = path.join(UNKNOWN_FACES_DIR, clusterPath);
            const metaPath = path.join(fullPath, 'metadata.json');

            if (!fs.existsSync(metaPath)) {
                return res.status(404).json({ success: false, message: 'Cluster not found' });
            }

            const meta = JSON.parse(await fsPromises.readFile(metaPath, 'utf8'));
            meta.status = status;
            await fsPromises.writeFile(metaPath, JSON.stringify(meta, null, 2));

            if (status === 'REVIEWED' && meta.closestRollNo) {
                await saveToGroundTruth(meta, fullPath, meta.closestRollNo);
            }

            res.json({ success: true, message: 'Status updated', meta });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // PUT /api/attendance/unknown-faces/cluster/:path(*)/rollno
    async updateRollNo(req, res) {
        try {
            const clusterPath = req.params[0];
            const { rollNo } = req.body;
            
            if (!rollNo || typeof rollNo !== 'string') {
                return res.status(400).json({ success: false, message: 'Invalid roll number' });
            }

            const fullPath = path.join(UNKNOWN_FACES_DIR, clusterPath);
            const metaPath = path.join(fullPath, 'metadata.json');

            if (!fs.existsSync(metaPath)) {
                return res.status(404).json({ success: false, message: 'Cluster not found' });
            }

            const meta = JSON.parse(await fsPromises.readFile(metaPath, 'utf8'));
            meta.closestRollNo = rollNo.trim();
            
            // Try to fetch new name
            try {
                const Student = require('../../../../models/student');
                const studentDoc = await Student.findOne({ rollNo: { $regex: new RegExp(`^${meta.closestRollNo}$`, 'i') } }).lean();
                if (studentDoc) {
                    meta.closestStudentName = studentDoc.name;
                } else {
                    meta.closestStudentName = null;
                }
            } catch(e) {
                // ignore
            }

            await fsPromises.writeFile(metaPath, JSON.stringify(meta, null, 2));
            
            await saveToGroundTruth(meta, fullPath, meta.closestRollNo);
            
            res.json({ success: true, message: 'Roll No updated', meta });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // DELETE /api/attendance/unknown-faces/cluster/:path(*)
    async deleteCluster(req, res) {
        try {
            const clusterPath = req.params[0];
            const fullPath = path.join(UNKNOWN_FACES_DIR, clusterPath);

            if (fs.existsSync(fullPath)) {
                // Try to decrement report count if metadata exists
                try {
                    const metaPath = path.join(fullPath, 'metadata.json');
                    if (fs.existsSync(metaPath)) {
                        const meta = JSON.parse(await fsPromises.readFile(metaPath, 'utf8'));
                        if (meta.sessionId) {
                            await AttendanceReport.findByIdAndUpdate(meta.sessionId, {
                                $inc: { 'summary.unknownFaceCount': -1 }
                            });
                        }
                    }
                } catch (e) {
                    console.error('[deleteCluster] Error updating report count:', e);
                }

                await fsPromises.rm(fullPath, { recursive: true, force: true });
                res.json({ success: true, message: 'Cluster deleted' });
            } else {
                res.status(404).json({ success: false, message: 'Cluster not found' });
            }
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // GET /api/attendance/unknown-faces/cluster/:path(*)/download
    async downloadCluster(req, res) {
        try {
            const clusterPath = req.params[0];
            const fullPath = path.join(UNKNOWN_FACES_DIR, clusterPath);

            if (!fs.existsSync(fullPath)) {
                return res.status(404).json({ success: false, message: 'Cluster not found' });
            }

            const zip = new JSZip();
            const files = await fsPromises.readdir(fullPath);
            
            for (const file of files) {
                const filePath = path.join(fullPath, file);
                const fileData = await fsPromises.readFile(filePath);
                zip.file(file, fileData);
            }

            const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
            const clusterId = clusterPath.split('/').pop() || clusterPath.split('\\').pop() || 'cluster';
            
            res.set('Content-Type', 'application/zip');
            res.set('Content-Disposition', `attachment; filename=${clusterId}.zip`);
            res.send(zipContent);

        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // GET /api/attendance/unknown-faces-settings
    async getSettings(req, res) {
        try {
            const { getSettings } = require('./unknownFaceCleanupScheduler');
            const settings = await getSettings();
            res.json({ success: true, settings });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // PUT /api/attendance/unknown-faces-settings
    async updateSettings(req, res) {
        try {
            const { saveSettings } = require('./unknownFaceCleanupScheduler');
            const settings = await saveSettings(req.body);
            res.json({ success: true, settings, message: 'Settings updated successfully' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
};

module.exports = unknownFaceController;
