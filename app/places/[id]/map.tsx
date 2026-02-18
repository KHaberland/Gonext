import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import { getPlaceById } from '../../../lib/db';
import type { Place } from '../../../types';

const DEFAULT_REGION = {
  latitude: 55.7558,
  longitude: 37.6173,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function hasValidCoords(place: Place): boolean {
  return place.lat !== 0 || place.lon !== 0;
}

export default function PlaceMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const placeId = parseInt(id ?? '0', 10);
  const [place, setPlace] = useState<Place | null>(null);

  const loadPlace = useCallback(async () => {
    if (!placeId) return;
    try {
      const p = await getPlaceById(placeId);
      setPlace(p ?? null);
    } catch (e) {
      console.error('Ошибка загрузки места:', e);
    }
  }, [placeId]);

  useEffect(() => {
    loadPlace();
  }, [loadPlace]);

  if (!place) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Карта" />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text variant="bodyLarge">Загрузка...</Text>
        </View>
      </View>
    );
  }

  if (!hasValidCoords(place)) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Карта" />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text variant="bodyLarge">Координаты не заданы.</Text>
          <Text variant="bodyMedium" style={styles.hint}>
            Укажите широту и долготу в редактировании места.
          </Text>
        </View>
      </View>
    );
  }

  const region = {
    latitude: place.lat,
    longitude: place.lon,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={place.name} />
      </Appbar.Header>
      <MapView style={styles.map} initialRegion={region}>
        <Marker
          coordinate={{ latitude: place.lat, longitude: place.lon }}
          title={place.name}
          description={place.description || undefined}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  hint: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
});
