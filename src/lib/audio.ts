/**
 * Scan confirmation beep using Web Audio API.
 * No audio file required. Creates a synthesised 1800Hz square wave
 * for 80ms — short and distinctive in a noisy store environment.
 *
 * The AudioContext is created on first user interaction to satisfy
 * browser autoplay policies.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playBeep(): void {
  try {
    const context = getAudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = 'square';
    oscillator.frequency.value = 1800;
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.08);
  } catch {
    // Silently ignore audio errors — scanning still works without sound
  }
}

export function initAudioContext(): void {
  // Call on first user interaction to unlock audio
  getAudioContext();
}
