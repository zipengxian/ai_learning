import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  globalShortcut,
  session,
  dialog,
  shell,
  ipcMain,
} from 'electron';
import os from 'os';
import path from 'path';
import fs from 'fs';

// 开发环境判断
const isDev = process.env.NODE_ENV !== 'production' || !app.isPacked;

// 窗口状态持久化路径
const winStatePath = path.join(app.getPath('userData'), 'window-state.json');

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

function loadWindowState(): WindowState {
  try {
    if (fs.existsSync(winStatePath)) {
      const data = fs.readFileSync(winStatePath, 'utf-8');
      return JSON.parse(data) as WindowState;
    }
  } catch {
    // 忽略读取错误，使用默认值
  }
  return { width: 1280, height: 800 };
}

function saveWindowState(win: BrowserWindow) {
  try {
    const bounds = win.getBounds();
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
    fs.writeFileSync(winStatePath, JSON.stringify(state, null, 2));
  } catch {
    // 忽略写入错误
  }
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// GPU 加速
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

function createAppIcon(): nativeImage {
  // 使用简单的数据 URI 创建一个 32x32 的蓝色图标作为占位
  // 生产环境应替换为 assets/icon.png
  const iconPath = path.join(__dirname, '../assets/icon.png');
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }
  // 后备：创建一个简单的蓝色方形图标
  const size = 32;
  const canvas = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    canvas[i * 4] = 66;     // R
    canvas[i * 4 + 1] = 133; // G
    canvas[i * 4 + 2] = 244; // B
    canvas[i * 4 + 3] = 255; // A
  }
  return nativeImage.createFromBuffer(canvas, { width: size, height: size });
}

function buildAppMenu() {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const, label: '关于 K12 学习平台' },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const, label: '退出' },
            ],
          },
        ]
      : []),
    {
      label: '文件',
      submenu: [
        {
          label: '新建窗口',
          accelerator: 'CmdOrCtrl+N',
          click: () => createWindow(),
        },
        { type: 'separator' },
        isMac
          ? { role: 'close' as const, label: '关闭窗口' }
          : { role: 'quit' as const, label: '退出' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' as const, label: '撤销' },
        { role: 'redo' as const, label: '重做' },
        { type: 'separator' },
        { role: 'cut' as const, label: '剪切' },
        { role: 'copy' as const, label: '复制' },
        { role: 'paste' as const, label: '粘贴' },
        { role: 'delete' as const, label: '删除' },
        { type: 'separator' },
        { role: 'selectAll' as const, label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' as const, label: '刷新' },
        { role: 'forceReload' as const, label: '强制刷新' },
        {
          label: '开发者工具',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          },
        },
        { type: 'separator' },
        { role: 'resetZoom' as const, label: '重置缩放' },
        { role: 'zoomIn' as const, label: '放大' },
        { role: 'zoomOut' as const, label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen' as const, label: '全屏' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: '关于 K12 学习平台',
              message: 'K12 学习平台',
              detail: `版本: ${app.getVersion()}\n一个面向基础教育的智能学习平台。`,
            });
          },
        },
        {
          label: '访问网站',
          click: () => {
            shell.openExternal('https://k12-platform.example.com');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createTray() {
  const icon = createAppIcon();
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏窗口',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.exit(0);
      },
    },
  ]);

  tray.setToolTip('K12 学习平台');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function setupCSP() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' http://localhost:* ws://localhost:*",
            "media-src 'self'",
            "object-src 'none'",
          ].join('; '),
        ],
      },
    });
  });
}

function setupDeepLinks() {
  // 注册协议：k12-platform://
  const protocol = 'k12-platform';

  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(protocol, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(protocol);
  }

  // 处理 macOS open-url 事件
  app.on('open-url', (_event, url) => {
    handleDeepLink(url);
  });

  // 处理 Windows/Linux second-instance 事件
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', (_event, commandLine) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
      // 从命令行中提取深度链接
      const url = commandLine.find((arg) => arg.startsWith(`${protocol}://`));
      if (url) {
        handleDeepLink(url);
      }
    });
  }
}

function handleDeepLink(url: string) {
  console.log('收到深度链接:', url);
  // 基础实现：记录并可在未来扩展为路由导航
  if (mainWindow) {
    mainWindow.webContents.send('deep-link', url);
  }
}

function setupIpcHandlers() {
  // 窗口控制
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
  });
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window-close', () => {
    mainWindow?.close();
  });

  // 应用信息
  ipcMain.handle('app-version', () => app.getVersion());
  ipcMain.handle('app-platform', () => process.platform);
  ipcMain.handle('app-system-info', () => ({
    platform: process.platform,
    arch: os.arch(),
    version: app.getVersion(),
    nodeVersion: process.versions.node,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    hostname: os.hostname(),
  }));
}

function createWindow() {
  const savedState = loadWindowState();

  mainWindow = new BrowserWindow({
    x: savedState.x,
    y: savedState.y,
    width: savedState.width,
    height: savedState.height,
    minWidth: 1024,
    minHeight: 680,
    icon: createAppIcon(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
      enablePreferredSizeMode: true,
    },
    title: 'K12 学习平台',
    show: false,
  });

  // 窗口准备好后再显示，避免白屏闪烁
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 窗口关闭时保存状态
  mainWindow.on('close', () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  // 窗口关闭到托盘而非退出
  mainWindow.on('close', (event) => {
    if (tray && !app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // macOS 特定：dock 图标点击时恢复窗口
  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  if (isDev) {
    // 开发模式加载 Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式加载构建产物
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return mainWindow;
}

// 标识应用是否正在退出（区分窗口关闭和退出）
app.isQuitting = false;

app.whenReady().then(() => {
  // 注册 IPC 处理器
  setupIpcHandlers();

  // 设置 CSP 安全头
  setupCSP();

  // 设置深度链接
  setupDeepLinks();

  // 构建应用菜单
  buildAppMenu();

  // 创建系统托盘
  createTray();

  // 创建主窗口
  createWindow();
});

// macOS：dock 点击时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // 注销所有全局快捷键
  globalShortcut.unregisterAll();
});

// 扩展 app 类型以支持 isQuitting
declare module 'electron' {
  interface App {
    isQuitting: boolean;
  }
}