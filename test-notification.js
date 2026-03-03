// Test script to verify notification functionality

const { checkForRunningClassOnStartup, getNotificationSettings } = require('./src/utils/notificationUtils');
const { addSchedule } = require('./src/utils/routineStorage');

console.log('Testing notification functionality...');

// Check current notification settings
const settings = getNotificationSettings();
console.log('Notification settings:', settings);

// Create a test schedule (current time)
const now = new Date();
const startTime = `${now.getHours().toString().padStart(2, '0')}:${(now.getMinutes() - 5).toString().padStart(2, '0')}`;
const endTime = `${now.getHours().toString().padStart(2, '0')}:${(now.getMinutes() + 15).toString().padStart(2, '0')}`;
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const currentDay = days[now.getDay()];

console.log('Creating test schedule...');
console.log('Current time:', now.toLocaleTimeString());
console.log('Start time:', startTime);
console.log('End time:', endTime);
console.log('Day:', currentDay);

try {
  const testSchedule = addSchedule({
    className: 'Test Class',
    subject: 'Mathematics',
    startTime: startTime,
    endTime: endTime,
    day: currentDay,
    teacherId: null,
    shadowTeacherId: null
  });
  
  console.log('Test schedule created successfully:', testSchedule);
  
  // Check for running class
  console.log('Checking for running class...');
  checkForRunningClassOnStartup().then((runningClass) => {
    if (runningClass) {
      console.log('✅ Notification should have been shown!');
      console.log('Running class:', runningClass.schedule.className, '-', runningClass.schedule.subject);
    } else {
      console.log('❌ No running class found');
    }
  });
  
} catch (error) {
  console.error('Error:', error);
}