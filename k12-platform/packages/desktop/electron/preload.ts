import { contextBridge, ipcRenderer } from 'electron';

/**
 * K12 学习平台 - 预加载脚本
 * 通过 contextBridge 安全地向渲染进程暴露 Electron API
 */

const electronAPI = {
  // ========== 窗口控制 ==========

  /** 最小化窗口 */
  minimize: () => {
    ipcRenderer.send('window-minimize');
  },

  /** 最大化/还原窗口 */
  maximize: () => {
    ipcRenderer.send('window-maximize');
  },

  /** 关闭窗口 */
  close: () => {
    ipcRenderer.send('window-close');
  },

  // ========== 应用信息 ==========

  /** 获取应用版本号 */
  getVersion: () => ipcRenderer.invoke('app-version'),

  /** 获取当前平台 */
  getPlatform: () => ipcRenderer.invoke('app-platform'),

  /** 获取系统信息 */
  getSystemInfo: () =>
    ipcRenderer.invoke('app-system-info'),

  // ========== IPC 通信 ==========

  /** 向主进程发送消息 */
  send: (channel: string, ...args: unknown[]) => {
    const validChannels = [
      'window-minimize',
      'window-maximize',
      'window-close',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },

  /** 从主进程接收消息 */
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = [
      'deep-link',
    ];
    if (validChannels.includes(channel)) {
      const subscription = (
        _event: Electron.IpcRendererEvent,
        ...args: unknown[]
      ) => callback(...args);
      ipcRenderer.on(channel, subscription);
      // 返回取消订阅函数
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    return undefined;
  },

  /** 调用主进程方法（invoke/handle 模式） */
  invoke: (channel: string, ...args: unknown[]) => {
    const validChannels = [
      'app-version',
      'app-platform',
      'app-system-info',
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`不允许的IPC通道: ${channel}`));
  },
};

// 暴露到渲染进程的 window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明：使渲染进程能通过 TypeScript 访问 electronAPI
export type ElectronAPI = typeof electronAPI;