import { Platform } from 'react-native';

// ─── Native Haptics ─────────────────────────────────────────────

let Haptics: typeof import('expo-haptics') | null = null;

if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics');
  } catch {
    // expo-haptics not available
  }
}

// ─── Web Audio Synthesis ────────────────────────────────────────

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/**
 * Synthesize a warm, short "pop" sound via Web Audio API.
 * Sine wave with a quick pitch drop + gentle attack/decay envelope.
 * ~100ms total, barely perceptible but subconsciously satisfying.
 */
function playWebPop() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browsers require user gesture)
  if (ctx.state === 'suspended') ctx.resume();

  const t = ctx.currentTime;

  // Primary tone: warm sine with pitch drop
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.09);

  // Subtle harmonic for richness (octave above, very quiet)
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(780, t);
  osc2.frequency.exponentialRampToValueAtTime(280, t + 0.07);

  // Gain envelope: gentle attack, smooth decay
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.08, t + 0.006);   // ~6ms attack
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1); // ~100ms decay

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0, t);
  gain2.gain.linearRampToValueAtTime(0.025, t + 0.006);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

  osc.connect(gain);
  osc2.connect(gain2);
  gain.connect(ctx.destination);
  gain2.connect(ctx.destination);

  osc.start(t);
  osc.stop(t + 0.12);
  osc2.start(t);
  osc2.stop(t + 0.09);
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Subtle feedback for card tap — warm pop on web, light haptic on native.
 * Designed to be barely conscious but subconsciously rewarding.
 */
export function tapFeedback() {
  if (Platform.OS === 'web') {
    playWebPop();
  } else if (Haptics) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}
