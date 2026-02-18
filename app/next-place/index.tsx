import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Text } from 'react-native-paper';
import { formatDD } from '../../lib/coords';
import { getNextPlace } from '../../lib/db';

export default function NextPlaceScreen() {
  const router = useRouter();
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

  const handleOpenNavigator = async () => {
    if (!data?.place || !hasCoords) return;
    const { lat, lon } = data.place;
    const navUrl =
      Platform.OS === 'android'
        ? `google.navigation:q=${lat},${lon}`
        : `maps://?daddr=${lat},${lon}`;
    const geoUrl = `geo:${lat},${lon}`;
    try {
      await Linking.openURL(navUrl);
    } catch {
      try {
        await Linking.openURL(geoUrl);
      } catch (e) {
        console.error('Ошибка открытия навигатора:', e);
        Alert.alert('Ошибка', 'Не удалось открыть навигатор');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Следующее место" />
      </Appbar.Header>

      {loading ? (
        <View style={styles.centered}>
          <Text variant="bodyLarge">Загрузка...</Text>
        </View>
      ) : !data ? (
        <View style={styles.centered}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            Нет следующего места
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Создайте поездку, отметьте её как текущую и добавьте места в маршрут. Либо все места уже
            посещены.
          </Text>
          <Button
            mode="outlined"
            onPress={() => router.push('/trips')}
            style={styles.emptyButton}
          >
            К поездкам
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
                  Открыть на карте
                </Button>
                <Button
                  mode="outlined"
                  icon="navigation"
                  onPress={handleOpenNavigator}
                  style={styles.button}
                >
                  Открыть в навигаторе
                </Button>
              </>
            ) : (
              <Text variant="bodySmall" style={styles.noCoordsHint}>
                Координаты не заданы. Укажите их в редактировании места.
              </Text>
            )}
            <Button
              mode="text"
              onPress={() => router.push(`/trips/${data.trip.id}`)}
              style={styles.button}
            >
              Перейти к поездке
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
