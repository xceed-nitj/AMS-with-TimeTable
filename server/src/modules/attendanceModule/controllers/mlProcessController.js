const { spawn } = require('child_process');
const path = require('path');

let pythonProcess = null;

// attendanceModule/controllers/ → attendanceModule/ → modules/ → src/ → server/ → ROOT → python-ml-service
const BASE = path.resolve(__dirname, '..', '..', '..', '..', '..', 'python-ml-service');

const PYTHON_PATH = path.join(BASE, 'venv', 'Scripts', 'python.exe');
const SCRIPT_PATH = path.join(BASE, 'ml_service.py');
const CWD = BASE;

function startPython() {
    return new Promise((resolve, reject) => {
        if (pythonProcess) {
            return resolve({ status: 'already_running', pid: pythonProcess.pid });
        }

        console.log('[ML] Starting Python service...');
        console.log('[ML] Python path:', PYTHON_PATH);
        console.log('[ML] Script path:', SCRIPT_PATH);
        console.log('[ML] CWD:', CWD);

        pythonProcess = spawn(PYTHON_PATH, [SCRIPT_PATH], {
            cwd: CWD,
        });

        pythonProcess.stdout.on('data', (data) => {
            console.log(`[Python] ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.log(`[Python] ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`[Python] Process exited with code ${code}`);
            pythonProcess = null;
        });

        pythonProcess.on('error', (err) => {
            console.error('[Python] Failed to start:', err.message);
            pythonProcess = null;
            reject(err);
        });

        setTimeout(() => {
            if (pythonProcess) {
                resolve({ status: 'started', pid: pythonProcess.pid });
            } else {
                reject(new Error('Python process failed to start'));
            }
        }, 5000);
    });
}

function stopPython() {
    return new Promise((resolve) => {
        if (!pythonProcess) {
            return resolve({ status: 'already_stopped' });
        }
        pythonProcess.kill('SIGTERM');
        pythonProcess = null;
        resolve({ status: 'stopped' });
    });
}

async function restartPython() {
    await stopPython();
    await new Promise(r => setTimeout(r, 2000));
    return await startPython();
}

function getStatus() {
    return {
        running: pythonProcess !== null,
        pid: pythonProcess ? pythonProcess.pid : null
    };
}

module.exports = { startPython, stopPython, restartPython, getStatus };
