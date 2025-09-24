const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  const indexPath = path.join('dist', 'index.html');
  win.loadFile(indexPath);
}

app.whenReady().then(() => {
  createWindow();
}).catch((err) => {
  console.log(err);
});
