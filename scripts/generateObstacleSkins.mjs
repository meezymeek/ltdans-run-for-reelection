#!/usr/bin/env node
/**
 * Generate skins/obstacles/obstacle-skins.json dynamically by scanning subfolders.
 * Usage:
 *   node scripts/generateObstacleSkins.mjs
 *
 * Behavior:
 * - Lists all immediate subdirectories of skins/obstacles (excluding hidden like .gitkeep)
 * - Optionally filters to those that contain at least the core parts (head.png, torso.png)
 * - Writes a JSON array of folder names to skins/obstacles/obstacle-skins.json
 *
 * This enables drop-in folders: just add a new folder under skins/obstacles and rerun the script
 * (or rely on npm prestart hook) to make it available in-game without changing code.
 */

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root = script dir's parent (../)
const projectRoot = path.resolve(__dirname, '..');
const obstaclesDir = path.resolve(projectRoot, 'skins', 'obstacles');
const outputPath = path.resolve(obstaclesDir, 'obstacle-skins.json');

// Minimum parts required for a folder to be considered a valid skin.
// You can relax this by removing entries or setting REQUIRE_CORE_PARTS=false
const CORE_PARTS = ['head.png', 'torso.png'];
const REQUIRE_CORE_PARTS = false; // set true if you want to only include folders with required files

async function ensureDir(dir) {
  try {
    await fsp.mkdir(dir, { recursive: true });
  } catch {
    // ignore
  }
}

async function dirExists(dir) {
  try {
    const stat = await fsp.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(file) {
  try {
    const stat = await fsp.stat(file);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function listSkinFolders() {
  const entries = await fsp.readdir(obstaclesDir, { withFileTypes: true });
  const folders = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith('.'));

  if (!REQUIRE_CORE_PARTS) return folders;

  // Filter by required files if enabled
  const filtered = [];
  for (const name of folders) {
    const base = path.join(obstaclesDir, name);
    const hasAllCore = await Promise.all(
      CORE_PARTS.map((f) => fileExists(path.join(base, f)))
    ).then((arr) => arr.every(Boolean));

    if (hasAllCore) filtered.push(name);
  }
  return filtered;
}

async function main() {
  const exists = await dirExists(obstaclesDir);
  if (!exists) {
    console.error(`[generateObstacleSkins] Directory not found: ${obstaclesDir}`);
    process.exit(1);
  }

  const skins = await listSkinFolders();
  skins.sort((a, b) => a.localeCompare(b));

  await ensureDir(obstaclesDir);
  await fsp.writeFile(outputPath, JSON.stringify(skins, null, 2), 'utf8');

  console.log(`[generateObstacleSkins] Wrote ${skins.length} skin(s) to ${path.relative(projectRoot, outputPath)}`);
  if (skins.length) {
    console.log(skins.map((s) => ` - ${s}`).join('\n'));
  } else {
    console.log('No skin folders detected. Add folders under skins/obstacles and rerun.');
  }
}

// If run directly
if (import.meta.url === `file://${__filename}`) {
  main().catch((err) => {
    console.error('[generateObstacleSkins] Failed:', err);
    process.exit(1);
  });
}
