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
  quickInput: $('#quick-input'),
  sendButton: $('#send-button'),
  lineEnding: $('#line-ending'),
  localEcho: $('#local-echo'),
  autoScroll: $('#auto-scroll'),
  timestamps: $('#timestamps'),
  rxCount: $('#rx-count'),
  txCount: $('#tx-count'),
  sessionTime: $('#session-time'),
  clearTerminal: $('#clear-terminal'),
  downloadLog: $('#download-log'),
  sendBreak: $('#send-break'),
  toast: $('#toast'),
  settingsPanel: $('#settings-panel'),
  toggleSettings: $('#toggle-settings'),
  closeSettings: $('#close-settings'),
};

const terminal = new Terminal({
  cursorBlink: true,
  cursorStyle: 'bar',
  fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: 14,
  lineHeight: 1.35,
  scrollback: 10000,
  convertEol: false,
  allowTransparency: true,
  theme: {
    background: '#090c0e',
    foreground: '#d8ded9',
    cursor: '#c7f36b',
    cursorAccent: '#090c0e',
    selectionBackground: '#c7f36b33',
    black: '#171b1d', red: '#f06b67', green: '#a6da75', yellow: '#eed49f',
    blue: '#8aadf4', magenta: '#c6a0f6', cyan: '#8bd5ca', white: '#cad3f5',
    brightBlack: '#5b6468', brightRed: '#ed8796', brightGreen: '#c7f36b', brightYellow: '#f4dbd6',
    brightBlue: '#91d7e3', brightMagenta: '#f5bde6', brightCyan: '#b7f4df', brightWhite: '#ffffff',
  },
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

function setConnected(connected) {
  elements.connectionState.classList.toggle('connected', connected);
  elements.statusLed.classList.toggle('connected', connected);
  elements.stateText.textContent = connected ? '已连接' : '未连接';
  elements.statusDetail.textContent = connected ? 'CONNECTED' : 'DISCONNECTED';
  elements.connect.classList.toggle('connected', connected);
  elements.connect.querySelector('.button-symbol').textContent = connected ? '×' : '↗';
  elements.connect.querySelector('span:last-child').textContent = connected ? '断开连接' : '连接串口';
  elements.emptyState.hidden = connected;
  elements.quickInput.disabled = !connected;
  elements.sendButton.disabled = !connected;
  for (const input of [elements.baudRate, elements.dataBits, elements.stopBits, elements.parity, elements.flowControl]) {
    input.disabled = connected;
  }
  if (connected) {
    elements.quickInput.focus();
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
    localEcho: elements.localEcho.checked,
    autoScroll: elements.autoScroll.checked,
    timestamps: elements.timestamps.checked,
    lineEnding: elements.lineEnding.value,
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

async function writeSerial(data, echo = false) {
  if (!port?.writable) return;
  const bytes = typeof data === 'string' ? encoder.encode(data) : data;
  const writer = port.writable.getWriter();
  try {
    await writer.write(bytes);
    txBytes += bytes.byteLength;
    const text = typeof data === 'string' ? data : decoder.decode(data);
    log.push({ time: timestamp(), direction: 'TX', data: text });
    if (echo || elements.localEcho.checked) terminal.write(text);
    updateStats();
  } finally {
    writer.releaseLock();
  }
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
        if (elements.timestamps.checked) terminal.write(`\x1b[90m[${new Date().toLocaleTimeString()}]\x1b[0m `);
        terminal.write(text);
        if (elements.autoScroll.checked) terminal.scrollToBottom();
        updateStats();
      }
    } catch (error) {
      if (!closing) {
        console.error(error);
        showToast(`读取串口失败：${error.message}`, 'error');
      }
    } finally {
      reader.releaseLock();
      reader = null;
    }
  }
}

async function connect() {
  if (!('serial' in navigator)) {
    showToast('当前浏览器不支持 Web Serial，请使用 Chrome 或 Edge', 'error');
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
    showToast('串口连接成功', 'success');
    readLoopPromise = readSerial();
  } catch (error) {
    port = null;
    if (error.name !== 'NotFoundError') showToast(`连接失败：${error.message}`, 'error');
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
    elements.portLabel.textContent = '等待设备';
    updateStats();
    showToast('串口已断开');
  }
}

async function sendQuickCommand() {
  if (!port || !elements.quickInput.value) return;
  const endings = { crlf: '\r\n', lf: '\n', cr: '\r', none: '' };
  const text = elements.quickInput.value + endings[elements.lineEnding.value];
  elements.quickInput.value = '';
  try {
    await writeSerial(text);
  } catch (error) {
    showToast(`发送失败：${error.message}`, 'error');
  }
}

function downloadLog() {
  if (!log.length) {
    showToast('当前还没有可下载的串口数据');
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
  writeSerial(data).catch((error) => showToast(`发送失败：${error.message}`, 'error'));
});

elements.connect.addEventListener('click', connect);
elements.emptyConnect.addEventListener('click', connect);
elements.sendButton.addEventListener('click', sendQuickCommand);
elements.quickInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') sendQuickCommand();
});
elements.clearTerminal.addEventListener('click', () => {
  terminal.clear();
  terminal.focus();
});
elements.downloadLog.addEventListener('click', downloadLog);
elements.sendBreak.addEventListener('click', () => writeSerial('\x03'));
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
setConnected(false);
fitAddon.fit();
updateStats();
if (!('serial' in navigator)) {
  elements.statusDetail.textContent = 'UNSUPPORTED BROWSER';
  elements.emptyState.querySelector('p').textContent = '当前浏览器不支持 Web Serial，请使用桌面版 Chrome 或 Edge。';
}
