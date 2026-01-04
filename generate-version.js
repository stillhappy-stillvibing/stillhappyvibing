#!/usr/bin/env node

/**
 * Generate version.json file for version checking
 * This script runs during the build process to create a version file
 * that the app can fetch to check for updates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json to get the current version
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Create version object
const versionInfo = {
  version: packageJson.version,
  buildDate: new Date().toISOString()
};

// Write to public/version.json
const outputPath = path.join(__dirname, 'public', 'version.json');
fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2));

console.log(`✓ Generated version.json: v${versionInfo.version} (${versionInfo.buildDate})`);
