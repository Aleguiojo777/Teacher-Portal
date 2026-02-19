#!/usr/bin/env node

/**
 * Favicon Generator Script
 * Converts techvision.png to favicon.ico and favicon-apple.png
 * 
 * Usage: node generate-favicon.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.error('❌ Error: sharp package not found');
  console.log('\nInstalling sharp...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install sharp', { stdio: 'inherit' });
    sharp = require('sharp');
  } catch (installErr) {
    console.error('Failed to install sharp. Please run: npm install sharp');
    process.exit(1);
  }
}

const resourcesDir = path.join(__dirname, 'frontend', 'resources');
const sourceLogo = path.join(resourcesDir, 'techvision.png');
const faviconIco = path.join(resourcesDir, 'favicon.ico');
const faviconApple = path.join(resourcesDir, 'favicon-apple.png');

console.log('🎨 Favicon Generator - TechVision');
console.log('==================================\n');

// Check if source logo exists
if (!fs.existsSync(sourceLogo)) {
  console.error(`❌ Source logo not found: ${sourceLogo}`);
  process.exit(1);
}

console.log(`📁 Source: ${sourceLogo}`);
console.log(`💾 Output: ${faviconIco}`);
console.log(`💾 Output: ${faviconApple}\n`);

let completedTasks = 0;
const totalTasks = 2;

// Generate favicon.ico (32x32)
console.log('⏳ Generating favicon.ico (32x32)...');
sharp(sourceLogo)
  .resize(32, 32, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 0 }
  })
  .toFile(faviconIco)
  .then(info => {
    console.log(`✅ favicon.ico created (${info.size} bytes)\n`);
    completedTasks++;
    checkComplete();
  })
  .catch(err => {
    console.error(`❌ Error generating favicon.ico:`, err.message);
    process.exit(1);
  });

// Generate favicon-apple.png (180x180)
console.log('⏳ Generating favicon-apple.png (180x180)...');
sharp(sourceLogo)
  .resize(180, 180, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 0 }
  })
  .toFile(faviconApple)
  .then(info => {
    console.log(`✅ favicon-apple.png created (${info.size} bytes)\n`);
    completedTasks++;
    checkComplete();
  })
  .catch(err => {
    console.error(`❌ Error generating favicon-apple.png:`, err.message);
    process.exit(1);
  });

function checkComplete() {
  if (completedTasks === totalTasks) {
    console.log('==================================');
    console.log('✅ Favicon generation complete!\n');
    console.log('📋 Files created:');
    console.log(`   ✓ ${faviconIco}`);
    console.log(`   ✓ ${faviconApple}\n`);
    console.log('🚀 Next steps:');
    console.log('   1. Start your server: npm start (in backend folder)');
    console.log('   2. Open browser: http://localhost:3000');
    console.log('   3. Hard refresh (Ctrl+Shift+R) if logo not showing');
    console.log('   4. Share app with: npm install -g localtunnel');
    console.log('                      lt --port 3000 --subdomain=teacher-portal\n');
  }
}
