import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { Appbar, Button, Text } from 'react-native-paper';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { getPlaceById } from '../../../lib/db';
import { openInNavigatorWithChoice } from '../../../lib/navigator';
import type { Place } from '../../../types';

/** OpenStreetMap тайлы с кэшированием для офлайн-работы */
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_CACHE_MAX_AGE = 7 * 24 * 60 * 60; // 7 дней в секундах

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
  const { t } = useTranslation();
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
          <Appbar.Content title={t('map.title')} />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text variant="bodyLarge">{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!hasValidCoords(place)) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={t('map.title')} />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text variant="bodyLarge">{t('map.noCoords')}</Text>
          <Text variant="bodyMedium" style={styles.hint}>
            {t('map.noCoordsHint')}
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

  const tileCachePath =
    FileSystem.cacheDirectory != null
      ? `${FileSystem.cacheDirectory}map-tiles`
      : undefined;

  const handleOpenNavigator = () => {
    openInNavigatorWithChoice(place.lat, place.lon, place.name);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={place.name} />
      </Appbar.Header>
      <MapView
        style={styles.map}
        initialRegion={region}
        mapType={Platform.OS === 'android' ? 'none' : undefined}
      >
        {Platform.OS === 'android' ? (
          <UrlTile
            urlTemplate={OSM_TILE_URL}
            tileCachePath={tileCachePath}
            tileCacheMaxAge={TILE_CACHE_MAX_AGE}
            offlineMode={!!tileCachePath}
            maximumZ={19}
            minimumZ={1}
          />
        ) : (
          <UrlTile
            urlTemplate={OSM_TILE_URL}
            tileCachePath={tileCachePath}
            tileCacheMaxAge={TILE_CACHE_MAX_AGE}
            shouldReplaceMapContent
            maximumZ={19}
            minimumZ={1}
          />
        )}
        <Marker
          coordinate={{ latitude: place.lat, longitude: place.lon }}
          title={place.name}
          description={place.description || undefined}
        />
      </MapView>
      <View style={styles.footer}>
        <Button
          mode="contained"
          icon="navigation"
          onPress={handleOpenNavigator}
          style={styles.navButton}
        >
          {t('map.openInNavigator')}
        </Button>
      </View>
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
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  navButton: {
    marginTop: 4,
  },
});
