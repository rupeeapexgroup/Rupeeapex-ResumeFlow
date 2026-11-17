import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'storage', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Locate mongod binary in cache
const cachedMongod = path.join(
  process.cwd(),
  'node_modules',
  '.cache',
  'mongodb-memory-server',
  'mongod-x64-win32-8.2.6.exe'
);

const mongodCmd = fs.existsSync(cachedMongod) ? cachedMongod : 'mongod';

console.log('--- Starting ResumeFlow MongoDB Service ---');
console.log(`Database storage path: ${dbDir}`);
console.log(`Listening on: 127.0.0.1:27017`);

const child = spawn(mongodCmd, ['--dbpath', dbDir, '--port', '27017', '--bind_ip', '127.0.0.1'], {
  stdio: 'inherit',
});

child.on('exit', (code) => {
  console.log(`MongoDB service stopped (exit code: ${code})`);
});
