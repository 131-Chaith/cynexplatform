import fs from 'fs';
import path from 'path';

console.log("CWD:", process.cwd());
console.log("__dirname (from cwd):", path.resolve('.'));
const envPath = path.resolve('.env');
console.log("Checking .env at:", envPath);
console.log("Exists?", fs.existsSync(envPath));

const files = fs.readdirSync('.');
console.log("Files in CWD:", files);
