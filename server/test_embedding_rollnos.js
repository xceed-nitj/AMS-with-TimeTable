const { execSync } = require('child_process');
try { execSync('dotenvx run -- node -e ""', { cwd: __dirname }); } catch(_) {}

// Manually load .env as fallback
const fs2 = require('fs');
const envPath = require('path').join(__dirname, '.env');
if (fs2.existsSync(envPath)) {
    fs2.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    });
}
const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');

const Student          = require('./src/models/student');
const StudentEmbedding = require('./src/models/attendanceModule/studentEmbedding');

const EMBEDDINGS_DIR = path.join(__dirname, 'embeddings');

// ── Copy same helpers from embeddingController.js ──────────────────
function safeSubject(raw) {
    return (raw || '').trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/,'');
}

function resolveEmbeddingFile(sem, subject) {
    const semSafe      = (sem || '').toString().trim();
    const subjectSafe  = safeSubject(subject);
    const specificFile = `${semSafe}_${subjectSafe}.pkl`;
    const specificPath = path.join(EMBEDDINGS_DIR, specificFile);

    if (fs.existsSync(specificPath)) {
        return { file: specificFile, type: 'subject' };
    }

    if (fs.existsSync(EMBEDDINGS_DIR)) {
        const candidates = fs.readdirSync(EMBEDDINGS_DIR)
            .filter(f => f.startsWith(`${semSafe}_`) && f.endsWith('.pkl'))
            .sort();
        if (candidates.length > 0) {
            return { file: candidates[0], type: 'fallback' };
        }
    }
    return null;
}

// ── CHANGE THESE to match tomorrow's class ─────────────────────────
const TEST_SEM     = '6';
const TEST_DEPT    = 'ECE';
const TEST_SUBJECT = 'Microwave Engineering';
// ──────────────────────────────────────────────────────────────────

async function main() {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('\n✅ Connected to MongoDB\n');

    // 1. Fetch enrolled roll nos
    const filter = { sem: Number(TEST_SEM) || TEST_SEM };
    if (TEST_DEPT && TEST_DEPT.toUpperCase() !== 'ALL') {
        filter.dept = { $regex: new RegExp(TEST_DEPT, 'i') };
    }
    const students = await Student.find(filter).select('rollNo dept sem -_id').lean();
    const rollNos  = students.map(s => s.rollNo).filter(Boolean);

    console.log(`TEST_SEM   : ${TEST_SEM}`);
    console.log(`TEST_DEPT  : ${TEST_DEPT}`);
    console.log(`TEST_SUBJECT: ${TEST_SUBJECT}`);
    console.log(`\n📋 Enrolled students found : ${rollNos.length}`);
    if (rollNos.length > 0) {
        console.log('Roll nos:', rollNos.join(', '));
    } else {
        console.log('⚠️  No students found — check sem/dept values');
    }

    // 2. Check embedding file resolution
    console.log('\n🔍 Resolving embedding file...');
    const resolved = resolveEmbeddingFile(TEST_SEM, TEST_SUBJECT);
    if (!resolved) {
        console.log('⚠️  No .pkl file found in embeddings/ for this sem.');
        console.log('   ML service will use currently loaded embeddings.');
    } else {
        console.log(`✅ Type : ${resolved.type}`);   // 'subject' or 'fallback'
        console.log(`   File : ${resolved.file}`);
    }

    // 3. List all .pkl files present
    console.log('\n📁 All .pkl files in embeddings/:');
    if (fs.existsSync(EMBEDDINGS_DIR)) {
        const pkls = fs.readdirSync(EMBEDDINGS_DIR).filter(f => f.endsWith('.pkl'));
        if (pkls.length === 0) console.log('   (none)');
        else pkls.forEach(f => console.log('  ', f));
    } else {
        console.log('   embeddings/ folder does not exist');
    }

    // 4. Check StudentEmbedding records for this subject
    console.log('\n🗄️  StudentEmbedding DB records for this sem+subject:');
    const semSafe     = TEST_SEM.toString().trim();
    const subjectSafe = safeSubject(TEST_SUBJECT);
    const fileBase    = `${semSafe}_${subjectSafe}`;
    const records = await StudentEmbedding.find({
        embeddingFile: { $regex: fileBase, $options: 'i' }
    }).lean();
    if (records.length === 0) {
        console.log('   (no records found — embeddings not yet generated for this subject)');
    } else {
        records.forEach(r => {
            console.log(`   status: ${r.status}  |  rollNos: ${r.rollNos?.length || 0}  |  file: ${r.embeddingFile}  |  generated: ${r.generatedAt}`);
        });
    }

    await mongoose.disconnect();
    console.log('\n✅ Done\n');
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});