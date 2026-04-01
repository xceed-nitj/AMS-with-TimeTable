// assign_rolls.js
// Runs ERP auto-match for BTECH_TT_2026 and bulk-renames all high-confidence clusters
// Run with: node assign_rolls.js
// Requires: Node server on port 8010 AND Python ML service on port 8500

const http = require('http');

const BATCH      = 'BTECH_TT_2026';
const SERVER     = 'http://localhost:8010';
const ML         = 'http://localhost:8500';
const HIGH_CONF  = 0.45; // approve anything above this threshold

// ─── Simple fetch helper ──────────────────────────────────────────
function post(url, body) {
    return new Promise((resolve, reject) => {
        const data   = JSON.stringify(body);
        const parsed = new URL(url);
        const opts   = {
            hostname: parsed.hostname,
            port:     parsed.port,
            path:     parsed.pathname,
            method:   'POST',
            headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        };
        const req = http.request(opts, res => {
            let buf = '';
            res.on('data', d => buf += d);
            res.on('end', () => {
                try { resolve(JSON.parse(buf)); }
                catch { resolve(buf); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function get(url) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const opts   = { hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search };
        http.get(opts, res => {
            let buf = '';
            res.on('data', d => buf += d);
            res.on('end', () => {
                try { resolve(JSON.parse(buf)); }
                catch { resolve(buf); }
            });
        }).on('error', reject);
    });
}

// ─── SSE stream reader ────────────────────────────────────────────
function postSSE(url, body) {
    return new Promise((resolve, reject) => {
        const data   = JSON.stringify(body);
        const parsed = new URL(url);
        const opts   = {
            hostname: parsed.hostname,
            port:     parsed.port,
            path:     parsed.pathname,
            method:   'POST',
            headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        };
        const events = [];
        const req = http.request(opts, res => {
            let buf = '';
            res.on('data', chunk => {
                buf += chunk.toString();
                const lines = buf.split('\n');
                buf = lines.pop();
                for (const line of lines) {
                    if (!line.startsWith('data:')) continue;
                    try {
                        const evt = JSON.parse(line.slice(5).trim());
                        events.push(evt);
                        if (evt.type === 'match_result') {
                            process.stdout.write('.');
                        }
                    } catch {}
                }
            });
            res.on('end', () => { console.log(''); resolve(events); });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('=== BTECH_TT_2026 Roll Assignment ===\n');

    // 1. Check server
    console.log('1. Checking server health...');
    try {
        const h = await get(`${SERVER}/api/v1/attendancemodule/ground-truth/batches`);
        const batch = h.batches?.find(b => b.batch === BATCH);
        if (!batch) { console.error(`Batch ${BATCH} not found`); process.exit(1); }
        console.log(`   Found batch: ${BATCH} (${batch.studentCount} students)\n`);
    } catch (e) {
        console.error(`   Server not reachable: ${e.message}`);
        console.error('   Make sure "yarn run dev" is running in the server folder');
        process.exit(1);
    }

    // 2. Run ERP auto-match via Python ML service SSE
    console.log('2. Running ERP auto-match (this may take 1-2 minutes)...');
    const batchDir    = `C:\\Users\\samik\\AMS-with-TimeTable\\server\\ground_truth\\${BATCH}`;
    const erpPhotosDir = `C:\\Users\\samik\\AMS-with-TimeTable\\server\\erp_photos`;
    process.stdout.write('   Matching');

    let matchEvents;
    try {
        matchEvents = await postSSE(`${ML}/match-clusters-to-erp`, {
            batch_dir:      batchDir,
            erp_photos_dir: erpPhotosDir,
            top_k:          3,
        });
    } catch (e) {
        console.error(`\n   ML service not reachable: ${e.message}`);
        console.error('   Make sure "python ml_service.py" is running in python-ml-service folder');
        process.exit(1);
    }

    // 3. Extract match results
    const matchResults = matchEvents.filter(e => e.type === 'match_result');
    console.log(`\n   Got ${matchResults.length} match results\n`);

    // 4. Build assignment list — only high-confidence matches
    const high    = [];
    const low     = [];
    const usedRolls = new Set();

    // Sort by confidence descending so highest-confidence gets priority when duplicates
    matchResults.sort((a, b) => (b.match?.best?.confidence || 0) - (a.match?.best?.confidence || 0));

    for (const evt of matchResults) {
        const folder = evt.folder;
        const best   = evt.match?.best;
        if (!best) { low.push({ folder, reason: 'no ERP match' }); continue; }

        const conf   = best.confidence;
        const rollNo = best.rollNo;

        if (conf < HIGH_CONF) {
            low.push({ folder, rollNo, confidence: conf, reason: 'low confidence' });
            continue;
        }
        if (usedRolls.has(rollNo)) {
            low.push({ folder, rollNo, confidence: conf, reason: 'duplicate roll number' });
            continue;
        }

        usedRolls.add(rollNo);
        high.push({ folderName: folder, rollNo, confidence: conf });
    }

    console.log('3. Assignment plan:');
    console.log(`   HIGH confidence (will assign): ${high.length}`);
    for (const h of high) {
        console.log(`      ${h.folderName} → ${h.rollNo} (${(h.confidence * 100).toFixed(0)}%)`);
    }
    if (low.length > 0) {
        console.log(`\n   LOW confidence (skipped): ${low.length}`);
        for (const l of low) {
            console.log(`      ${l.folder} → ${l.rollNo || '?'} (${l.reason})`);
        }
    }

    if (high.length === 0) {
        console.error('\n   No high-confidence matches found. Nothing to assign.');
        process.exit(1);
    }

    // 5. Bulk assign
    console.log(`\n4. Bulk assigning ${high.length} folders...`);
    const assignments = high.map(h => ({ folderName: h.folderName, rollNo: h.rollNo }));
    const result = await post(
        `${SERVER}/api/v1/attendancemodule/roll-assign/bulk-assign`,
        { batch: BATCH, assignments }
    );

    if (result.error) {
        console.error('   Bulk assign failed:', result.error);
        process.exit(1);
    }

    console.log(`   Assigned: ${result.assigned} / ${result.total}`);
    if (result.results) {
        const errors = result.results.filter(r => r.status !== 'assigned');
        if (errors.length > 0) {
            console.log('   Errors:');
            errors.forEach(e => console.log(`      ${e.folderName}: ${e.reason}`));
        }
    }

    // 6. Generate embeddings
    console.log('\n5. Generating embeddings (building PKL with real roll numbers)...');
    const embResp = await post(
        `${SERVER}/api/v1/attendancemodule/ground-truth/generate-embeddings`,
        { batch: BATCH }
    );
    if (embResp.error) {
        console.error('   Embedding generation failed:', embResp.error);
    } else {
        console.log(`   Students enrolled: ${embResp.students_enrolled}`);
        console.log(`   Reloaded into memory: ${embResp.reloaded}`);
    }

    console.log('\n=== DONE ===');
    console.log(`Assigned: ${result.assigned} folders with real roll numbers`);
    console.log(`Skipped:  ${low.length} folders (need manual assignment)`);
    console.log('\nNext step: Go to http://localhost:5173/attendance/reports and run attendance.');
    if (low.length > 0) {
        console.log(`\nManually assign remaining folders at:`);
        console.log('http://localhost:5173/attendance/groundtruth/assign');
        console.log('Use Manual Entry mode for the skipped ones above.');
    }
}

main().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });
