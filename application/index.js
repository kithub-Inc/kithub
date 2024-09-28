const { app, BrowserWindow } = require(`electron`);
const path = require(`path`);

const createWindow = async () => {
    const win = new BrowserWindow({
        minWidth: 400,
        minHeight: 400,
        width: 1200,
        height: 900,
        webPreferences: { preload: path.join(__dirname, `preload.js`) },
        titleBarStyle: `hiddenInset`,
        icon: path.join(__dirname, `assets/icons/png/32x32.png`),
        title: `kithub-inc`
    });
    
    await win.loadFile(path.resolve(app.getAppPath(), `index.html`));
}

app.whenReady().then(() => {
    createWindow();

    app.on(`activate`, () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on(`window-all-closed`, () => {
    if (process.platform !== `darwin`) app.quit();
});