// ============================================================
// SMS Vault v2.0 - Haptics Feedback
// Wrapper around react-native haptic patterns.
// Falls back gracefully when native haptics are unavailable.
// ============================================================

import { Platform, Vibration } from 'react-native';

export type HapticPattern =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'click';

// Approximate vibration durations used as a fallback when the
// platform does not expose richer haptic feedback APIs.
const VIBRATION_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [0, 20, 40, 40],
  warning: [0, 40, 60, 40],
  error: [0, 60, 120, 60, 120, 60],
  selection: 8,
  click: 6,
};

// Optional native module. Loaded dynamically so the import does not
// break purely JS environments (e.g. tests, web).
async function getNativeHaptics(): Promise<{
  impact: (style: 'light' | 'medium' | 'heavy') => void;
  notification: (type: 'success' | 'warning' | 'error') => void;
  selection: () => void;
} | null> {
  try {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
    // Lazily require to avoid crashing on platforms that don't have it.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-performance/Haptics') as {
      impact: (style: 'light' | 'medium' | 'heavy') => void;
      notification: (type: 'success' | 'warning' | 'error') => void;
      selection: () => void;
    };
    return mod;
  } catch {
    return null;
  }
}

export async function triggerHaptic(pattern: HapticPattern): Promise<void> {
  const native = await getNativeHaptics();

  if (native) {
    switch (pattern) {
      case 'light':
        native.impact('light');
        return;
      case 'medium':
        native.impact('medium');
        return;
      case 'heavy':
        native.impact('heavy');
        return;
      case 'success':
      case 'warning':
      case 'error':
        native.notification(pattern);
        return;
      case 'selection':
        native.selection();
        return;
      case 'click':
        native.impact('light');
        return;
    }
  }

  // Vibration fallback
  const vibPattern = VIBRATION_PATTERNS[pattern];
  if (Platform.OS === 'android' && typeof vibPattern === 'number') {
    Vibration.vibrate(vibPattern);
  } else if (Array.isArray(vibPattern)) {
    Vibration.vibrate(vibPattern);
  } else if (typeof vibPattern === 'number') {
    Vibration.vibrate(vibPattern);
  }
}

// Synchronous fire-and-forget variant for button presses.
export function haptic(pattern: HapticPattern): void {
  triggerHaptic(pattern).catch(() => {
    // Haptics are best-effort; ignore failures.
  });
}

export const Haptics = { trigger: triggerHaptic, haptic };
export default Haptics;
