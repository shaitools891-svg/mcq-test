import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Haptic categories that users can toggle individually
export type HapticCategory = 'navigation' | 'actions' | 'selection' | 'success' | 'errors';

export interface HapticSettings {
  enabled: boolean;
  navigation: boolean;
  actions: boolean;
  selection: boolean;
  success: boolean;
  errors: boolean;
}

const DEFAULT_HAPTIC_SETTINGS: HapticSettings = {
  enabled: true,
  navigation: true,
  actions: true,
  selection: true,
  success: true,
  errors: true,
};

// Get haptic settings from localStorage
export const getHapticSettings = (): HapticSettings => {
  try {
    const stored = localStorage.getItem('hapticSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all properties exist with defaults
      return {
        enabled: parsed.enabled ?? true,
        navigation: parsed.navigation ?? true,
        actions: parsed.actions ?? true,
        selection: parsed.selection ?? true,
        success: parsed.success ?? true,
        errors: parsed.errors ?? true,
      };
    }
  } catch (e) {
    console.warn('[Haptics] Failed to load haptic settings:', e);
  }
  return DEFAULT_HAPTIC_SETTINGS;
};

// Save haptic settings to localStorage
export const saveHapticSettings = (settings: HapticSettings) => {
  try {
    localStorage.setItem('hapticSettings', JSON.stringify(settings));
  } catch (e) {
    console.warn('[Haptics] Failed to save haptic settings:', e);
  }
};

// Check if a specific haptic category is enabled
const isCategoryEnabled = (category: HapticCategory): boolean => {
  const settings = getHapticSettings();
  
  // Master switch - if disabled, no haptics
  if (!settings.enabled) {
    console.log('[Haptics] Master switch disabled');
    return false;
  }
  
  // Check specific category
  const isEnabled = settings[category] === true;
  console.log(`[Haptics] Category "${category}" ${isEnabled ? 'enabled' : 'disabled'}`);
  return isEnabled;
};

// Direct vibration using Navigator.vibrate() - works independently of system settings
const vibrate = (pattern: number | number[]) => {
  if (navigator.vibrate) {
    console.log('[Haptics] Using direct vibration API, pattern:', pattern);
    navigator.vibrate(pattern);
  } else {
    console.warn('[Haptics] Vibration API not supported');
  }
};

// Navigation haptics - Light impact for navigation actions (10ms)
export const hapticNavigation = async () => {
  if (!isCategoryEnabled('navigation')) return;
  try {
    console.log('[Haptics] Triggering navigation haptic');
    // Use direct vibration for reliable feedback
    vibrate(10);
    // Also try Capacitor haptics for devices with haptic motors
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    console.log('[Haptics] Navigation haptic success');
  } catch (e) {
    console.warn('[Haptics] Navigation haptic failed:', e);
  }
};

// Action haptics - Medium impact for general actions (20ms)
export const hapticAction = async (style: ImpactStyle = ImpactStyle.Medium) => {
  if (!isCategoryEnabled('actions')) return;
  try {
    console.log(`[Haptics] Triggering action haptic with style: ${style}`);
    // Duration based on style
    const duration = style === ImpactStyle.Heavy ? 30 : style === ImpactStyle.Light ? 10 : 20;
    vibrate(duration);
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
    console.log('[Haptics] Action haptic success');
  } catch (e) {
    console.warn('[Haptics] Action haptic failed:', e);
  }
};

// Selection haptics - For pickers, selectors, toggles (10ms)
export const hapticSelection = async () => {
  if (!isCategoryEnabled('selection')) return;
  try {
    console.log('[Haptics] Triggering selection haptic');
    vibrate(10);
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    console.log('[Haptics] Selection haptic success');
  } catch (e) {
    console.warn('[Haptics] Selection haptic failed:', e);
  }
};

// Success haptics - Double pulse for completed operations
export const hapticSuccess = async () => {
  if (!isCategoryEnabled('success')) return;
  try {
    console.log('[Haptics] Triggering success haptic');
    // Double pulse: 20ms vibration, 50ms pause, 20ms vibration
    vibrate([20, 50, 20]);
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Success });
    }
    console.log('[Haptics] Success haptic success');
  } catch (e) {
    console.warn('[Haptics] Success haptic failed:', e);
  }
};

// Error haptics - Heavy impact for errors (3 long pulses)
export const hapticError = async () => {
  if (!isCategoryEnabled('errors')) return;
  try {
    console.log('[Haptics] Triggering error haptic');
    // Triple heavy pulse
    vibrate([50, 30, 50, 30, 50]);
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Error });
    }
    console.log('[Haptics] Error haptic success');
  } catch (e) {
    console.warn('[Haptics] Error haptic failed:', e);
  }
};

// Warning haptics - Heavy impact for warnings (2 medium pulses)
export const hapticWarning = async () => {
  if (!isCategoryEnabled('errors')) return;
  try {
    console.log('[Haptics] Triggering warning haptic');
    vibrate([30, 50, 30]);
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Warning });
    }
    console.log('[Haptics] Warning haptic success');
  } catch (e) {
    console.warn('[Haptics] Warning haptic failed:', e);
  }
};

// Legacy support - maps to action haptic
export const hapticImpact = async (style: ImpactStyle = ImpactStyle.Medium) => {
  if (!isCategoryEnabled('actions')) return;
  try {
    console.log(`[Haptics] Triggering impact haptic with style: ${style}`);
    const duration = style === ImpactStyle.Heavy ? 30 : style === ImpactStyle.Light ? 10 : 20;
    vibrate(duration);
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
    console.log('[Haptics] Impact haptic success');
  } catch (e) {
    console.warn('[Haptics] Impact haptic failed:', e);
  }
};

// Toggle haptics - Light impact for toggle switches (10ms)
export const hapticToggle = async () => {
  if (!isCategoryEnabled('selection')) return;
  try {
    console.log('[Haptics] Triggering toggle haptic');
    vibrate(10);
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    console.log('[Haptics] Toggle haptic success');
  } catch (e) {
    console.warn('[Haptics] Toggle haptic failed:', e);
  }
};

// Destructive action haptics - Heavy impact for delete operations (40ms)
export const hapticDestructive = async () => {
  if (!isCategoryEnabled('actions')) return;
  try {
    console.log('[Haptics] Triggering destructive haptic');
    vibrate(40);
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
    console.log('[Haptics] Destructive haptic success');
  } catch (e) {
    console.warn('[Haptics] Destructive haptic failed:', e);
  }
};
