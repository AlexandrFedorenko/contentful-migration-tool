const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');
const os = require('os');

function log(message) {
    const logPath = path.join(app.getPath('userData'), 'main.log');
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;
    try {
        fs.appendFileSync(logPath, logMessage);
    } catch (error) {
        console.error('Failed to write to log:', error);
    }
}
const isDev = process.env.NODE_ENV === 'development';

// Main process started


let mainWindow;
let nextServer;

async function startNextServer() {

    return new Promise((resolve, reject) => {
        let nextDistPath = path.join(__dirname, '../node_modules/next/dist/bin/next');

        // In production, the node_modules are unpacked to app.asar.unpacked
        // but __dirname is still inside app.asar
        if (app.isPackaged) {
            nextDistPath = nextDistPath.replace('app.asar', 'app.asar.unpacked');
        }

        log(`Starting Next.js server...`);
        log(`Binary path: ${nextDistPath}`);
        log(`CWD: ${path.join(__dirname, '..')}`);

        try {
            nextServer = fork(nextDistPath, ['start', '-p', '3000'], {
                cwd: path.join(__dirname, '..'),
                silent: true,
                env: { ...process.env, NODE_ENV: 'production' }
            });

            nextServer.stdout.on('data', (data) => {
                // log(`Next.js stdout: ${data}`); // Reduced logging
                if (data.toString().includes('ready')) {
                    log('Next.js is ready');
                    resolve();
                }
            });

            nextServer.stderr.on('data', (data) => {
                log(`Next.js stderr: ${data}`);
                console.error(`Next.js Error: ${data}`);
            });

            nextServer.on('error', (err) => {
                log(`Next.js failed to start: ${err.message}`);
                console.error('Next.js process failed:', err);
                reject(err);
            });

            // Resolve after a timeout if ready message is missed
            setTimeout(() => {
                log('Timeout waiting for Next.js ready signal, proceeding anyway...');
                resolve();
            }, 10000); // Increased timeout
        } catch (err) {
            log(`Exception starting Next.js: ${err.message}`);
            reject(err);
        }
    });
}

function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            sandbox: false
        },
        icon: path.join(__dirname, '../public/icon.png'),
        backgroundColor: '#1a1a1a',
        show: true, // Show immediately
    });



    // Always connect to Next.js server on localhost:3000
    mainWindow.loadURL('http://localhost:3000').then(() => {

    }).catch((err) => {
        console.error('Failed to load URL:', err);
    });

    if (isDev) {

        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {

        mainWindow = null;
    });
}

// App lifecycle
app.whenReady().then(async () => {

    if (!isDev) {

        // In production, start Next.js server
        await startNextServer();
    } else {
        // Development mode - expecting Next.js to be running already
    }

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {

    if (nextServer) {
        nextServer.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {

    if (nextServer) {
        nextServer.kill();
    }
});
