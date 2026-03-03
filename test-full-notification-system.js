#!/usr/bin/env node
// Comprehensive test for notification system

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('=== Comprehensive Notification System Test ===');

// Test 1: Check if audio file exists
console.log('\n1. Checking if notification sound file exists');
const audioFilePath = path.join(process.cwd(), 'public', 'freesound_community-casio-watch-sounds-60594.m4a');

if (fs.existsSync(audioFilePath)) {
    console.log('✅ Audio file found at:', audioFilePath);
    const stats = fs.statSync(audioFilePath);
    console.log(`   Size: ${Math.round(stats.size / 1024)} KB`);
} else {
    console.log('❌ Audio file not found!');
    process.exit(1);
}

// Test 2: Check if dependencies are installed
console.log('\n2. Checking if dependencies are installed');
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    console.log('✅ package.json exists');
    
    if (fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
        console.log('✅ node_modules directory exists');
    } else {
        console.log('⚠️  node_modules not found - dependencies may not be installed');
    }
} catch (error) {
    console.log('❌ Error reading package.json:', error.message);
}

// Test 3: Run getRunningClass test
console.log('\n3. Testing getRunningClass function');
try {
    const testOutput = execSync('node test-running-class.js', { encoding: 'utf8' });
    console.log('✅ getRunningClass test passed');
    if (testOutput.includes('✅ Found running class')) {
        console.log('✅ Running class detected');
    }
} catch (error) {
    console.log('❌ getRunningClass test failed');
    console.log(error.stdout);
    console.log(error.stderr);
}

// Test 4: Check capacitor configuration
console.log('\n4. Checking Capacitor configuration');
const capacitorConfigPath = path.join(process.cwd(), 'capacitor.config.ts');
if (fs.existsSync(capacitorConfigPath)) {
    const configContent = fs.readFileSync(capacitorConfigPath, 'utf8');
    if (configContent.includes('LocalNotifications')) {
        console.log('✅ LocalNotifications plugin is configured');
    } else {
        console.log('❌ LocalNotifications plugin not found in capacitor.config.ts');
    }
} else {
    console.log('❌ capacitor.config.ts not found');
}

// Test 5: Check Android manifest for notifications
console.log('\n5. Checking Android manifest for notification permissions');
const androidManifestPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(androidManifestPath)) {
    const manifestContent = fs.readFileSync(androidManifestPath, 'utf8');
    const hasNotificationsPermission = manifestContent.includes('POST_NOTIFICATIONS');
    const hasVibrationPermission = manifestContent.includes('VIBRATE');
    
    if (hasNotificationsPermission) {
        console.log('✅ POST_NOTIFICATIONS permission found');
    } else {
        console.log('❌ POST_NOTIFICATIONS permission missing');
    }
    
    if (hasVibrationPermission) {
        console.log('✅ VIBRATE permission found');
    } else {
        console.log('❌ VIBRATE permission missing');
    }
} else {
    console.log('❌ Android manifest not found');
}

console.log('\n=== Test Summary ===');
console.log('All tests completed! Please check the results above.');

// Function to run shell commands synchronously
function execSync(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                const err = new Error(`Command failed: ${error.message}`);
                err.stdout = stdout;
                err.stderr = stderr;
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });
}
