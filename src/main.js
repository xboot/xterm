import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import './style.css';

const $ = (selector) => document.querySelector(selector);
const elements = {
  baudRate: $('#baud-rate'),
  dataBits: $('#data-bits'),
  stopBits: $('#stop-bits'),
  parity: $('#parity'),
  flowControl: $('#flow-control'),
  connect: $('#connect-button'),
  emptyConnect: $('#empty-connect'),
  emptyState: $('#empty-state'),
  stateText: $('#state-text'),
  connectionState: $('#connection-state'),
  statusLed: $('#status-led'),
  statusDetail: $('#status-detail'),
  portLabel: $('#port-label'),
  terminalStage: $('#terminal-stage'),
  autoScroll: $('#auto-scroll'),
  timestamps: $('#timestamps'),
  rxCount: $('#rx-count'),
  txCount: $('#tx-count'),
  sessionTime: $('#session-time'),
  clearTerminal: $('#clear-terminal'),
  downloadLog: $('#download-log'),
  language: $('#toggle-language'),
  theme: $('#toggle-theme'),
  toast: $('#toast'),
  settingsPanel: $('#settings-panel'),
  toggleSettings: $('#toggle-settings'),
  closeSettings: $('#close-settings'),
};

const translations = {
  zh: {
    settingsTitle: '连接配置', baudRate: '波特率', dataBits: '数据位', stopBits: '停止位',
    parity: '校验位', flowControl: '流控制', none: '无', evenParity: '偶校验', oddParity: '奇校验',
    hardwareFlow: '硬件流控', connect: '连接串口', disconnect: '断开连接', connected: '已连接', disconnected: '未连接',
    autoScroll: '自动滚动', autoScrollHint: '始终跟随最新输出', timestamps: '时间戳',
    timestampsHint: '在每个接收行的行首显示', privacyTitle: '数据仅在本机流转',
    privacyHint: '浏览器不会将串口数据上传到服务器。', waitingDevice: '等待设备', clear: '清空', log: '日志',
    readyTitle: '准备连接串口设备', readyHint: '设置通信参数，然后点击“连接串口”开始。',
    chooseDevice: '选择串口设备', browserHint: '需要 Chrome、Edge 或其他支持 Web Serial 的 Chromium 浏览器',
    openSettings: '打开串口设置', closeSettings: '关闭设置', github: 'GitHub 仓库', clearTitle: '清空终端',
    logTitle: '下载日志', switchLanguage: 'Switch to English', lightTheme: '切换为浅色主题', darkTheme: '切换为深色主题',
    unsupported: '当前浏览器不支持 Web Serial，请使用桌面版 Chrome 或 Edge。', connectedToast: '串口连接成功',
    disconnectedToast: '串口已断开', noLog: '当前还没有可下载的串口数据', readFailed: '读取串口失败',
    connectFailed: '连接失败', sendFailed: '发送失败',
  },
  en: {
    settingsTitle: 'Connection', baudRate: 'Baud rate', dataBits: 'Data bits', stopBits: 'Stop bits',
    parity: 'Parity', flowControl: 'Flow control', none: 'None', evenParity: 'Even', oddParity: 'Odd',
    hardwareFlow: 'Hardware', connect: 'Connect serial', disconnect: 'Disconnect', connected: 'Connected', disconnected: 'Disconnected',
    autoScroll: 'Auto scroll', autoScrollHint: 'Follow the latest output', timestamps: 'Timestamps',
    timestampsHint: 'Show once at the start of each line', privacyTitle: 'Data stays on this device',
    privacyHint: 'Serial data is never uploaded to a server.', waitingDevice: 'Waiting for device', clear: 'Clear', log: 'Log',
    readyTitle: 'Ready for a serial device', readyHint: 'Set the communication parameters, then connect.',
    chooseDevice: 'Choose serial device', browserHint: 'Requires Chrome, Edge, or another Chromium browser with Web Serial',
    openSettings: 'Open serial settings', closeSettings: 'Close settings', github: 'GitHub repository', clearTitle: 'Clear terminal',
    logTitle: 'Download log', switchLanguage: '切换到中文', lightTheme: 'Switch to light theme', darkTheme: 'Switch to dark theme',
    unsupported: 'Web Serial is not supported. Please use desktop Chrome or Edge.', connectedToast: 'Serial port connected',
    disconnectedToast: 'Serial port disconnected', noLog: 'There is no serial data to download yet', readFailed: 'Serial read failed',
    connectFailed: 'Connection failed', sendFailed: 'Send failed',
  },
};

let currentLanguage = localStorage.getItem('xterm-language') === 'en' ? 'en' : 'zh';
let currentTheme = localStorage.getItem('xterm-theme');
if (!['light', 'dark'].includes(currentTheme)) {
  currentTheme = 'dark';
}

const terminalThemes = {
  dark: {
    background: '#090c0e', foreground: '#d8ded9', cursor: '#c7f36b', cursorAccent: '#090c0e', selectionBackground: '#c7f36b33',
    black: '#171b1d', red: '#f06b67', green: '#a6da75', yellow: '#eed49f', blue: '#8aadf4', magenta: '#c6a0f6',
    cyan: '#8bd5ca', white: '#cad3f5', brightBlack: '#5b6468', brightRed: '#ed8796', brightGreen: '#c7f36b',
    brightYellow: '#f4dbd6', brightBlue: '#91d7e3', brightMagenta: '#f5bde6', brightCyan: '#b7f4df', brightWhite: '#ffffff',
  },
  light: {
    background: '#f7f8f4', foreground: '#252b2c', cursor: '#59720f', cursorAccent: '#f7f8f4', selectionBackground: '#7b9b2638',
    black: '#222728', red: '#b93b3b', green: '#557b12', yellow: '#8a6600', blue: '#3566a8', magenta: '#7950a3',
    cyan: '#257b79', white: '#d9ddd7', brightBlack: '#6d7677', brightRed: '#d14d4d', brightGreen: '#688d18',
    brightYellow: '#9a7511', brightBlue: '#487abd', brightMagenta: '#8b64b2', brightCyan: '#378d88', brightWhite: '#ffffff',
  },
};

document.documentElement.dataset.theme = currentTheme;

function t(key) {
  return translations[currentLanguage][key];
}

const terminal = new Terminal({
  cursorBlink: true,
  cursorStyle: 'bar',
  fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: 15,
  lineHeight: 1.4,
  scrollback: 10000,
  convertEol: false,
  allowTransparency: true,
  theme: terminalThemes[currentTheme],
});
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);
terminal.open($('#terminal'));

let port = null;
let reader = null;
let readLoopPromise = null;
let closing = false;
let rxBytes = 0;
let txBytes = 0;
let startedAt = null;
let sessionTimer = null;
let log = [];
let toastTimer = null;
let rxAtLineStart = true;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function showToast(message, type = 'info') {
  elements.toast.textContent = message;
  elements.toast.dataset.type = type;
  elements.toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove('visible'), 2800);
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatElapsed(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function updateStats() {
  elements.rxCount.textContent = formatBytes(rxBytes);
  elements.txCount.textContent = formatBytes(txBytes);
  elements.sessionTime.textContent = startedAt ? formatElapsed(Date.now() - startedAt) : '00:00:00';
}

function applyLanguage() {
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  elements.language.textContent = currentLanguage === 'zh' ? 'EN' : '中';
  elements.language.title = t('switchLanguage');
  elements.language.setAttribute('aria-label', t('switchLanguage'));
  elements.toggleSettings.setAttribute('aria-label', t('openSettings'));
  elements.closeSettings.setAttribute('aria-label', t('closeSettings'));
  document.querySelector('.top-actions a').setAttribute('aria-label', t('github'));
  elements.clearTerminal.title = t('clearTitle');
  elements.downloadLog.title = t('logTitle');
  document.querySelector('meta[name="description"]').content = currentLanguage === 'zh'
    ? 'XBOOT Web Serial Terminal — 在浏览器中安全连接、调试和记录串口设备。'
    : 'XBOOT Web Serial Terminal — connect, debug, and log serial devices securely in your browser.';
  setConnected(Boolean(port));
  if (!port) elements.portLabel.textContent = t('waitingDevice');
  if (!('serial' in navigator)) {
    elements.statusDetail.textContent = 'UNSUPPORTED BROWSER';
    elements.emptyState.querySelector('p').textContent = t('unsupported');
  }
  localStorage.setItem('xterm-language', currentLanguage);
}

function applyTheme() {
  document.documentElement.dataset.theme = currentTheme;
  document.querySelector('meta[name="theme-color"]').content = currentTheme === 'dark' ? '#090b0d' : '#f3f5f1';
  elements.theme.title = currentTheme === 'dark' ? t('lightTheme') : t('darkTheme');
  elements.theme.setAttribute('aria-label', elements.theme.title);
  terminal.options.theme = terminalThemes[currentTheme];
  localStorage.setItem('xterm-theme', currentTheme);
  requestAnimationFrame(() => fitAddon.fit());
}

function setConnected(connected) {
  elements.connectionState.classList.toggle('connected', connected);
  elements.statusLed.classList.toggle('connected', connected);
  elements.stateText.textContent = connected ? t('connected') : t('disconnected');
  elements.statusDetail.textContent = connected ? 'CONNECTED' : 'DISCONNECTED';
  elements.connect.classList.toggle('connected', connected);
  elements.connect.querySelector('.button-symbol').textContent = connected ? '×' : '↗';
  elements.connect.querySelector('span:last-child').textContent = connected ? t('disconnect') : t('connect');
  elements.emptyState.hidden = connected;
  for (const input of [elements.baudRate, elements.dataBits, elements.stopBits, elements.parity, elements.flowControl]) {
    input.disabled = connected;
  }
  if (connected) {
    terminal.focus();
    elements.settingsPanel.classList.remove('open');
  }
}

function savePreferences() {
  const settings = {
    baudRate: elements.baudRate.value,
    dataBits: elements.dataBits.value,
    stopBits: elements.stopBits.value,
    parity: elements.parity.value,
    flowControl: elements.flowControl.value,
    autoScroll: elements.autoScroll.checked,
    timestamps: elements.timestamps.checked,
  };
  localStorage.setItem('xterm-settings', JSON.stringify(settings));
}

function restorePreferences() {
  try {
    const settings = JSON.parse(localStorage.getItem('xterm-settings'));
    if (!settings) return;
    for (const [key, value] of Object.entries(settings)) {
      const input = elements[key];
      if (!input || value === undefined) continue;
      if (input.type === 'checkbox') input.checked = value;
      else input.value = value;
    }
  } catch {
    localStorage.removeItem('xterm-settings');
  }
}

function timestamp() {
  return new Date().toISOString();
}

async function writeSerial(data) {
  if (!port?.writable) return;
  const bytes = typeof data === 'string' ? encoder.encode(data) : data;
  const writer = port.writable.getWriter();
  try {
    await writer.write(bytes);
    txBytes += bytes.byteLength;
    const text = typeof data === 'string' ? data : decoder.decode(data);
    log.push({ time: timestamp(), direction: 'TX', data: text });
    updateStats();
  } finally {
    writer.releaseLock();
  }
}

function addLineTimestamps(text) {
  if (!elements.timestamps.checked) {
    for (const character of text) {
      if (character === '\r' || character === '\n') rxAtLineStart = true;
      else rxAtLineStart = false;
    }
    return text;
  }

  let output = '';
  for (const character of text) {
    if (rxAtLineStart && character !== '\r' && character !== '\n') {
      const locale = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';
      output += `\x1b[90m[${new Date().toLocaleTimeString(locale)}]\x1b[0m `;
      rxAtLineStart = false;
    }
    output += character;
    if (character === '\r' || character === '\n') rxAtLineStart = true;
  }
  return output;
}

async function readSerial() {
  while (port?.readable && !closing) {
    reader = port.readable.getReader();
    try {
      while (!closing) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        rxBytes += value.byteLength;
        const text = decoder.decode(value, { stream: true });
        log.push({ time: timestamp(), direction: 'RX', data: text });
        terminal.write(addLineTimestamps(text));
        if (elements.autoScroll.checked) terminal.scrollToBottom();
        updateStats();
      }
    } catch (error) {
      if (!closing) {
        console.error(error);
        showToast(`${t('readFailed')}: ${error.message}`, 'error');
      }
    } finally {
      reader.releaseLock();
      reader = null;
    }
  }
}

async function connect() {
  if (!('serial' in navigator)) {
    showToast(t('unsupported'), 'error');
    return;
  }
  if (port) {
    await disconnect();
    return;
  }
  try {
    port = await navigator.serial.requestPort();
    await port.open({
      baudRate: Number(elements.baudRate.value),
      dataBits: Number(elements.dataBits.value),
      stopBits: Number(elements.stopBits.value),
      parity: elements.parity.value,
      flowControl: elements.flowControl.value,
      bufferSize: 65536,
    });
    closing = false;
    rxBytes = 0;
    txBytes = 0;
    log = [];
    rxAtLineStart = true;
    startedAt = Date.now();
    clearInterval(sessionTimer);
    sessionTimer = setInterval(updateStats, 1000);
    const info = port.getInfo();
    const ids = [info.usbVendorId, info.usbProductId]
      .filter((value) => value !== undefined)
      .map((value) => value.toString(16).toUpperCase().padStart(4, '0'));
    elements.portLabel.textContent = ids.length ? `USB ${ids.join(':')}` : `${elements.baudRate.value} baud`;
    terminal.clear();
    setConnected(true);
    updateStats();
    savePreferences();
    showToast(t('connectedToast'), 'success');
    readLoopPromise = readSerial();
  } catch (error) {
    port = null;
    if (error.name !== 'NotFoundError') showToast(`${t('connectFailed')}: ${error.message}`, 'error');
  }
}

async function disconnect() {
  if (!port) return;
  closing = true;
  try {
    await reader?.cancel();
    await readLoopPromise;
    await port.close();
  } catch (error) {
    console.warn(error);
  } finally {
    port = null;
    reader = null;
    readLoopPromise = null;
    clearInterval(sessionTimer);
    setConnected(false);
    elements.portLabel.textContent = t('waitingDevice');
    updateStats();
    showToast(t('disconnectedToast'));
  }
}

function downloadLog() {
  if (!log.length) {
    showToast(t('noLog'));
    return;
  }
  const content = log.map((entry) => `[${entry.time}] ${entry.direction}  ${entry.data}`).join('');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `xterm-${new Date().toISOString().replaceAll(':', '-').slice(0, 19)}.log`;
  link.click();
  URL.revokeObjectURL(link.href);
}

terminal.onData((data) => {
  writeSerial(data).catch((error) => showToast(`${t('sendFailed')}: ${error.message}`, 'error'));
});

elements.connect.addEventListener('click', connect);
elements.emptyConnect.addEventListener('click', connect);
elements.clearTerminal.addEventListener('click', () => {
  terminal.clear();
  terminal.focus();
});
elements.downloadLog.addEventListener('click', downloadLog);
elements.language.addEventListener('click', () => {
  currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
  applyLanguage();
  applyTheme();
});
elements.theme.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme();
});
elements.toggleSettings.addEventListener('click', () => elements.settingsPanel.classList.add('open'));
elements.closeSettings.addEventListener('click', () => elements.settingsPanel.classList.remove('open'));
document.addEventListener('change', (event) => {
  if (event.target.matches('select, input[type="checkbox"]')) savePreferences();
});
window.addEventListener('resize', () => fitAddon.fit());
window.addEventListener('beforeunload', (event) => {
  if (!port) return;
  event.preventDefault();
});
navigator.serial?.addEventListener('disconnect', (event) => {
  if (event.target === port) disconnect();
});

restorePreferences();
applyLanguage();
applyTheme();
fitAddon.fit();
updateStats();
