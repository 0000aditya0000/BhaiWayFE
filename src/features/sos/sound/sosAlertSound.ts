import { getExpoAv } from '@/startup/loadExpoAv';

const SOS_ALERT_ASSET = require('../../../../assets/sounds/sos-alert.wav');

type SoundHandle = {
  stopAsync?: () => Promise<unknown>;
  unloadAsync?: () => Promise<unknown>;
  setIsLoopingAsync?: (value: boolean) => Promise<unknown>;
  playAsync?: () => Promise<unknown>;
  loadAsync?: (source: unknown, initialStatus?: unknown, downloadFirst?: boolean) => Promise<unknown>;
};

let sound: SoundHandle | null = null;
let playingSosId: string | null = null;

const unload = async (): Promise<void> => {
  const current = sound;
  sound = null;
  playingSosId = null;
  if (!current) {
    return;
  }
  try {
    await current.stopAsync?.();
  } catch {
    // ignore
  }
  try {
    await current.unloadAsync?.();
  } catch {
    // ignore
  }
};

export const sosAlertSound = {
  getPlayingSosId: (): string | null => playingSosId,

  start: async (sosId: string): Promise<void> => {
    const id = sosId.trim();
    if (!id) {
      return;
    }
    if (playingSosId === id && sound) {
      return;
    }
    await unload();
    const expoAv = getExpoAv();
    if (!expoAv?.Audio) {
      return;
    }
    try {
      await expoAv.Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const created = await expoAv.Audio.Sound.createAsync(
        SOS_ALERT_ASSET,
        { isLooping: true, volume: 1, shouldPlay: true },
      );
      sound = created.sound as SoundHandle;
      playingSosId = id;
    } catch {
      await unload();
    }
  },

  stop: async (): Promise<void> => {
    await unload();
  },
};
