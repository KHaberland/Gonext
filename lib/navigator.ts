/**
 * Открытие координат во внешнем навигаторе (Google Maps, Apple Maps и т.д.)
 */

import { Alert, Linking, Platform } from 'react-native';

/** URL-схемы для навигации по координатам */
const NAV_URLS = {
  /** Google Maps — маршрут до точки */
  google: (lat: number, lon: number) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
  /** Google Maps — intent для Android (навигация) */
  googleNav: (lat: number, lon: number) => `google.navigation:q=${lat},${lon}`,
  /** Apple Maps — маршрут */
  apple: (lat: number, lon: number) => `maps://?daddr=${lat},${lon}`,
  /** Универсальный geo — система выберет приложение */
  geo: (lat: number, lon: number) => `geo:${lat},${lon}`,
  /** Waze — если установлен */
  waze: (lat: number, lon: number) => `waze://?ll=${lat},${lon}&navigate=yes`,
};

/**
 * Открывает координаты во внешнем навигаторе.
 * Пробует несколько URL по очереди при ошибке.
 */
export async function openInNavigator(lat: number, lon: number): Promise<void> {
  const urlsToTry: string[] =
    Platform.OS === 'android'
      ? [NAV_URLS.googleNav(lat, lon), NAV_URLS.google(lat, lon), NAV_URLS.geo(lat, lon)]
      : [NAV_URLS.apple(lat, lon), NAV_URLS.google(lat, lon), NAV_URLS.geo(lat, lon)];

  for (const url of urlsToTry) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // Пробуем следующий URL
    }
  }

  // Fallback: пробуем открыть без проверки
  for (const url of urlsToTry) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // Продолжаем
    }
  }

  throw new Error('Не удалось открыть навигатор');
}

/**
 * Показывает диалог выбора приложения и открывает координаты.
 * На Android — сразу открывает (Google/системный).
 * На iOS — можно добавить ActionSheet при необходимости.
 */
export async function openInNavigatorWithChoice(
  lat: number,
  lon: number,
  placeName?: string
): Promise<void> {
  if (Platform.OS === 'ios') {
    Alert.alert(
      placeName ? `Открыть «${placeName}» в навигаторе` : 'Открыть в навигаторе',
      undefined,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Apple Карты',
          onPress: async () => {
            try {
              await Linking.openURL(NAV_URLS.apple(lat, lon));
            } catch {
              Alert.alert('Ошибка', 'Не удалось открыть Apple Карты');
            }
          },
        },
        {
          text: 'Google Карты',
          onPress: async () => {
            try {
              const url = NAV_URLS.google(lat, lon);
              const can = await Linking.canOpenURL(url);
              if (can) await Linking.openURL(url);
              else Alert.alert('Ошибка', 'Google Карты не установлены');
            } catch {
              Alert.alert('Ошибка', 'Не удалось открыть Google Карты');
            }
          },
        },
      ]
    );
  } else {
    try {
      await openInNavigator(lat, lon);
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть навигатор. Установите приложение карт.');
    }
  }
}
