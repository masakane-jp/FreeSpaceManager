// ビルド後、backend(Django)がIISから配信できるように
// dist/ の内容を backend/templates/index.html と backend/static/react/assets/{js,css}/ に配置する。
// web.config側のパス規則が確定していないため、パスは仮置き（後で実環境に合わせて調整すること）。
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(frontendRoot, 'dist');
const backendRoot = path.resolve(frontendRoot, '..', 'backend');
const templatesDir = path.join(backendRoot, 'templates');
const staticRoot = path.join(backendRoot, 'static', 'react', 'assets');
const jsDir = path.join(staticRoot, 'js');
const cssDir = path.join(staticRoot, 'css');

async function resetDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  await resetDir(jsDir);
  await resetDir(cssDir);
  await fs.mkdir(templatesDir, { recursive: true });

  const assetsDir = path.join(distDir, 'assets');
  const assetFiles = await fs.readdir(assetsDir);
  for (const file of assetFiles) {
    const ext = path.extname(file);
    const src = path.join(assetsDir, file);
    if (ext === '.css') {
      await fs.copyFile(src, path.join(cssDir, file));
    } else {
      // js以外(フォント・画像等)もjsフォルダにまとめて配置する
      await fs.copyFile(src, path.join(jsDir, file));
    }
  }

  // dist直下のfavicon.svgなど(public/由来のファイル)はパスを変えずそのままコピーする
  const topLevelEntries = await fs.readdir(distDir, { withFileTypes: true });
  for (const entry of topLevelEntries) {
    if (entry.isFile() && entry.name !== 'index.html') {
      await fs.copyFile(path.join(distDir, entry.name), path.join(staticRoot, '..', entry.name));
    }
  }

  let html = await fs.readFile(path.join(distDir, 'index.html'), 'utf-8');
  html = html.replace(/\/static\/react\/assets\/([^"'?]+)/g, (_match, file) => {
    const sub = path.extname(file) === '.css' ? 'css' : 'js';
    return `/static/react/assets/${sub}/${file}`;
  });
  await fs.writeFile(path.join(templatesDir, 'index.html'), html, 'utf-8');

  console.log('frontend/dist を backend/templates/index.html と backend/static/react/ に配置しました。');
}

main();
