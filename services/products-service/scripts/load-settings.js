#!/usr/bin/env node
// Load local.settings.json for seed script

const fs = require('fs');
const path = require('path');

const settingsPath = path.join(process.cwd(), 'local.settings.json');

if (fs.existsSync(settingsPath)) {
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  if (settings.Values) {
    Object.assign(process.env, settings.Values);
  }
}
