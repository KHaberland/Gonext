/**
 * Утилиты для работы с координатами в формате Decimal Degrees (DD).
 * DD — десятичные градусы: широта -90..90, долгота -180..180.
 */

/** Широта: от -90 (юг) до 90 (север) */
export const DD_LAT_MIN = -90;
export const DD_LAT_MAX = 90;

/** Долгота: от -180 (запад) до 180 (восток) */
export const DD_LON_MIN = -180;
export const DD_LON_MAX = 180;

/**
 * Парсит строку в число (десятичные градусы).
 * Поддерживает запятую и точку как разделитель дробной части.
 */
export function parseDD(s: string): number {
  const n = parseFloat(s.trim().replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

/**
 * Парсит строку координат в формате Google Maps: "55.744920, 37.604677"
 * Возвращает { lat, lon } или { lat: 0, lon: 0 } при ошибке.
 */
export function parseCoordinates(s: string): { lat: number; lon: number } {
  const parts = s.trim().split(/[,\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const lat = parseDD(parts[0]);
    const lon = parseDD(parts[1]);
    return { lat, lon };
  }
  if (parts.length === 1) {
    const lat = parseDD(parts[0]);
    return { lat, lon: 0 };
  }
  return { lat: 0, lon: 0 };
}

/**
 * Результат валидации координат. При ошибке возвращается ключ для i18n.
 */
export type ValidateDDResult =
  | { valid: true }
  | { valid: false; errorKey: string; errorParams: { min: number; max: number } };

/**
 * Проверяет, что координаты в допустимом диапазоне DD.
 */
export function validateDD(lat: number, lon: number): ValidateDDResult {
  if (lat < DD_LAT_MIN || lat > DD_LAT_MAX) {
    return { valid: false, errorKey: 'coords.latRange', errorParams: { min: DD_LAT_MIN, max: DD_LAT_MAX } };
  }
  if (lon < DD_LON_MIN || lon > DD_LON_MAX) {
    return { valid: false, errorKey: 'coords.lonRange', errorParams: { min: DD_LON_MIN, max: DD_LON_MAX } };
  }
  return { valid: true };
}

/**
 * Форматирует координаты DD для отображения.
 */
export function formatDD(lat: number, lon: number, decimals = 5): string {
  return `${lat.toFixed(decimals)}, ${lon.toFixed(decimals)}`;
}
