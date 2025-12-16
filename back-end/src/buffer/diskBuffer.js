import fs from 'fs';
import path from 'path';

const BUFFER_DIR = path.resolve('./disk-buffer');

if (!fs.existsSync(BUFFER_DIR)) {
  fs.mkdirSync(BUFFER_DIR);
}

export function writeToDisk(aircraftId, data) {
  const filePath = path.join(BUFFER_DIR, `${aircraftId}.log`);
  fs.appendFileSync(filePath, JSON.stringify(data) + '\n');
}

export function readFromDisk(aircraftId) {
  const filePath = path.join(BUFFER_DIR, `${aircraftId}.log`);
  if (!fs.existsSync(filePath)) return [];

  const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
  return lines.map(line => JSON.parse(line));
}

export function clearDiskBuffer(aircraftId) {
  const filePath = path.join(BUFFER_DIR, `${aircraftId}.log`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
