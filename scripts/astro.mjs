import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const [major, minor] = process.versions.node.split('.').map(Number);
const compatible = major > 22 || (major === 22 && minor >= 19);
const localNode = join(root, '.tools/node_modules/node/bin', process.platform === 'win32' ? 'node.exe' : 'node');
if (!compatible && !existsSync(localNode)) {
  console.error('需要 Node.js 22.19+（推荐 Node 24 LTS）。或在本项目运行 npm install --prefix .tools node@24 --no-save 安装独立运行环境。');
  process.exit(1);
}
const child = spawn(compatible ? process.execPath : localNode, [join(root, 'node_modules/astro/bin/astro.mjs'), ...process.argv.slice(2)], {
  cwd: root, stdio: 'inherit', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
