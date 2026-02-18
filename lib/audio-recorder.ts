/**
 * Утилиты для записи и воспроизведения аудио (диктофон).
 * Использует expo-av и expo-file-system.
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

function getRecordingsDir(): string {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error('documentDirectory недоступен');
  return `${base}gonext_recordings/`;
}

async function ensureRecordingsDir(): Promise<string> {
  const dir = getRecordingsDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Запросить разрешение на запись аудио.
 * @returns true если разрешение выдано, false иначе
 */
export async function requestAudioPermission(): Promise<boolean> {
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}

/**
 * Настроить аудио-режим для записи и воспроизведения.
 * Вызывать перед началом записи.
 */
export async function setupAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

export type RecordingState = 'idle' | 'recording' | 'stopping';

export interface RecordingCallbacks {
  onStateChange?: (state: RecordingState) => void;
  onDurationUpdate?: (durationMillis: number) => void;
}

export type RecordingHandle = Audio.Recording;

/**
 * Начать запись аудио.
 * @returns Объект Recording для последующей остановки или null при ошибке
 */
export async function startRecording(
  callbacks?: RecordingCallbacks
): Promise<RecordingHandle | null> {
  const granted = await requestAudioPermission();
  if (!granted) {
    return null;
  }

  await setupAudioMode();

  try {
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
      (status) => {
        if (status.isRecording && status.durationMillis !== undefined) {
          callbacks?.onDurationUpdate?.(status.durationMillis);
        }
      },
      500
    );

    callbacks?.onStateChange?.('recording');
    return recording;
  } catch (e) {
    console.error('Ошибка начала записи:', e);
    callbacks?.onStateChange?.('idle');
    return null;
  }
}

/**
 * Остановить запись и сохранить файл в директорию приложения.
 * @param recording — объект Recording из startRecording
 * @returns URI сохранённого файла или null
 */
export async function stopRecordingAndSave(
  recording: RecordingHandle
): Promise<string | null> {
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    if (!uri) return null;

    // Копируем в постоянную директорию приложения
    const dir = await ensureRecordingsDir();
    const filename = `recording_${Date.now()}.m4a`;
    const destUri = `${dir}${filename}`;

    await FileSystem.copyAsync({ from: uri, to: destUri });

    return destUri;
  } catch (e) {
    console.error('Ошибка остановки записи:', e);
    return null;
  }
}

function ensureAudioUri(uri: string): string {
  if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('http')) {
    return uri;
  }
  return `file://${uri.startsWith('/') ? '' : '/'}${uri}`;
}

/**
 * Воспроизвести аудио по URI.
 */
export async function playAudio(uri: string): Promise<Audio.Sound> {
  const { sound } = await Audio.Sound.createAsync(
    { uri: ensureAudioUri(uri) },
    { shouldPlay: true }
  );
  return sound;
}
