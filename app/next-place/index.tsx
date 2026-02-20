import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Text } from 'react-native-paper';
import { formatDD } from '../../lib/coords';
import { getNextPlace } from '../../lib/db';
import { openInNavigatorWithChoice } from '../../lib/navigator';

export default function NextPlaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<Awaited<ReturnType<typeof getNextPlace>>>(null);
  const [loading, setLoading] = useState(true);

  const loadNextPlace = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getNextPlace();
      setData(next);
    } catch (e) {
      console.error('Ошибка загрузки следующего места:', e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNextPlace();
    }, [loadNextPlace])
  );

  const hasCoords = data?.place && (data.place.lat !== 0 || data.place.lon !== 0);

  const handleOpenMap = () => {
    if (data?.place) {
      router.push(`/places/${data.place.id}/map`);
    }
  };

  const handleOpenNavigator = () => {
    if (!data?.place || !hasCoords) return;
    openInNavigatorWithChoice(
      data.place.lat,
      data.place.lon,
      data.place.name
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('nextPlace.title')} />
      </Appbar.Header>

      {loading ? (
        <View style={styles.centered}>
          <Text variant="bodyLarge">{t('common.loading')}</Text>
        </View>
      ) : !data ? (
        <View style={styles.centered}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            {t('nextPlace.noNextPlace')}
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {t('nextPlace.noNextPlaceHint')}
          </Text>
          <Button
            mode="outlined"
            onPress={() => router.push('/trips')}
            style={styles.emptyButton}
          >
            {t('nextPlace.toTrips')}
          </Button>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text variant="labelLarge" style={styles.tripLabel}>
            {data.trip.title}
          </Text>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.placeName}>
                {data.place.name}
              </Text>
              {data.place.description ? (
                <Text variant="bodyMedium" style={styles.description}>
                  {data.place.description}
                </Text>
              ) : null}
              {hasCoords && (
                <Text variant="bodySmall" style={styles.coords}>
                  {formatDD(data.place.lat, data.place.lon)}
                </Text>
              )}
            </Card.Content>
          </Card>

          <View style={styles.buttons}>
            {hasCoords ? (
              <>
                <Button
                  mode="contained"
                  icon="map-marker"
                  onPress={handleOpenMap}
                  style={styles.button}
                >
                  {t('nextPlace.openOnMap')}
                </Button>
                <Button
                  mode="outlined"
                  icon="navigation"
                  onPress={handleOpenNavigator}
                  style={styles.button}
                >
                  {t('nextPlace.openInNavigator')}
                </Button>
              </>
            ) : (
              <Text variant="bodySmall" style={styles.noCoordsHint}>
                {t('nextPlace.noCoordsHint')}
              </Text>
            )}
            <Button
              mode="text"
              onPress={() => router.push(`/trips/${data.trip.id}`)}
              style={styles.button}
            >
              {t('nextPlace.goToTrip')}
            </Button>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 8,
  },
  tripLabel: {
    marginBottom: 8,
    color: '#666',
  },
  card: {
    marginBottom: 20,
  },
  placeName: {
    marginBottom: 8,
  },
  description: {
    marginTop: 4,
    color: '#444',
  },
  coords: {
    marginTop: 12,
    color: '#666',
  },
  buttons: {
    gap: 12,
  },
  button: {
    marginBottom: 4,
  },
  noCoordsHint: {
    color: '#666',
    fontStyle: 'italic',
  },
});
