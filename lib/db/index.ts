/**
 * Инициализация БД и слой доступа к данным.
 * При первом запуске создаёт таблицы.
 */

import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES } from './schema';
import type {
  Place,
  Trip,
  TripPlace,
  PlacePhoto,
  TripPlacePhoto,
  Recording,
  TripPlaceWithDetails,
} from '../../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('gonext.db');
  await db.execAsync(CREATE_TABLES);
  return db;
}

export function getDb(): SQLite.SQLiteDatabase | null {
  return db;
}

// --- Places ---

export async function getAllPlaces(): Promise<Place[]> {
  const database = db ?? await initDatabase();
  const rows = await database.getAllAsync<PlaceRow>(
    'SELECT id, name, description, visit_later AS visitLater, liked, lat, lon, created_at AS createdAt FROM places ORDER BY created_at DESC'
  );
  return rows.map(rowToPlace);
}

export async function getPlaceById(id: number): Promise<Place | null> {
  const database = db ?? await initDatabase();
  const row = await database.getFirstAsync<PlaceRow>(
    'SELECT id, name, description, visit_later AS visitLater, liked, lat, lon, created_at AS createdAt FROM places WHERE id = ?',
    [id]
  );
  return row ? rowToPlace(row) : null;
}

export async function insertPlace(place: Omit<Place, 'id' | 'createdAt'>): Promise<number> {
  const database = db ?? await initDatabase();
  const result = await database.runAsync(
    'INSERT INTO places (name, description, visit_later, liked, lat, lon) VALUES (?, ?, ?, ?, ?, ?)',
    [place.name, place.description, place.visitLater ? 1 : 0, place.liked ? 1 : 0, place.lat, place.lon]
  );
  return result.lastInsertRowId;
}

export async function updatePlace(id: number, place: Partial<Omit<Place, 'id' | 'createdAt'>>): Promise<void> {
  const database = db ?? await initDatabase();
  const fields: string[] = [];
  const values: (string | number | boolean)[] = [];
  if (place.name !== undefined) {
    fields.push('name = ?');
    values.push(place.name);
  }
  if (place.description !== undefined) {
    fields.push('description = ?');
    values.push(place.description);
  }
  if (place.visitLater !== undefined) {
    fields.push('visit_later = ?');
    values.push(place.visitLater ? 1 : 0);
  }
  if (place.liked !== undefined) {
    fields.push('liked = ?');
    values.push(place.liked ? 1 : 0);
  }
  if (place.lat !== undefined) {
    fields.push('lat = ?');
    values.push(place.lat);
  }
  if (place.lon !== undefined) {
    fields.push('lon = ?');
    values.push(place.lon);
  }
  if (fields.length === 0) return;
  values.push(id);
  await database.runAsync(`UPDATE places SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deletePlace(id: number): Promise<void> {
  const database = db ?? await initDatabase();
  await database.runAsync('DELETE FROM places WHERE id = ?', [id]);
}

// --- Place photos ---

export async function getPlacePhotos(placeId: number): Promise<PlacePhoto[]> {
  const database = db ?? await initDatabase();
  const rows = await database.getAllAsync<{ id: number; place_id: number; file_uri: string }>(
    'SELECT id, place_id, file_uri FROM place_photos WHERE place_id = ?',
    [placeId]
  );
  return rows.map((r) => ({ id: r.id, placeId: r.place_id, fileUri: r.file_uri }));
}

export async function addPlacePhoto(placeId: number, fileUri: string): Promise<number> {
  const database = db ?? await initDatabase();
  const result = await database.runAsync('INSERT INTO place_photos (place_id, file_uri) VALUES (?, ?)', [
    placeId,
    fileUri,
  ]);
  return result.lastInsertRowId;
}

export async function deletePlacePhoto(id: number): Promise<void> {
  const database = db ?? await initDatabase();
  await database.runAsync('DELETE FROM place_photos WHERE id = ?', [id]);
}

// --- Trips ---

export async function getAllTrips(): Promise<Trip[]> {
  const database = db ?? await initDatabase();
  const rows = await database.getAllAsync<TripRow>(
    'SELECT id, title, description, start_date AS startDate, end_date AS endDate, current, created_at AS createdAt FROM trips ORDER BY start_date DESC'
  );
  return rows.map(rowToTrip);
}

export async function getTripById(id: number): Promise<Trip | null> {
  const database = db ?? await initDatabase();
  const row = await database.getFirstAsync<TripRow>(
    'SELECT id, title, description, start_date AS startDate, end_date AS endDate, current, created_at AS createdAt FROM trips WHERE id = ?',
    [id]
  );
  return row ? rowToTrip(row) : null;
}

export async function getCurrentTrip(): Promise<Trip | null> {
  const database = db ?? await initDatabase();
  const row = await database.getFirstAsync<TripRow>(
    'SELECT id, title, description, start_date AS startDate, end_date AS endDate, current, created_at AS createdAt FROM trips WHERE current = 1 LIMIT 1'
  );
  return row ? rowToTrip(row) : null;
}

/** Следующее место: первое непосещённое в активной поездке */
export async function getNextPlace(): Promise<{
  trip: Trip;
  tripPlace: TripPlace;
  place: Place;
} | null> {
  const trip = await getCurrentTrip();
  if (!trip) return null;

  const tripPlaces = await getTripPlaces(trip.id);
  const next = tripPlaces.find((tp) => !tp.visited);
  if (!next) return null;

  const place = await getPlaceById(next.placeId);
  if (!place) return null;

  return { trip, tripPlace: next, place };
}

export async function insertTrip(trip: Omit<Trip, 'id' | 'createdAt'>): Promise<number> {
  const database = db ?? await initDatabase();
  if (trip.current) {
    await database.runAsync('UPDATE trips SET current = 0');
  }
  const result = await database.runAsync(
    'INSERT INTO trips (title, description, start_date, end_date, current) VALUES (?, ?, ?, ?, ?)',
    [trip.title, trip.description, trip.startDate, trip.endDate, trip.current ? 1 : 0]
  );
  return result.lastInsertRowId;
}

export async function updateTrip(id: number, trip: Partial<Omit<Trip, 'id' | 'createdAt'>>): Promise<void> {
  const database = db ?? await initDatabase();
  if (trip.current) {
    await database.runAsync('UPDATE trips SET current = 0');
  }
  const fields: string[] = [];
  const values: (string | number)[] = [];
  if (trip.title !== undefined) {
    fields.push('title = ?');
    values.push(trip.title);
  }
  if (trip.description !== undefined) {
    fields.push('description = ?');
    values.push(trip.description);
  }
  if (trip.startDate !== undefined) {
    fields.push('start_date = ?');
    values.push(trip.startDate);
  }
  if (trip.endDate !== undefined) {
    fields.push('end_date = ?');
    values.push(trip.endDate);
  }
  if (trip.current !== undefined) {
    fields.push('current = ?');
    values.push(trip.current ? 1 : 0);
  }
  if (fields.length === 0) return;
  values.push(id);
  await database.runAsync(`UPDATE trips SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteTrip(id: number): Promise<void> {
  const database = db ?? await initDatabase();
  await database.runAsync('DELETE FROM trips WHERE id = ?', [id]);
}

// --- Trip places ---

export async function getTripPlaces(tripId: number): Promise<TripPlace[]> {
  const database = db ?? await initDatabase();
  const rows = await database.getAllAsync<TripPlaceRow>(
    'SELECT id, trip_id AS tripId, place_id AS placeId, "order" AS "order", visited, visit_date AS visitDate, notes FROM trip_places WHERE trip_id = ? ORDER BY "order"',
    [tripId]
  );
  return rows.map(rowToTripPlace);
}

export async function getTripPlacesWithDetails(tripId: number): Promise<TripPlaceWithDetails[]> {
  const tripPlaces = await getTripPlaces(tripId);
  const result: TripPlaceWithDetails[] = [];

  for (const tp of tripPlaces) {
    const [place, photos, recordings] = await Promise.all([
      getPlaceById(tp.placeId),
      getTripPlacePhotos(tp.id),
      getRecordingsByTripPlaceId(tp.id),
    ]);
    result.push({
      ...tp,
      place: place ?? undefined,
      photos,
      recordings,
    });
  }
  return result;
}

export async function getTripPlaceById(id: number): Promise<TripPlace | null> {
  const database = db ?? await initDatabase();
  const row = await database.getFirstAsync<TripPlaceRow>(
    'SELECT id, trip_id AS tripId, place_id AS placeId, "order" AS "order", visited, visit_date AS visitDate, notes FROM trip_places WHERE id = ?',
    [id]
  );
  return row ? rowToTripPlace(row) : null;
}

export async function insertTripPlace(tp: Omit<TripPlace, 'id'>): Promise<number> {
  const database = db ?? await initDatabase();
  const result = await database.runAsync(
    'INSERT INTO trip_places (trip_id, place_id, "order", visited, visit_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [tp.tripId, tp.placeId, tp.order, tp.visited ? 1 : 0, tp.visitDate ?? null, tp.notes ?? '']
  );
  return result.lastInsertRowId;
}

export async function updateTripPlace(id: number, tp: Partial<Omit<TripPlace, 'id' | 'tripId' | 'placeId'>>): Promise<void> {
  const database = db ?? await initDatabase();
  const fields: string[] = [];
  const values: (string | number | boolean | null)[] = [];
  if (tp.order !== undefined) {
    fields.push('"order" = ?');
    values.push(tp.order);
  }
  if (tp.visited !== undefined) {
    fields.push('visited = ?');
    values.push(tp.visited ? 1 : 0);
  }
  if (tp.visitDate !== undefined) {
    fields.push('visit_date = ?');
    values.push(tp.visitDate);
  }
  if (tp.notes !== undefined) {
    fields.push('notes = ?');
    values.push(tp.notes);
  }
  if (fields.length === 0) return;
  values.push(id);
  await database.runAsync(`UPDATE trip_places SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteTripPlace(id: number): Promise<void> {
  const database = db ?? await initDatabase();
  await database.runAsync('DELETE FROM trip_places WHERE id = ?', [id]);
}

// --- Trip place photos ---

export async function getTripPlacePhotos(tripPlaceId: number): Promise<TripPlacePhoto[]> {
  const database = db ?? await initDatabase();
  const rows = await database.getAllAsync<{ id: number; trip_place_id: number; file_uri: string }>(
    'SELECT id, trip_place_id, file_uri FROM trip_place_photos WHERE trip_place_id = ?',
    [tripPlaceId]
  );
  return rows.map((r) => ({ id: r.id, tripPlaceId: r.trip_place_id, fileUri: r.file_uri }));
}

export async function addTripPlacePhoto(tripPlaceId: number, fileUri: string): Promise<number> {
  const database = db ?? await initDatabase();
  const result = await database.runAsync(
    'INSERT INTO trip_place_photos (trip_place_id, file_uri) VALUES (?, ?)',
    [tripPlaceId, fileUri]
  );
  return result.lastInsertRowId;
}

export async function deleteTripPlacePhoto(id: number): Promise<void> {
  const database = db ?? await initDatabase();
  await database.runAsync('DELETE FROM trip_place_photos WHERE id = ?', [id]);
}

// --- Recordings ---

export async function getRecordingsByPlaceId(placeId: number): Promise<Recording[]> {
  const database = db ?? await initDatabase();
  const rows = await database.getAllAsync<RecordingRow>(
    'SELECT id, audio_uri AS audioUri, transcribed_text AS transcribedText, created_at AS createdAt, place_id AS placeId, trip_place_id AS tripPlaceId FROM recordings WHERE place_id = ? ORDER BY created_at',
    [placeId]
  );
  return rows.map(rowToRecording);
}

export async function getRecordingsByTripPlaceId(tripPlaceId: number): Promise<Recording[]> {
  const database = db ?? await initDatabase();
  const rows = await database.getAllAsync<RecordingRow>(
    'SELECT id, audio_uri AS audioUri, transcribed_text AS transcribedText, created_at AS createdAt, place_id AS placeId, trip_place_id AS tripPlaceId FROM recordings WHERE trip_place_id = ? ORDER BY created_at',
    [tripPlaceId]
  );
  return rows.map(rowToRecording);
}

export async function insertRecording(r: {
  audioUri: string;
  transcribedText?: string | null;
  placeId?: number | null;
  tripPlaceId?: number | null;
}): Promise<number> {
  const database = db ?? await initDatabase();
  const result = await database.runAsync(
    'INSERT INTO recordings (audio_uri, transcribed_text, place_id, trip_place_id) VALUES (?, ?, ?, ?)',
    [r.audioUri, r.transcribedText ?? null, r.placeId ?? null, r.tripPlaceId ?? null]
  );
  return result.lastInsertRowId;
}

export async function updateRecordingTranscribedText(id: number, transcribedText: string): Promise<void> {
  const database = db ?? await initDatabase();
  await database.runAsync('UPDATE recordings SET transcribed_text = ? WHERE id = ?', [transcribedText, id]);
}

export async function deleteRecording(id: number): Promise<void> {
  const database = db ?? await initDatabase();
  await database.runAsync('DELETE FROM recordings WHERE id = ?', [id]);
}

// --- Helpers (row types and mappers) ---

interface PlaceRow {
  id: number;
  name: string;
  description: string;
  visitLater: number;
  liked: number;
  lat: number;
  lon: number;
  createdAt: string;
}

interface TripRow {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  current: number;
  createdAt: string;
}

interface TripPlaceRow {
  id: number;
  tripId: number;
  placeId: number;
  order: number;
  visited: number;
  visitDate: string | null;
  notes: string;
}

interface RecordingRow {
  id: number;
  audioUri: string;
  transcribedText: string | null;
  createdAt: string;
  placeId: number | null;
  tripPlaceId: number | null;
}

function rowToPlace(r: PlaceRow): Place {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    visitLater: r.visitLater === 1,
    liked: r.liked === 1,
    lat: r.lat,
    lon: r.lon,
    createdAt: r.createdAt,
  };
}

function rowToTrip(r: TripRow): Trip {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    startDate: r.startDate,
    endDate: r.endDate,
    current: r.current === 1,
    createdAt: r.createdAt,
  };
}

function rowToTripPlace(r: TripPlaceRow): TripPlace {
  return {
    id: r.id,
    tripId: r.tripId,
    placeId: r.placeId,
    order: r.order,
    visited: r.visited === 1,
    visitDate: r.visitDate,
    notes: r.notes,
  };
}

function rowToRecording(r: RecordingRow): Recording {
  return {
    id: r.id,
    audioUri: r.audioUri,
    transcribedText: r.transcribedText,
    createdAt: r.createdAt,
    placeId: r.placeId,
    tripPlaceId: r.tripPlaceId,
  };
}
