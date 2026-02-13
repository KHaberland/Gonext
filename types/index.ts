/**
 * Типы сущностей приложения GoNext (PROJECT.md)
 */

export interface Place {
  id: number;
  name: string;
  description: string;
  visitLater: boolean;
  liked: boolean;
  lat: number;
  lon: number;
  createdAt: string;
}

export interface PlacePhoto {
  id: number;
  placeId: number;
  fileUri: string;
}

export interface Trip {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  current: boolean;
  createdAt: string;
}

export interface TripPlace {
  id: number;
  tripId: number;
  placeId: number;
  order: number;
  visited: boolean;
  visitDate: string | null;
  notes: string;
}

export interface TripPlacePhoto {
  id: number;
  tripPlaceId: number;
  fileUri: string;
}

export interface Recording {
  id: number;
  audioUri: string;
  transcribedText: string | null;
  createdAt: string;
  placeId: number | null;
  tripPlaceId: number | null;
}

/** Место с подгруженными фото и записями (для экранов) */
export interface PlaceWithMedia extends Place {
  photos: PlacePhoto[];
  recordings: Recording[];
}

/** Место в поездке с подгруженными данными места, фото и записями */
export interface TripPlaceWithDetails extends TripPlace {
  place?: Place;
  photos: TripPlacePhoto[];
  recordings: Recording[];
}
