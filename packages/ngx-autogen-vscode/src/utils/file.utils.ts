import * as fs from 'fs';

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeFileIfNotExists(filePath: string, content: string): void {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

export function appendToBarrel(barrelPath: string, exportLine: string): void {
  const existing = fs.existsSync(barrelPath) ? fs.readFileSync(barrelPath, 'utf8') : '';
  if (!existing.includes(exportLine)) {
    fs.appendFileSync(barrelPath, `\n${exportLine}`);
  }
}
