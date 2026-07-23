import { loadConfigFromFile } from 'vite';
import fs from 'fs';

function logSync(msg) {
  fs.writeSync(1, msg + '\n');
}

try {
  logSync('Testing loadConfigFromFile...');
  const res = await loadConfigFromFile({ command: 'build', mode: 'production' }, 'vite.config.ts');
  logSync('loadConfigFromFile result: ' + JSON.stringify(res));
} catch (err) {
  logSync('loadConfigFromFile error: ' + (err?.stack || err));
}
