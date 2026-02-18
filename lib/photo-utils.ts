/**
 * Утилиты для работы с фотографиями: выбор из галереи/камеры,
 * сохранение в директорию приложения и в галерею устройства.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

function getPhotosDir(): string {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error('documentDirectory недоступен');
  return `${base}gonext_photos/`;
}

async function ensurePhotosDir(): Promise<string> {
  const dir = getPhotosDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

function ensureFileUri(uri: string): string {
  if (uri.startsWith('file://')) return uri;
  return `file://${uri.startsWith('/') ? '' : '/'}${uri}`;
}

/**
 * Выбрать фото из галереи или камеры.
 * Возвращает локальный URI файла в директории приложения.
 * Фото с камеры также сохраняется в галерею устройства.
 */
export async function pickAndSavePhoto(
  source: 'gallery' | 'camera'
): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const uri = asset.uri;
  const ext = (uri.split('.').pop()?.split('?')[0] || 'jpg').toLowerCase();
  const validExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const filename = `photo_${Date.now()}.${validExt}`;
  const destDir = await ensurePhotosDir();
  const destUri = `${destDir}${filename}`;

  await FileSystem.copyAsync({ from: uri, to: destUri });

  if (source === 'camera') {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(false);
      if (status === 'granted') {
        const fileUri = ensureFileUri(destUri);
        await MediaLibrary.saveToLibraryAsync(fileUri);
      }
    } catch {
      // Игнорируем ошибку сохранения в галерею — фото уже есть в приложении
    }
  }

  return destUri;
}
