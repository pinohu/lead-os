import fs from 'fs';
import path from 'path';

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === 'generated') continue;
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, filelist);
    } else {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const allFiles = walk(process.cwd());

const metrics = {
  totalFiles: allFiles.length,
  apiEndpoints: allFiles.filter(f => f.includes('/api/') && f.endsWith('route.ts')).length,
  pages: allFiles.filter(f => f.endsWith('page.tsx')).length,
  integrations: allFiles.filter(f => f.includes('integrations')).length,
  tests: allFiles.filter(f => f.includes('.test.')).length
};

fs.mkdirSync('generated', { recursive: true });
fs.writeFileSync('generated/metrics.json', JSON.stringify(metrics, null, 2));
fs.writeFileSync('generated/METRICS.md', '# Generated Metrics\n\n' + JSON.stringify(metrics, null, 2));

console.log(metrics);
