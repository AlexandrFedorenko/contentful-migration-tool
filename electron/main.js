const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

console.log('Electron starting...');
console.log('isDev:', isDev);

let mainWindow;
let nextServer;

async function startNextServer() {
    console.log('Starting Next.js server...');
    return new Promise((resolve) => {
        const nextPath = path.join(__dirname, '../node_modules/.bin/next');
        nextServer = spawn(nextPath, ['start', '-p', '3000'], {
            cwd: path.join(__dirname, '..'),
            shell: true
        });

        nextServer.stdout.on('data', (data) => {
            console.log(`Next.js: ${data}`);
            if (data.toString().includes('ready')) {
                resolve();
            }
        });

        nextServer.stderr.on('data', (data) => {
            console.error(`Next.js Error: ${data}`);
        });
    });
}

function createWindow() {
    console.log('Creating window...');
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

    console.log('Window created, loading URL...');

    // Always connect to Next.js server on localhost:3000
    mainWindow.loadURL('http://localhost:3000').then(() => {
        console.log('URL loaded successfully');
    }).catch((err) => {
        console.error('Failed to load URL:', err);
    });

    if (isDev) {
        console.log('Opening DevTools...');
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        console.log('Window closed');
        mainWindow = null;
    });
}

// App lifecycle
app.whenReady().then(async () => {
    console.log('App ready!');
    if (!isDev) {
        console.log('Starting Next.js server for production...');
        // In production, start Next.js server
        await startNextServer();
    } else {
        console.log('Development mode - expecting Next.js to be running already');
    }

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    console.log('All windows closed');
    if (nextServer) {
        nextServer.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    console.log('App quitting...');
    if (nextServer) {
        nextServer.kill();
    }
});
