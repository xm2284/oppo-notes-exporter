import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

export function findBrowserExecutable() {
  const platform = os.platform();
  const candidates = [];

  if (platform === 'win32') {
    const local = process.env.LOCALAPPDATA || '';
    const prog = process.env.ProgramFiles || 'C:\\Program Files';
    const prog86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    candidates.push(
      path.join(prog86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(prog, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(prog, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(prog86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe')
    );
  } else if (platform === 'darwin') {
    candidates.push(
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    );
  } else {
    candidates.push(
      'google-chrome',
      'google-chrome-stable',
      'microsoft-edge',
      'microsoft-edge-stable',
      'chromium-browser',
      'chromium'
    );
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function launchDebugBrowser({ executablePath, port = 9222, userDataDir }) {
  const finalUserDataDir = userDataDir || path.join(os.tmpdir(), `oppo_exporter_${Date.now()}`);
  fs.mkdirSync(finalUserDataDir, { recursive: true });

  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${finalUserDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'https://cloud.oppo.com/owork/mapp/sticky-notes/'
  ];

  const proc = spawn(executablePath, args, {
    detached: true,
    stdio: 'ignore'
  });
  proc.unref();

  return { proc, port, userDataDir: finalUserDataDir };
}
