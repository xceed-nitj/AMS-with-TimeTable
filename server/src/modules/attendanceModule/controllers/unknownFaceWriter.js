const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Student = require('../../../models/student');
const Subject = require('../../../models/subject');
const AttendanceReport = require('../../../models/attendanceReport');

const ML_DATA_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data');
const UNKNOWN_FACES_DIR = path.join(ML_DATA_DIR, 'unknown_faces');

function ensureDirSync(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
ensureDirSync(UNKNOWN_FACES_DIR);

/**
 * Parses the batch string to extract degree, department, and year.
 * e.g., 'BTECH_CSE_2023' -> { degree: 'BTECH', department: 'CSE', year: '2023' }
 */
function parseBatch(batch) {
    const parts = (batch || '').split('_');
    if (parts.length < 3) {
        return { degree: parts[0] || 'UNKNOWN', department: parts[1] || 'UNKNOWN', year: 'UNKNOWN' };
    }
    return {
        degree: parts[0],
        department: parts.slice(1, -1).join('_'),
        year: parts[parts.length - 1]
    };
}

/**
 * Saves unknown face clusters to the filesystem without blocking.
 */
async function saveUnknownFaces(unmatchedClusters, config, reportId) {
    if (!unmatchedClusters || unmatchedClusters.length === 0) return;

    // Fire and forget - don't await this in the main flow
    processUnknownFaces(unmatchedClusters, config, reportId).catch(err => {
        console.error('[UnknownFaceWriter] Error saving unknown faces:', err.message);
    });
}

async function processUnknownFaces(unmatchedClusters, config, reportId) {
    const { degree, department, year } = parseBatch(config.batch);
    const dateStr = config.date || new Date().toISOString().split('T')[0];
    const slotStr = config.slot || 'UnknownSlot';
    const roomStr = config.room || 'UnknownRoom';
    
    // Attempt to fetch subject details
    let subjectCode = config.subject || 'Unknown';
    let subjectName = config.subject || 'Unknown';
    
    try {
        const subjectDoc = await Subject.findOne({ 
            $or: [
                { subName: config.subject },
                { subjectFullName: config.subject },
                { subCode: config.subject }
            ]
        }).lean();
        
        if (subjectDoc) {
        subjectCode = subjectDoc.subCode || subjectCode;
        subjectName = subjectDoc.subName || subjectName;
    }
    } catch (err) {
        // ignore
    }
    
    // Base path: ml-data/unknown_faces/BTECH/CSE/2023/CS301/2026-06-17/Slot_3
    const safeSubCode = subjectCode.replace(/[^a-zA-Z0-9_-]/g, '_');
    const basePath = path.join(UNKNOWN_FACES_DIR, degree, department, year, safeSubCode, dateStr, slotStr);
    
    await fsPromises.mkdir(basePath, { recursive: true });

    let validClustersSaved = 0;

    for (const cluster of unmatchedClusters) {
        try {
            const clusterIdStr = `cluster_${uuidv4().substring(0, 8)}`;
            const clusterPath = path.join(basePath, clusterIdStr);
            await fsPromises.mkdir(clusterPath, { recursive: true });

            // Fetch closest student name if closestRollNo is provided
            let closestStudentName = null;
            if (cluster.closestRollNo) {
                try {
                    const studentDoc = await Student.findOne({ rollNo: { $regex: new RegExp(`^${cluster.closestRollNo}$`, 'i') } }).lean();
                    if (studentDoc) {
                        closestStudentName = studentDoc.name;
                    }
                } catch (e) {
                    // ignore
                }
            }

            // Save crops
            let repSaved = false;
            let savedCount = 0;
            const crops = cluster.crops || [];
            
            for (let i = 0; i < crops.length; i++) {
                const cropData = crops[i].data; // base64
                if (!cropData) continue;
                
                const buffer = Buffer.from(cropData, 'base64');
                
                if (!repSaved) {
                    await fsPromises.writeFile(path.join(clusterPath, 'representative.jpg'), buffer);
                    repSaved = true;
                } else {
                    savedCount++;
                    await fsPromises.writeFile(path.join(clusterPath, `face_${String(savedCount).padStart(3, '0')}.jpg`), buffer);
                }
            }
            
            const totalFaces = repSaved ? 1 + savedCount : 0;
            
            if (totalFaces === 0) {
                await fsPromises.rm(clusterPath, { recursive: true, force: true });
                continue;
            }

            const metadata = {
                clusterId: clusterIdStr,
                createdAt: new Date().toISOString(),
                degree,
                department,
                year,
                subjectCode,
                subjectName,
                room: roomStr,
                cameraId: config.rtspUrl,
                sessionId: reportId,
                slot: slotStr,
                faceCount: totalFaces,
                failureReason: cluster.failureReason || 'UNKNOWN',
                closestRollNo: cluster.closestRollNo || null,
                closestStudentName,
                bestSimilarity: cluster.best_score || 0,
                recognitionThreshold: cluster.recognitionThreshold || 0,
                status: 'NEW',
                date: dateStr
            };

            await fsPromises.writeFile(path.join(clusterPath, 'metadata.json'), JSON.stringify(metadata, null, 2));
            
            validClustersSaved++;
        } catch (err) {
            console.error(`[UnknownFaceWriter] Failed to process cluster: ${err.message}`);
        }
    }

    // Update the attendance report
    if (reportId && validClustersSaved > 0) {
        try {
            await AttendanceReport.findByIdAndUpdate(reportId, {
                $inc: { 'summary.unknownFaceCount': validClustersSaved }
            });
        } catch (err) {
            console.error('[UnknownFaceWriter] Failed to update unknownFaceCount in report:', err.message);
        }
    }
}

module.exports = { saveUnknownFaces };
