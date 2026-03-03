// Test script to debug getRunningClass function
import fs from 'fs';
import path from 'path';

// Mock the loadAppData function
function loadAppData() {
  try {
    const dataPath = path.join(process.cwd(), 'test-data.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      console.log('Loaded data:', JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log('Test data file not found. Creating sample data...');
      const sampleData = {
        schedule: [
          { 
            id: '1', 
            className: 'Play 1', 
            subject: 'Mathematics', 
            startTime: '09:00', 
            endTime: '10:00', 
            day: 'Monday',
            teacherId: null
          },
          { 
            id: '2', 
            className: 'Play 1', 
            subject: 'Science', 
            startTime: '10:00', 
            endTime: '11:00', 
            day: 'Everyday',
            teacherId: null
          },
          { 
            id: '3', 
            className: 'Play 1', 
            subject: 'English', 
            startTime: '11:00', 
            endTime: '12:00', 
            day: 'Monday',
            teacherId: null
          }
        ],
        teachers: []
      };
      fs.writeFileSync(dataPath, JSON.stringify(sampleData, null, 2));
      return sampleData;
    }
  } catch (error) {
    console.error('Error loading app data:', error);
    return { schedule: [], teachers: [] };
  }
}

// Test the getRunningClass function
function getRunningClass() {
  const now = new Date();
  // For testing purposes, let's set the current time to 10:05 AM on Wednesday
  now.setHours(10, 5, 0, 0); // Set to 10:05 AM
  // now.setDate(now.getDate() + ((1 - now.getDay() + 7) % 7)); // Set to Monday
  
  console.log('Current date and time:', now.toLocaleString());
  const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  console.log('Current day:', currentDay);
  
  const data = loadAppData();
  const todayClasses = data.schedule
    .filter(s => s.day === currentDay || s.day === 'Everyday')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  console.log('Today\'s classes:', todayClasses);
  
  for (const cls of todayClasses) {
    // Convert class times to Date objects for proper comparison
    const [startHours, startMinutes] = cls.startTime.split(':').map(Number);
    const [endHours, endMinutes] = cls.endTime.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startHours, startMinutes, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(endHours, endMinutes, 0, 0);
    
    console.log(`\nChecking class: ${cls.subject} (${cls.startTime} - ${cls.endTime})`);
    console.log('Start time:', startTime.toLocaleTimeString());
    console.log('End time:', endTime.toLocaleTimeString());
    console.log('Current time:', now.toLocaleTimeString());
    console.log('Is running:', now >= startTime && now <= endTime);
    
    if (now >= startTime && now <= endTime) {
      const teacher = cls.teacherId ? data.teachers.find(t => t.id === cls.teacherId) || null : null;
      console.log('\n✅ Found running class:', cls.subject);
      return { schedule: cls, teacher };
    }
  }
  
  console.log('\n❌ No class is currently running');
  return null;
}

// Run the test
console.log('=== Testing getRunningClass function ===');
console.log('========================================');
const runningClass = getRunningClass();
console.log('========================================');
console.log('Result:', runningClass);
