#!/usr/bin/env node

import { writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get __dirname equivalent in ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));
const targetDir = join(dirname(__dirname), '.builtin-types');

const REPO = 'jaculus-org/Jaculus-esp32';
const TYPES_PATH = 'ts-examples/@types';

const apiUrl = `https://api.github.com/repos/${REPO}/contents/${TYPES_PATH}`;

async function downloadFile(url: string, outputPath: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);

  const content = await response.text();
  writeFileSync(outputPath, content);
  console.log(`✓ ${basename(outputPath)}`);
}

async function downloadDirectory(url: string, targetPath: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch directory: ${response.statusText}`);

  const files = await response.json();

  if (!existsSync(targetPath)) {
    mkdirSync(targetPath, { recursive: true });
  }

  for (const file of files) {
    const outputPath = join(targetPath, file.name);

    if (file.type === 'file' && file.download_url) {
      await downloadFile(file.download_url, outputPath);
    } else if (file.type === 'dir') {
      await downloadDirectory(file.url, outputPath);
    }
  }
}

console.log('Downloading types...');

// Clean up
if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true });
}

try {
  await downloadDirectory(apiUrl, targetDir);
  console.log(`✅ Done! Types saved to ${targetDir}`);
} catch (error) {
  console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
}
