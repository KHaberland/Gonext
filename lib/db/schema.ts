/**
 * SQL-схема базы данных GoNext.
 * Таблицы: places, trips, trip_places, place_photos, trip_place_photos, recordings.
 * Координаты мест (lat, lon) хранятся в формате Decimal Degrees (DD): широта -90..90, долгота -180..180.
 */

export const CREATE_TABLES = `
-- Места (режим «Места»)
CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  visit_later INTEGER NOT NULL DEFAULT 1,
  liked INTEGER NOT NULL DEFAULT 0,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Поездки
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  current INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Места в поездке (связь поездка — место, порядок, факт посещения)
CREATE TABLE IF NOT EXISTS trip_places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  visited INTEGER NOT NULL DEFAULT 0,
  visit_date TEXT,
  notes TEXT NOT NULL DEFAULT '',
  UNIQUE(trip_id, place_id)
);

-- Фото мест (режим «Места»)
CREATE TABLE IF NOT EXISTS place_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  file_uri TEXT NOT NULL
);

-- Фото мест в поездке
CREATE TABLE IF NOT EXISTS trip_place_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_place_id INTEGER NOT NULL REFERENCES trip_places(id) ON DELETE CASCADE,
  file_uri TEXT NOT NULL
);

-- Голосовые записи (привязка к месту или к точке маршрута)
CREATE TABLE IF NOT EXISTS recordings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audio_uri TEXT NOT NULL,
  transcribed_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
  trip_place_id INTEGER REFERENCES trip_places(id) ON DELETE CASCADE,
  CHECK ((place_id IS NOT NULL AND trip_place_id IS NULL) OR (place_id IS NULL AND trip_place_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_trip_places_trip ON trip_places(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_places_place ON trip_places(place_id);
CREATE INDEX IF NOT EXISTS idx_place_photos_place ON place_photos(place_id);
CREATE INDEX IF NOT EXISTS idx_trip_place_photos_trip_place ON trip_place_photos(trip_place_id);
CREATE INDEX IF NOT EXISTS idx_recordings_place ON recordings(place_id);
CREATE INDEX IF NOT EXISTS idx_recordings_trip_place ON recordings(trip_place_id);
`;
