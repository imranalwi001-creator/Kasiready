// Sound Notifications & Voice Announcer (DANA Soundbox / POS Register Audio Engine)

export interface AudioSettings {
  enabled: boolean;
  soundEffect: boolean;
  voiceAnnouncer: boolean;
  volume: number; // 0 - 100
  announcePaymentMethod?: boolean;
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  enabled: true,
  soundEffect: true,
  voiceAnnouncer: true,
  volume: 90,
  announcePaymentMethod: true,
};

// Global AudioContext singleton to comply with browser audio policies
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('AudioContext not supported or blocked:', e);
    return null;
  }
}

/**
 * Converts a number to Indonesian spoken words (e.g., 150000 -> "seratus lima puluh ribu rupiah")
 */
export function numberToIndonesianWords(num: number): string {
  if (num === 0) return 'nol rupiah';

  const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

  function terbilang(n: number): string {
    n = Math.floor(Math.abs(n));
    if (n < 12) {
      return units[n];
    } else if (n < 20) {
      return `${terbilang(n - 10)} belas`;
    } else if (n < 100) {
      const tens = Math.floor(n / 10);
      const rem = n % 10;
      return `${units[tens]} puluh ${rem ? terbilang(rem) : ''}`.trim();
    } else if (n < 200) {
      return `seratus ${terbilang(n - 100)}`.trim();
    } else if (n < 1000) {
      const hundreds = Math.floor(n / 100);
      const rem = n % 100;
      return `${units[hundreds]} ratus ${rem ? terbilang(rem) : ''}`.trim();
    } else if (n < 2000) {
      return `seribu ${terbilang(n - 1000)}`.trim();
    } else if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const rem = n % 1000;
      return `${terbilang(thousands)} ribu ${rem ? terbilang(rem) : ''}`.trim();
    } else if (n < 1000000000) {
      const millions = Math.floor(n / 1000000);
      const rem = n % 1000000;
      return `${terbilang(millions)} juta ${rem ? terbilang(rem) : ''}`.trim();
    } else if (n < 1000000000000) {
      const billions = Math.floor(n / 1000000000);
      const rem = n % 1000000000;
      return `${terbilang(billions)} miliar ${rem ? terbilang(rem) : ''}`.trim();
    }
    return n.toString();
  }

  return `${terbilang(num)} rupiah`;
}

/**
 * Plays a melodious, crisp POS register / DANA Soundbox success chime
 */
export function playPaymentSuccessChime(customVolume: number = 90): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const gainNode = ctx.createGain();
    const masterVol = Math.max(0, Math.min(1, customVolume / 100)) * 0.4;
    gainNode.gain.setValueAtTime(masterVol, ctx.currentTime);
    gainNode.connect(ctx.destination);

    // Chime notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes = [
      { freq: 523.25, time: 0, duration: 0.18 },
      { freq: 659.25, time: 0.08, duration: 0.22 },
      { freq: 783.99, time: 0.16, duration: 0.28 },
      { freq: 1046.5, time: 0.26, duration: 0.55 },
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      noteGain.gain.setValueAtTime(0, ctx.currentTime + time);
      noteGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + time + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + duration);

      osc.connect(noteGain);
      noteGain.connect(gainNode);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + duration);
    });

    // Add a gentle register bell resonance
    setTimeout(() => {
      if (ctx && ctx.state === 'running') {
        const bellOsc = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(2093, ctx.currentTime); // C7 bell ring

        bellGain.gain.setValueAtTime(masterVol * 0.15, ctx.currentTime);
        bellGain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.6);

        bellOsc.connect(bellGain);
        bellGain.connect(ctx.destination);

        bellOsc.start();
        bellOsc.stop(ctx.currentTime + 0.6);
      }
    }, 280);
  } catch (e) {
    console.warn('Error playing success chime:', e);
  }
}

/**
 * Scanner beep sound for Barcode or QR detection
 */
export function playScanBeep(customVolume: number = 80): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const vol = (customVolume / 100) * 0.25;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6 beep

    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.warn('Error playing scan beep:', e);
  }
}

/**
 * Announce successful payment with Indonesian Text-to-Speech (DANA Soundbox Voice Assistant)
 */
export function speakPaymentSuccess(
  amount: number,
  methodName: string = 'DANA',
  customerName?: string,
  settings: Partial<AudioSettings> = {}
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  const merged = { ...DEFAULT_AUDIO_SETTINGS, ...settings };
  if (!merged.enabled || !merged.voiceAnnouncer) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const spokenAmount = numberToIndonesianWords(amount);
    let readableMethod = methodName;
    if (methodName.toLowerCase().includes('dana')) readableMethod = 'DANA';
    else if (methodName.toLowerCase().includes('qris')) readableMethod = 'QRIS';
    else if (methodName.toLowerCase().includes('gopay')) readableMethod = 'GoPay';
    else if (methodName.toLowerCase().includes('ovo')) readableMethod = 'OVO';
    else if (methodName.toLowerCase().includes('cash') || methodName.toLowerCase().includes('tunai'))
      readableMethod = 'Tunai';

    const text = customerName
      ? `Pembayaran ${readableMethod} dari ${customerName} sebesar ${spokenAmount} berhasil diterima.`
      : `Pembayaran ${readableMethod} sebesar ${spokenAmount} berhasil diterima.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 1.02; // natural pace
    utterance.pitch = 1.05; // clear and friendly
    utterance.volume = Math.max(0.1, Math.min(1, (merged.volume || 90) / 100));

    // Try to pick an Indonesian voice if available
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().includes('id') ||
        v.lang.toLowerCase().includes('in') ||
        v.name.toLowerCase().includes('indonesia')
    );
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

/**
 * Complete Trigger: Plays Sound Chime + Speaks Voice Announcement together
 */
export function triggerPaymentSuccessNotification(
  amount: number,
  methodName: string = 'DANA (QR Dinamis)',
  customerName?: string,
  settings: Partial<AudioSettings> = {}
): void {
  const merged = { ...DEFAULT_AUDIO_SETTINGS, ...settings };
  if (!merged.enabled) return;

  // 1. Play musical chime first
  if (merged.soundEffect) {
    playPaymentSuccessChime(merged.volume);
  }

  // 2. Play voice announcement slightly after chime starts (350ms delay)
  if (merged.voiceAnnouncer) {
    setTimeout(() => {
      speakPaymentSuccess(amount, methodName, customerName, merged);
    }, 380);
  }
}
