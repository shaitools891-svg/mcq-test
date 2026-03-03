import { Capacitor } from '@capacitor/core'
import { Haptics, NotificationType } from '@capacitor/haptics'
import { LocalNotifications } from '@capacitor/local-notifications'
import { getRunningClass } from './routineStorage'
import { toast } from 'sonner'

// Notification settings interface
export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

// Get notification settings from localStorage
export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem('notificationSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        enabled: parsed.enabled ?? true,
        soundEnabled: parsed.soundEnabled ?? true,
        vibrationEnabled: parsed.vibrationEnabled ?? true,
      };
    }
  } catch (e) {
    console.warn('[Notifications] Failed to load notification settings:', e);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
};

// Save notification settings to localStorage
export const saveNotificationSettings = (settings: NotificationSettings) => {
  try {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  } catch (e) {
    console.warn('[Notifications] Failed to save notification settings:', e);
  }
};

// Play notification sound
export const playNotificationSound = async () => {
  // Check if sound is temporarily disabled
  if (!notificationSoundEnabled) {
    console.log('[Notifications] Notification sound temporarily disabled');
    return;
  }
  
  try {
    console.log('[Notifications] Attempting to play notification sound');
    
    // Check if audio is available
    if (typeof window !== 'undefined') {
  // Try different paths for the audio file
  const audioPaths = [
    '/freesound_community-casio-watch-sounds-60594.m4a',
    'freesound_community-casio-watch-sounds-60594.m4a',
    'public/freesound_community-casio-watch-sounds-60594.m4a',
    './freesound_community-casio-watch-sounds-60594.m4a',
    '/assets/freesound_community-casio-watch-sounds-60594.m4a'
  ];
      
      for (const path of audioPaths) {
        try {
          console.log('[Notifications] Trying audio path:', path);
          const audio = new Audio(path);
          audio.volume = 0.7; // 70% volume
          
          // Store reference to current audio
          currentAudio = audio;
          
          // Play the audio
          await audio.play();
          console.log('[Notifications] Notification sound played successfully from:', path);
          
          // Clear reference when audio ends
          audio.onended = () => {
            if (currentAudio === audio) {
              currentAudio = null;
            }
          };
          
          return; // Success, stop trying other paths
        } catch (error) {
          console.warn('[Notifications] Failed to play from', path, ':', error);
        }
      }
      
      console.error('[Notifications] All audio paths failed');
    }
  } catch (error) {
    console.error('[Notifications] Failed to play notification sound:', error);
  }
};

// Vibrate device
export const vibrateDevice = async () => {
  try {
    if (navigator.vibrate) {
      // Long vibration for notification
      navigator.vibrate([200, 100, 200]);
      console.log('[Notifications] Device vibrated');
    }
    
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Success });
    }
  } catch (error) {
    console.warn('[Notifications] Failed to vibrate device:', error);
  }
};

// Show running class notification
let lastNotifiedClassId: string | null = null;
let currentAudio: HTMLAudioElement | null = null;
let notificationSoundEnabled: boolean = true;

// Get volume button control setting
export const getVolumeButtonControlSetting = (): boolean => {
  try {
    const stored = localStorage.getItem('volumeButtonControl');
    if (stored !== null) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[Notifications] Failed to get volume button control setting:', error);
  }
  return true; // Default to enabled
};

// Save volume button control setting
export const saveVolumeButtonControlSetting = (enabled: boolean) => {
  try {
    localStorage.setItem('volumeButtonControl', JSON.stringify(enabled));
  } catch (error) {
    console.warn('[Notifications] Failed to save volume button control setting:', error);
  }
};

// Function to stop current notification sound
export const stopNotificationSound = () => {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
      console.log('[Notifications] Notification sound stopped');
    } catch (error) {
      console.error('[Notifications] Error stopping sound:', error);
    }
  }
};

// Function to temporarily disable notification sound (will be re-enabled later)
export const temporarilyDisableNotificationSound = () => {
  notificationSoundEnabled = false;
  stopNotificationSound();
  console.log('[Notifications] Notification sound temporarily disabled');
  
  // Re-enable after 5 minutes
  setTimeout(() => {
    notificationSoundEnabled = true;
    console.log('[Notifications] Notification sound re-enabled');
  }, 5 * 60 * 1000);
};

export const showRunningClassNotification = async () => {
  console.log('[Notifications] Starting showRunningClassNotification');
  
  const settings = getNotificationSettings();
  console.log('[Notifications] Notification settings:', settings);
  
  if (!settings.enabled) {
    console.log('[Notifications] Notifications disabled');
    return;
  }
  
  const runningClass = getRunningClass();
  console.log('[Notifications] Found running class:', runningClass);
  
  if (!runningClass) {
    console.log('[Notifications] No running class');
    lastNotifiedClassId = null; // Reset when no class is running
    return;
  }
  
  // Check if we already notified for this class
  if (lastNotifiedClassId === runningClass.schedule.id) {
    console.log('[Notifications] Already notified for this class');
    return;
  }
  
  // Update last notified class
  lastNotifiedClassId = runningClass.schedule.id;
  
  // Play sound if enabled
  if (settings.soundEnabled) {
    console.log('[Notifications] Attempting to play sound');
    await playNotificationSound();
  } else {
    console.log('[Notifications] Sound is disabled');
  }
  
  // Vibrate if enabled
  if (settings.vibrationEnabled) {
    console.log('[Notifications] Attempting to vibrate');
    await vibrateDevice();
  } else {
    console.log('[Notifications] Vibration is disabled');
  }
  
  // Show toast notification
  toast.success(`Running Class: ${runningClass.schedule.className} - ${runningClass.schedule.subject}`, {
    duration: 4000,
    description: `Started at ${runningClass.schedule.startTime}, ends at ${runningClass.schedule.endTime}`
  });
  
  // Show native notification on mobile
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Running Class',
            body: `${runningClass.schedule.className} - ${runningClass.schedule.subject}`,
            id: 1,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: settings.soundEnabled ? 'default' : undefined
          }
        ]
      });
    } catch (error) {
      console.error('[Notifications] Failed to show native notification:', error);
    }
  }
  
  return runningClass;
};

// Check for running class on app startup
// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  console.log('[Notifications] Requesting notification permissions');
  
  try {
    if (Capacitor.isNativePlatform()) {
      const permResult = await LocalNotifications.requestPermissions();
      console.log('[Notifications] Local notifications permissions:', permResult);
      
      // Also check if we have audio permissions if needed
      // For Android 13+, we might need POST_NOTIFICATIONS permission
    }
    
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to request permissions:', error);
    return false;
  }
};

export const checkForRunningClassOnStartup = async () => {
  console.log('[Notifications] Checking for running class on startup');
  
  // Request permissions first
  const permissionsGranted = await requestNotificationPermissions();
  if (!permissionsGranted) {
    console.log('[Notifications] Permissions not granted');
    return null;
  }
  
  return await showRunningClassNotification();
};
