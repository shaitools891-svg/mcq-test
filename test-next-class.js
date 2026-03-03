// Test script to debug getNextClass function
import fs from 'fs';
import path from 'path';

// Mock the loadAppData function
function loadAppData() {
  try {
    const dataPath = path.join(process.cwd(), 'test-data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log('Loaded data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error loading app data:', error);
    return { schedule: [], teachers: [] };
  }
}

// Test the getNextClass function
function getNextClass() {
  const now = new Date();
  // For testing purposes, let's set the current time to 09:30 AM on Wednesday
  now.setHours(9, 30, 0, 0); // Set to 09:30 AM
  
  console.log('Current date and time:', now.toLocaleString());
  const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
  console.log('Current day:', currentDay);
  console.log('Current time:', currentTime);
  
  const data = loadAppData();
  const todayClasses = data.schedule
    .filter(s => (s.day === currentDay || s.day === 'Everyday') && s.startTime > currentTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  console.log('Next classes:', todayClasses);
  
  if (todayClasses.length > 0) {
    const nextClass = todayClasses[0];
    const [hours, minutes] = nextClass.startTime.split(':').map(Number);
    const nextTime = new Date();
    nextTime.setHours(hours, minutes, 0, 0);
    const minutesUntil = Math.round((nextTime.getTime() - now.getTime()) / (1000 * 60));
    const teacher = nextClass.teacherId ? data.teachers.find(t => t.id === nextClass.teacherId) || null : null;
    console.log(`\n✅ Found next class: ${nextClass.subject} in ${minutesUntil} minutes`);
    return { schedule: nextClass, teacher, minutesUntil };
  }
  
  console.log('\n❌ No upcoming class found');
  return null;
}

// Run the test
console.log('=== Testing getNextClass function ===');
console.log('======================================');
const nextClass = getNextClass();
console.log('======================================');
console.log('Result:', nextClass);
